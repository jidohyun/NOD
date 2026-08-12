# NOD Backend Monitoring System 설계 문서

> **작성일:** 2026-03-07
> **대상:** `apps/api` (FastAPI, Python 3.12, Railway)
> **목표:** 무료/최소 비용으로 프로덕션 모니터링 체계 구축

---

## 1. 현재 상태 분석

### 1.1 이미 갖춰진 인프라 (활용 가능)

| 구성요소 | 현재 상태 | 파일 |
|---------|----------|------|
| **Structured Logging** | structlog + JSON 출력 (production) | `src/lib/logging.py` |
| **OpenTelemetry Tracing** | TracerProvider + OTLP 설정 완료, FastAPI/SQLAlchemy/HTTPX/Redis instrumentation | `src/lib/telemetry.py` |
| **Request ID** | UUID 기반 request_id middleware, span attribute 연동 | `src/main.py:49-67` |
| **Global Exception Handler** | 500 에러 시 structlog + span에 exception 기록 | `src/main.py:81-115` |
| **Health Check** | `/health`, `/health/live`, `/health/ready` (DB, Redis 상태 확인) | `src/main.py:144-234` |
| **AI Observability** | Langfuse 클라이언트 (optional, key 설정 시 활성화) | `src/lib/langfuse_client.py` |
| **Trace Context in Logs** | trace_id, span_id가 로그에 자동 포함 | `src/lib/logging.py:13-24` |

### 1.2 부족한 부분 (해결 필요)

| 문제 | 설명 |
|------|------|
| **Metrics 수집 없음** | request count, latency, error rate 등 수치 메트릭이 전혀 없음 |
| **Error Tracking 없음** | exception 발생 시 로그만 남고, 알림/집계/추적 없음 |
| **Alerting 없음** | 5xx 급증, AI 요약 실패, DB 장애 등 감지/알림 수단 없음 |
| **Uptime Monitoring 없음** | 서비스 다운 감지 불가 |
| **DB Connection Pool 모니터링 없음** | `create_async_engine`에 pool_pre_ping만 설정, pool 상태 노출 없음 |
| **AI 요약 성공/실패율 추적 없음** | `_run_analysis`에서 로그만 남기고 메트릭 미수집 |
| **Background Task 모니터링 없음** | `asyncio.create_task`로 실행되는 분석 태스크 상태 추적 불가 |
| **OTLP Endpoint 미설정** | `OTEL_EXPORTER_OTLP_ENDPOINT`가 None이면 trace가 어디에도 전송 안 됨 |

### 1.3 API 엔드포인트 전체 목록

| Router | Prefix | 주요 엔드포인트 |
|--------|--------|----------------|
| **auth** | `/api/auth` | `POST /login`, `POST /register`, `POST /login/credentials`, `POST /refresh`, `POST /extension-refresh`, `POST /logout` |
| **articles** | `/api/articles` | `POST /` (생성+분석), `GET /` (목록), `GET /search` (시맨틱), `GET /stats/content-types`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`, `GET /{id}/similar`, `POST /{id}/retry`, `POST /analyze-url` |
| **subscriptions** | `/api/subscriptions` | `GET /usage`, `GET /current`, `POST /checkout`, `GET /portal-url`, `POST /webhook` |
| **users** | `/api/users` | `GET /me`, `PATCH /me` |
| **health** | `/` (root) | `GET /health`, `GET /health/live`, `GET /health/ready` |

### 1.4 핵심 비즈니스 플로우 (모니터링 우선순위)

```
1. 아티클 저장 + AI 요약 (POST /api/articles, POST /api/articles/analyze-url)
   -> content 추출 -> AI 요약 (Gemini/OpenAI) -> DB 저장 -> embedding 생성
   -> 실패 시 status="failed"로 업데이트

2. 시맨틱 검색 (GET /api/articles/search)
   -> embedding 생성 -> cosine similarity 검색
   -> 실패 시 text search fallback

3. 인증 (POST /api/auth/login, /refresh)
   -> OAuth 토큰 검증 -> JWT/JWE 발급

4. 구독/결제 (POST /api/subscriptions/webhook)
   -> Paddle webhook -> 구독 상태 업데이트
```

---

## 2. 도구 선정

### 2.1 최종 도구 스택

| 영역 | 도구 | 비용 | 역할 |
|------|------|------|------|
| **Error Tracking** | Sentry (Free tier) | 무료 (5K errors/월) | Exception 추적, 알림, release tracking |
| **Metrics + Dashboard** | Grafana Cloud (Free tier) | 무료 (10K metrics, 50GB logs, 50GB traces/월) | 메트릭 시각화, 로그 집계, trace 뷰어 |
| **Uptime Monitoring** | UptimeRobot (Free tier) | 무료 (50 monitors, 5분 간격) | 엔드포인트 활성 감시, 다운 알림 |
| **Alerting** | Discord Webhook | 무료 | Sentry/UptimeRobot/Grafana 알림 수신 |
| **AI Observability** | Langfuse (이미 설정됨) | 무료 (Cloud free tier) | AI 요약 품질/비용 추적 |

### 2.2 도구별 Free Tier 한도

**Sentry Free:**
- 5,000 errors/월, 10,000 transactions/월
- 1 user, 30일 data retention
- Discord/Slack/Email 알림

**Grafana Cloud Free:**
- 10,000 active metrics series
- 50GB logs, 50GB traces/월
- 14일 retention (metrics 기본), 30일 (logs)
- 3 users

**UptimeRobot Free:**
- 50 monitors
- 5분 check interval
- Email/Webhook 알림

---

## 3. 구현 계획

### Phase 1: Sentry 통합 (Error Tracking + Performance)

**목표:** 모든 unhandled exception과 주요 transaction을 Sentry로 전송

#### 3.1.1 패키지 설치

```toml
# apps/api/pyproject.toml - dependencies에 추가
"sentry-sdk[fastapi]>=2.0.0",
```

#### 3.1.2 Sentry 초기화 모듈 생성

**새 파일:** `apps/api/src/lib/sentry.py`

```python
"""Sentry SDK initialization for error tracking and performance monitoring."""

import sentry_sdk
from sentry_sdk.integrations.asyncio import AsyncioIntegration
from sentry_sdk.integrations.httpx import HttpxIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.fastapi import FastApiIntegration

from src.lib.config import settings


def configure_sentry() -> None:
    """Initialize Sentry SDK if DSN is configured."""
    if not settings.SENTRY_DSN:
        return

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.PROJECT_ENV,
        release=f"nod-api@{settings.APP_VERSION}",

        # Performance monitoring
        traces_sample_rate=0.1 if settings.PROJECT_ENV == "prod" else 1.0,
        profiles_sample_rate=0.1 if settings.PROJECT_ENV == "prod" else 1.0,

        # Error filtering
        before_send=_before_send,

        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
            HttpxIntegration(),
            AsyncioIntegration(),
        ],

        # Scrub sensitive data
        send_default_pii=False,
    )


def _before_send(event: dict, hint: dict) -> dict | None:
    """Filter out noisy or expected errors."""
    if "exc_info" in hint:
        exc_type, exc_value, _ = hint["exc_info"]
        # 사용자 입력 오류는 Sentry에 보내지 않음
        from fastapi import HTTPException
        if isinstance(exc_value, HTTPException) and exc_value.status_code < 500:
            return None
    return event
```

#### 3.1.3 Config에 환경변수 추가

**수정 파일:** `apps/api/src/lib/config.py`

```python
# Settings 클래스에 추가
# Sentry
SENTRY_DSN: str | None = None
APP_VERSION: str = "0.1.0"

# Monitoring
DISCORD_WEBHOOK_URL: str | None = None
```

#### 3.1.4 main.py에 Sentry 초기화 연결

**수정 파일:** `apps/api/src/main.py`

```python
# configure_logging() 직후에 추가
from src.lib.sentry import configure_sentry
configure_sentry()
```

`global_exception_handler`에 Sentry context 추가:

```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # 기존 코드 유지...

    # Sentry에 user context 추가
    import sentry_sdk
    sentry_sdk.set_context("request", {
        "request_id": request_id,
        "path": request.url.path,
        "method": request.method,
    })

    # 나머지 기존 코드...
```

#### 3.1.5 AI 요약 실패에 Sentry context 추가

**수정 파일:** `apps/api/src/articles/router.py` - `_run_analysis` 함수

```python
except Exception as e:
    # 기존 로그 코드 유지...

    # Sentry에 비즈니스 context 추가
    import sentry_sdk
    sentry_sdk.set_context("article_analysis", {
        "article_id": str(article_id),
        "provider": provider,
        "content_length": len(content),
        "summary_language": summary_language,
    })
    sentry_sdk.set_tag("ai.provider", provider)
    sentry_sdk.set_tag("analysis.failed", "true")
```

#### 3.1.6 Sentry 프로젝트 설정 (sentry.io)

1. https://sentry.io 에서 무료 계정 생성
2. 새 프로젝트 생성: Platform = "Python", Framework = "FastAPI"
3. DSN 복사 -> Railway 환경변수에 `SENTRY_DSN` 설정
4. **Alerts 설정:**
   - Alert Rule: "5xx Error Rate > 5% in 5 minutes" -> Discord webhook
   - Alert Rule: "New Issue (first occurrence)" -> Discord webhook
5. **Discord Integration:**
   - Settings > Integrations > Discord > Install
   - 또는 Settings > Integrations > Webhooks > Discord webhook URL 등록

#### 3.1.7 Railway 환경변수

```
SENTRY_DSN=https://xxx@o123.ingest.sentry.io/456
APP_VERSION=0.1.0
```

---

### Phase 2: Prometheus Metrics (Application Metrics)

**목표:** request latency, error rate, AI 요약 성공/실패율 등 수치 메트릭 수집

#### 3.2.1 패키지 설치

```toml
# apps/api/pyproject.toml - dependencies에 추가
"prometheus-client>=0.21.0",
"prometheus-fastapi-instrumentator>=7.0.0",
```

#### 3.2.2 Metrics 모듈 생성

**새 파일:** `apps/api/src/lib/metrics.py`

```python
"""Prometheus metrics for application monitoring."""

from prometheus_client import Counter, Histogram, Gauge, Info

# --- HTTP Request Metrics (prometheus-fastapi-instrumentator가 자동 수집) ---

# --- AI Summarization Metrics ---
AI_SUMMARY_REQUESTS = Counter(
    "nod_ai_summary_requests_total",
    "Total AI summarization requests",
    ["provider", "content_type", "status"],  # status: success, failed, timeout
)

AI_SUMMARY_DURATION = Histogram(
    "nod_ai_summary_duration_seconds",
    "AI summarization duration in seconds",
    ["provider", "content_type"],
    buckets=[1, 2, 5, 10, 15, 30, 45, 60, 90, 120],
)

# --- Article Metrics ---
ARTICLE_SAVE_REQUESTS = Counter(
    "nod_article_save_requests_total",
    "Total article save requests",
    ["status"],  # status: success, failed, duplicate
)

ARTICLE_STATUS_TRANSITIONS = Counter(
    "nod_article_status_transitions_total",
    "Article status transitions",
    ["from_status", "to_status"],
)

# --- Search Metrics ---
SEARCH_REQUESTS = Counter(
    "nod_search_requests_total",
    "Total search requests",
    ["type"],  # type: semantic, fallback_text
)

SEARCH_DURATION = Histogram(
    "nod_search_duration_seconds",
    "Search request duration",
    ["type"],
    buckets=[0.1, 0.25, 0.5, 1, 2, 5],
)

# --- Auth Metrics ---
AUTH_REQUESTS = Counter(
    "nod_auth_requests_total",
    "Total authentication requests",
    ["method", "status"],  # method: oauth, credentials, refresh; status: success, failed
)

# --- Database Pool Metrics ---
DB_POOL_SIZE = Gauge(
    "nod_db_pool_size",
    "Current database connection pool size",
)

DB_POOL_CHECKED_IN = Gauge(
    "nod_db_pool_checked_in",
    "Number of connections currently checked in to the pool",
)

DB_POOL_CHECKED_OUT = Gauge(
    "nod_db_pool_checked_out",
    "Number of connections currently checked out from the pool",
)

DB_POOL_OVERFLOW = Gauge(
    "nod_db_pool_overflow",
    "Current overflow connections beyond pool size",
)

# --- Background Task Metrics ---
BACKGROUND_TASKS_ACTIVE = Gauge(
    "nod_background_tasks_active",
    "Number of currently active background analysis tasks",
)

# --- App Info ---
APP_INFO = Info(
    "nod_app",
    "Application information",
)
```

#### 3.2.3 Metrics 계측 코드 삽입 포인트

**수정 파일:** `apps/api/src/articles/router.py` - `_run_analysis` 함수

```python
import time
from src.lib.metrics import (
    AI_SUMMARY_REQUESTS,
    AI_SUMMARY_DURATION,
    ARTICLE_SAVE_REQUESTS,
    BACKGROUND_TASKS_ACTIVE,
)

async def _run_analysis(...) -> bool:
    BACKGROUND_TASKS_ACTIVE.inc()
    start_time = time.monotonic()
    try:
        # ... 기존 AI 요약 코드 ...

        duration = time.monotonic() - start_time
        AI_SUMMARY_DURATION.labels(
            provider=provider,
            content_type=str(analysis_content_type),
        ).observe(duration)
        AI_SUMMARY_REQUESTS.labels(
            provider=provider,
            content_type=str(analysis_content_type),
            status="success",
        ).inc()
        ARTICLE_SAVE_REQUESTS.labels(status="success").inc()

        return True
    except TimeoutError:
        AI_SUMMARY_REQUESTS.labels(
            provider=provider,
            content_type=str(analysis_content_type),
            status="timeout",
        ).inc()
        # ... 기존 retry 로직 ...
    except Exception as e:
        duration = time.monotonic() - start_time
        AI_SUMMARY_DURATION.labels(
            provider=provider,
            content_type=str(analysis_content_type),
        ).observe(duration)
        AI_SUMMARY_REQUESTS.labels(
            provider=provider,
            content_type=str(analysis_content_type),
            status="failed",
        ).inc()
        ARTICLE_SAVE_REQUESTS.labels(status="failed").inc()
        # ... 기존 에러 처리 ...
    finally:
        BACKGROUND_TASKS_ACTIVE.dec()
```

**수정 파일:** `apps/api/src/articles/router.py` - `search_articles` 함수

```python
from src.lib.metrics import SEARCH_REQUESTS, SEARCH_DURATION

@router.get("/search", ...)
async def search_articles(...):
    start_time = time.monotonic()
    try:
        embedding = await ai.generate_embedding(q)
        result = await service.search_articles_semantic(...)
        SEARCH_REQUESTS.labels(type="semantic").inc()
        SEARCH_DURATION.labels(type="semantic").observe(time.monotonic() - start_time)
        return result
    except Exception:
        logger.warning("Semantic search failed, falling back to text search", query=q)
        result = await service.list_articles(...)
        SEARCH_REQUESTS.labels(type="fallback_text").inc()
        SEARCH_DURATION.labels(type="fallback_text").observe(time.monotonic() - start_time)
        return result
```

#### 3.2.4 DB Pool 메트릭 수집

**수정 파일:** `apps/api/src/lib/database.py`

```python
from src.lib.metrics import (
    DB_POOL_SIZE,
    DB_POOL_CHECKED_IN,
    DB_POOL_CHECKED_OUT,
    DB_POOL_OVERFLOW,
)

def update_pool_metrics() -> None:
    """Update database connection pool metrics."""
    pool = engine.pool
    DB_POOL_SIZE.set(pool.size())
    DB_POOL_CHECKED_IN.set(pool.checkedin())
    DB_POOL_CHECKED_OUT.set(pool.checkedout())
    DB_POOL_OVERFLOW.set(pool.overflow())
```

#### 3.2.5 Prometheus 엔드포인트 및 FastAPI instrumentator 설정

**수정 파일:** `apps/api/src/main.py`

```python
from prometheus_fastapi_instrumentator import Instrumentator

# app 생성 직후에 추가
instrumentator = Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
    should_respect_env_var=False,
    excluded_handlers=["/health", "/health/live", "/health/ready", "/metrics"],
    inprogress_name="nod_http_requests_inprogress",
    inprogress_labels=True,
)

# lifespan의 startup에 추가
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info("Starting application", env=settings.PROJECT_ENV)
    configure_telemetry()
    instrument_app(app)

    # Prometheus instrumentator
    instrumentator.instrument(app).expose(
        app,
        endpoint="/metrics",
        include_in_schema=False,
    )

    # App info metric
    from src.lib.metrics import APP_INFO
    APP_INFO.info({
        "version": "0.1.0",
        "environment": settings.PROJECT_ENV,
    })

    yield
    logger.info("Shutting down application")
```

#### 3.2.6 `/metrics` 엔드포인트에 DB pool 메트릭 포함

health check에 pool metrics 업데이트를 추가하거나, `/metrics` 호출 시마다 갱신:

```python
# main.py - health_check 함수에 추가
@app.get("/health")
async def health_check() -> HealthResponse:
    # DB pool metrics 갱신
    from src.lib.database import update_pool_metrics
    update_pool_metrics()

    # ... 기존 코드 ...
```

---

### Phase 3: Grafana Cloud 연동 (Dashboards + Logs + Traces)

**목표:** Prometheus 메트릭, Railway 로그, OpenTelemetry trace를 Grafana Cloud에 통합

#### 3.3.1 Grafana Cloud 설정

1. https://grafana.com/products/cloud/ 에서 무료 계정 생성
2. Stack 생성 후 다음 정보 확인:
   - **Prometheus Remote Write URL:** `https://prometheus-prod-XX-YYY.grafana.net/api/prom/push`
   - **Loki Push URL:** `https://logs-prod-XX.grafana.net/loki/api/v1/push`
   - **Tempo OTLP Endpoint:** `https://tempo-prod-XX-YYY.grafana.net:443`
   - **User ID / API Key:** Stack > Details에서 확인

#### 3.3.2 OpenTelemetry -> Grafana Tempo (Traces)

**수정 파일:** `apps/api/src/lib/telemetry.py`

Railway 환경변수에 Grafana Tempo OTLP endpoint 설정:

```
OTEL_EXPORTER_OTLP_ENDPOINT=https://tempo-prod-XX-YYY.grafana.net:443
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64(instanceID:apiKey)>
```

현재 코드는 이미 `OTEL_EXPORTER_OTLP_ENDPOINT`가 설정되면 OTLP exporter를 생성하므로, **환경변수만 설정하면 trace 전송이 활성화됨.** 단, authentication header가 필요하므로 코드를 약간 수정:

```python
# telemetry.py 수정
def configure_telemetry() -> None:
    resource = Resource.create({
        "service.name": settings.PROJECT_NAME,
        "service.version": settings.APP_VERSION,
        "deployment.environment": settings.PROJECT_ENV,
    })

    provider = TracerProvider(resource=resource)

    if settings.OTEL_EXPORTER_OTLP_ENDPOINT:
        # OTLP headers for authentication (Grafana Cloud)
        headers = settings.OTEL_EXPORTER_OTLP_HEADERS or None
        otlp_exporter = OTLPSpanExporter(
            endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT,
            headers=_parse_headers(headers) if headers else None,
            insecure=settings.PROJECT_ENV != "prod",
        )
        provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
    elif settings.PROJECT_ENV == "local":
        provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))

    trace.set_tracer_provider(provider)


def _parse_headers(header_str: str) -> dict[str, str]:
    """Parse 'Key=Value,Key2=Value2' format headers."""
    headers = {}
    for item in header_str.split(","):
        if "=" in item:
            key, value = item.split("=", 1)
            headers[key.strip()] = value.strip()
    return headers
```

**Config에 추가:**
```python
# config.py Settings 클래스
OTEL_EXPORTER_OTLP_HEADERS: str | None = None
```

#### 3.3.3 Prometheus Metrics -> Grafana Cloud

**방법 A (권장): Grafana Alloy (경량 agent)**

Railway에서 사이드카로 Grafana Alloy를 운영하기 어려우므로, **Prometheus Remote Write를 직접 사용**.

**패키지 추가:**
```toml
"prometheus-client>=0.21.0",  # 이미 Phase 2에서 추가
```

**새 파일:** `apps/api/src/lib/metrics_exporter.py`

```python
"""Push Prometheus metrics to Grafana Cloud using remote write."""

import asyncio
import base64
from io import BytesIO

import httpx
import structlog
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

from src.lib.config import settings

logger = structlog.get_logger(__name__)

PUSH_INTERVAL_SECONDS = 60


async def push_metrics_loop() -> None:
    """Periodically push metrics to Grafana Cloud Prometheus."""
    if not settings.GRAFANA_METRICS_URL or not settings.GRAFANA_METRICS_USER:
        logger.info("Grafana metrics push disabled (no URL configured)")
        return

    auth = base64.b64encode(
        f"{settings.GRAFANA_METRICS_USER}:{settings.GRAFANA_API_KEY}".encode()
    ).decode()

    logger.info("Starting Grafana metrics push loop",
                interval=PUSH_INTERVAL_SECONDS)

    while True:
        try:
            await asyncio.sleep(PUSH_INTERVAL_SECONDS)
            metrics_data = generate_latest()
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.GRAFANA_METRICS_URL}/api/v1/push",
                    content=metrics_data,
                    headers={
                        "Content-Type": CONTENT_TYPE_LATEST,
                        "Authorization": f"Basic {auth}",
                    },
                    timeout=10.0,
                )
                if response.status_code >= 400:
                    logger.warning("Metrics push failed",
                                   status=response.status_code)
        except Exception:
            logger.exception("Error pushing metrics to Grafana")
```

> **대안 (더 간단):** Grafana Cloud에서 `/metrics` 엔드포인트를 직접 scrape하도록 설정. Railway의 퍼블릭 URL을 Grafana Cloud의 "Hosted Prometheus > Scrape Jobs"에 등록하면 됨. 이 경우 `metrics_exporter.py`는 불필요.

**Config에 추가:**
```python
# config.py Settings 클래스
GRAFANA_METRICS_URL: str | None = None
GRAFANA_METRICS_USER: str | None = None
GRAFANA_API_KEY: str | None = None
```

**main.py lifespan에 push loop 시작:**
```python
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # ... 기존 코드 ...

    # Start metrics push (background)
    from src.lib.metrics_exporter import push_metrics_loop
    metrics_task = asyncio.create_task(push_metrics_loop())

    yield

    metrics_task.cancel()
    logger.info("Shutting down application")
```

#### 3.3.4 Grafana Dashboard 구성

**Dashboard 1: API Overview**
- HTTP request rate (by status code)
- Response time p50/p95/p99
- Error rate (5xx/4xx)
- Active requests

**Dashboard 2: AI Analysis**
- 요약 요청 수 (by provider, content_type)
- 요약 성공/실패/타임아웃 비율
- 요약 처리 시간 분포
- 활성 background task 수

**Dashboard 3: Infrastructure**
- DB connection pool 사용량
- Health check 상태
- Search semantic vs fallback 비율

#### 3.3.5 Grafana Alerting Rules

Grafana Cloud에서 Alert Rules 설정:

| Alert | 조건 | 심각도 | 채널 |
|-------|------|--------|------|
| High Error Rate | 5xx rate > 5% for 5min | Critical | Discord |
| AI Summary Failure Spike | 실패율 > 20% for 10min | Warning | Discord |
| DB Pool Exhaustion | checked_out > 80% of pool_size for 5min | Critical | Discord |
| High Latency | p95 > 5s for 10min | Warning | Discord |
| Search Fallback Rate | fallback > 50% for 15min | Info | Discord |

---

### Phase 4: UptimeRobot (External Uptime Monitoring)

**목표:** 외부에서 서비스 가용성을 모니터링하고, 다운 시 즉시 알림

#### 3.4.1 UptimeRobot 설정

1. https://uptimerobot.com 에서 무료 계정 생성
2. 다음 Monitor 추가:

| Monitor | Type | URL | Interval | Alert |
|---------|------|-----|----------|-------|
| API Health | HTTP(s) | `https://<railway-url>/health` | 5분 | Discord webhook |
| API Liveness | HTTP(s) | `https://<railway-url>/health/live` | 5분 | Discord webhook |
| API Readiness | HTTP(s) | `https://<railway-url>/health/ready` | 5분 | Discord webhook |
| Web Frontend | HTTP(s) | `https://<vercel-url>` | 5분 | Discord webhook |

3. Alert Contact에 Discord webhook 추가:
   - Type: "Webhook"
   - URL: Discord webhook URL
   - POST format: `{"content": "**UptimeRobot Alert**\n*monitorFriendlyName* is *alertTypeFriendlyName*\nURL: *monitorURL*"}`

#### 3.4.2 Status Page (선택사항)

UptimeRobot 무료 Status Page 설정:
- `https://stats.uptimerobot.com/xxxx` 형태의 퍼블릭 상태 페이지 생성
- API, Web 모니터를 추가하여 사용자에게 서비스 상태 공개 가능

---

### Phase 5: Discord Alerting Hub

**목표:** 모든 모니터링 알림을 Discord 채널로 통합

#### 3.5.1 Discord 서버 채널 구조

```
#monitoring
  ├── #alerts-critical    (Sentry critical, UptimeRobot down, DB pool)
  ├── #alerts-warning     (Sentry warning, high latency, AI failure spike)
  └── #alerts-info        (Deploy 알림, daily summary)
```

#### 3.5.2 Custom Alert Middleware (선택사항)

긴급 알림을 위한 직접 Discord webhook 전송 코드:

**새 파일:** `apps/api/src/lib/alerts.py`

```python
"""Discord webhook alerting for critical events."""

import httpx
import structlog

from src.lib.config import settings

logger = structlog.get_logger(__name__)


async def send_discord_alert(
    title: str,
    description: str,
    color: int = 0xFF0000,  # Red for critical
    fields: list[dict[str, str]] | None = None,
) -> None:
    """Send an alert to Discord webhook."""
    if not settings.DISCORD_WEBHOOK_URL:
        return

    embed = {
        "title": title,
        "description": description,
        "color": color,
        "fields": fields or [],
    }

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                settings.DISCORD_WEBHOOK_URL,
                json={"embeds": [embed]},
                timeout=5.0,
            )
    except Exception:
        logger.exception("Failed to send Discord alert")


# Color constants
ALERT_CRITICAL = 0xFF0000   # Red
ALERT_WARNING = 0xFFA500    # Orange
ALERT_INFO = 0x00BFFF       # Blue
ALERT_SUCCESS = 0x00FF00    # Green
```

**사용 예시 (articles/router.py `_run_analysis`):**

```python
except Exception as e:
    # 기존 로그 + Sentry 코드 유지...

    # 연속 실패 시 Discord 알림 (선택)
    from src.lib.alerts import send_discord_alert, ALERT_WARNING
    await send_discord_alert(
        title="AI Article Analysis Failed",
        description=f"Article `{article_id}` analysis failed",
        color=ALERT_WARNING,
        fields=[
            {"name": "Provider", "value": provider, "inline": True},
            {"name": "Error", "value": str(e)[:200], "inline": False},
        ],
    )
```

---

## 4. Railway 배포 고려사항

### 4.1 환경변수 목록 (Railway에 설정)

```bash
# === Phase 1: Sentry ===
SENTRY_DSN=https://xxx@o123.ingest.sentry.io/456
APP_VERSION=0.1.0

# === Phase 3: Grafana Cloud ===
# Traces (OpenTelemetry -> Grafana Tempo)
OTEL_EXPORTER_OTLP_ENDPOINT=https://tempo-prod-XX-YYY.grafana.net:443
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64>

# Metrics (Prometheus -> Grafana Cloud)
# 옵션 A: Grafana scrape job 사용 시 -> 설정 불필요
# 옵션 B: Push 방식 사용 시:
GRAFANA_METRICS_URL=https://prometheus-prod-XX-YYY.grafana.net
GRAFANA_METRICS_USER=123456
GRAFANA_API_KEY=glc_xxxx

# === Phase 5: Discord ===
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/yyy
```

### 4.2 Railway 제약사항 및 대응

| 제약사항 | 대응 |
|---------|------|
| 사이드카 프로세스 불가 | Push 방식으로 metrics 전송, 또는 Grafana scrape job 사용 |
| 자동 재시작 시 metrics 초기화 | Counter는 Prometheus가 rate 계산하므로 문제없음 |
| 단일 인스턴스 | pool metrics가 정확, horizontal scaling 시 instance label 추가 필요 |
| Ephemeral filesystem | 로컬 파일 기반 metrics storage 불가 -> 모두 remote 전송 |

### 4.3 성능 영향 최소화

- Sentry `traces_sample_rate=0.1` (프로덕션): 10% 샘플링
- Prometheus metrics: in-process counter, 오버헤드 무시할 수준
- Metrics push: 60초 간격, 비동기 non-blocking
- OTLP trace export: BatchSpanProcessor 사용 (비동기 배치)
- Discord webhook: fire-and-forget, 실패 시 무시
- `before_send` 필터: 4xx 에러는 Sentry에 전송하지 않아 quota 절약

---

## 5. 파일 변경 요약

### 새로 생성하는 파일

| 파일 | Phase | 설명 |
|------|-------|------|
| `apps/api/src/lib/sentry.py` | 1 | Sentry SDK 초기화 |
| `apps/api/src/lib/metrics.py` | 2 | Prometheus 메트릭 정의 |
| `apps/api/src/lib/metrics_exporter.py` | 3 | Grafana Cloud push (옵션) |
| `apps/api/src/lib/alerts.py` | 5 | Discord webhook 알림 |

### 수정하는 파일

| 파일 | Phase | 변경 내용 |
|------|-------|----------|
| `apps/api/pyproject.toml` | 1,2 | `sentry-sdk[fastapi]`, `prometheus-client`, `prometheus-fastapi-instrumentator` 추가 |
| `apps/api/src/lib/config.py` | 1,3,5 | `SENTRY_DSN`, `APP_VERSION`, `OTEL_EXPORTER_OTLP_HEADERS`, `GRAFANA_*`, `DISCORD_WEBHOOK_URL` 추가 |
| `apps/api/src/main.py` | 1,2 | Sentry 초기화, Prometheus instrumentator, metrics push loop |
| `apps/api/src/lib/telemetry.py` | 3 | OTLP headers 지원, APP_VERSION 사용 |
| `apps/api/src/lib/database.py` | 2 | `update_pool_metrics()` 함수 추가 |
| `apps/api/src/articles/router.py` | 1,2 | AI 요약 metrics 계측, Sentry context, Discord alert |

### 변경하지 않는 파일

- `src/lib/logging.py` - 이미 production-ready (structlog + JSON + trace context)
- `src/lib/langfuse_client.py` - 이미 AI observability 담당, 그대로 유지
- `src/lib/rate_limit.py` - 모니터링 범위 밖 (향후 rate limit metrics 추가 가능)

---

## 6. 추가 패키지 요약

```toml
# apps/api/pyproject.toml dependencies에 추가
"sentry-sdk[fastapi]>=2.0.0",
"prometheus-client>=0.21.0",
"prometheus-fastapi-instrumentator>=7.0.0",
```

---

## 7. 구현 순서 및 예상 소요 시간

| 순서 | Phase | 예상 소요 | 우선순위 | 즉각 효과 |
|------|-------|----------|---------|----------|
| 1 | **Phase 1: Sentry** | 1-2시간 | **최우선** | Exception 자동 추적 + 알림 |
| 2 | **Phase 4: UptimeRobot** | 30분 | **높음** | 서비스 다운 즉시 감지 |
| 3 | **Phase 5: Discord** | 30분 | **높음** | 알림 채널 통합 |
| 4 | **Phase 2: Metrics** | 2-3시간 | 중간 | 수치 기반 모니터링 |
| 5 | **Phase 3: Grafana** | 1-2시간 | 중간 | 대시보드 + 시각화 |

**전체 예상:** 5-8시간 (점진적 적용 가능, Phase 1+4+5만으로도 핵심 모니터링 확보)

---

## 8. 검증 체크리스트

### Phase 1 완료 기준
- [ ] Sentry에 test exception이 올바르게 표시됨
- [ ] 4xx 에러는 Sentry에 전송되지 않음 (`_before_send` 필터 동작)
- [ ] AI 요약 실패 시 article_analysis context가 Sentry에 포함됨
- [ ] environment, release 태그가 올바르게 설정됨

### Phase 2 완료 기준
- [ ] `/metrics` 엔드포인트가 Prometheus 형식으로 메트릭 반환
- [ ] `nod_ai_summary_requests_total` 카운터가 요약 시 증가
- [ ] `nod_ai_summary_duration_seconds` 히스토그램에 값 기록
- [ ] DB pool 메트릭이 `/health` 호출 시 갱신됨

### Phase 3 완료 기준
- [ ] Grafana Cloud에서 trace 검색 가능
- [ ] Grafana Cloud에서 metrics 쿼리 가능
- [ ] 최소 1개 대시보드 생성 완료

### Phase 4 완료 기준
- [ ] UptimeRobot에서 `/health`, `/health/live`, `/health/ready` 모니터 green
- [ ] 테스트용 다운타임 시 Discord 알림 수신

### Phase 5 완료 기준
- [ ] Sentry Alert -> Discord 알림 수신
- [ ] UptimeRobot -> Discord 알림 수신
- [ ] `send_discord_alert()` 함수로 직접 알림 전송 테스트

---

## 9. 향후 확장 (Phase 6+)

이 문서의 범위를 벗어나지만, 추후 고려할 사항:

| 항목 | 설명 | 시기 |
|------|------|------|
| **Rate Limit Metrics** | rate_limit.py에 429 발생 횟수, 차단된 IP 등 metrics 추가 | 트래픽 증가 시 |
| **Paddle Webhook Monitoring** | webhook 수신/처리 성공/실패 metrics | 유료 사용자 증가 시 |
| **Frontend Error Tracking** | Next.js에 Sentry Browser SDK 추가 | 프론트엔드 안정화 시 |
| **SLO/SLI 정의** | 99.9% uptime, p95 < 2s 등 서비스 수준 목표 | 사용자 기반 확대 시 |
| **Log-based Alerting** | Grafana Loki에서 특정 로그 패턴 (ERROR) 알림 | Grafana 안정화 후 |
| **Synthetic Monitoring** | 주기적으로 실제 API 호출하여 E2E 동작 확인 | 운영 안정화 후 |
| **Cost Monitoring** | AI API 비용 (Gemini/OpenAI token usage) 추적 | 비용 최적화 시 |

---

## 10. 아키텍처 다이어그램

```
                    +-----------+
                    |  Discord  |
                    |  Webhooks |
                    +-----+-----+
                          ^
              +-----------+-----------+
              |           |           |
        +-----+----+ +---+---+ +----+------+
        |  Sentry  | | Grafana| |UptimeRobot|
        |  (Error  | | Cloud  | | (Uptime)  |
        | Tracking)| | (Dash) | |           |
        +-----+----+ +---+---+ +-----+-----+
              ^           ^           |
              |           |           | HTTP poll
              |     +-----+-----+    |
              |     |  Tempo    |    |
              |     |  (Traces) |    |
              |     |  Prom     |    |
              |     |  (Metrics)|    |
              |     +-----+-----+    |
              |           ^           |
              |           |           |
         +----+-----------+--------+  |
         |                         |  |
         |    NOD API (Railway)    |<-+
         |    FastAPI + Python     |
         |                         |
         |  +---------+  +------+  |
         |  | Sentry  |  | OTEL |  |
         |  | SDK     |  | SDK  |  |
         |  +---------+  +------+  |
         |  +----------+ +------+  |
         |  |Prometheus| |struct|  |
         |  | metrics  | | log  |  |
         |  +----------+ +------+  |
         |                         |
         +-------+---------+------+
                 |         |
           +-----+---+ +--+-------+
           |Supabase | | Gemini/  |
           |PostgreSQL| | OpenAI  |
           +----------+ +---------+
```
