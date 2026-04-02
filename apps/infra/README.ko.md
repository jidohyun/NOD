# 인프라

GCP 인프라 프로비저닝을 위한 Terraform 설정입니다.

## 사전 요구사항

### GCP API 활성화

`terraform apply` 실행 전, GCP 프로젝트에서 다음 API를 활성화하세요:

- [Compute Engine API](https://console.cloud.google.com/apis/api/compute.googleapis.com/metrics)
- [Cloud Run API](https://console.cloud.google.com/apis/library/run.googleapis.com)
- [Cloud Tasks API](https://console.cloud.google.com/apis/library/cloudtasks.googleapis.com)
- [IAM Service Account Credentials API](https://console.cloud.google.com/marketplace/product/google/iamcredentials.googleapis.com)
- [Service Networking API](https://console.cloud.google.com/apis/api/servicenetworking.googleapis.com/metrics)

### 도메인 설정

Cloudflare, Route53 등 서드파티 DNS를 사용하는 경우, [Cloud Run 도메인](https://console.cloud.google.com/run/domains)에서 도메인 매핑이 필요합니다.

## 사용법

```bash
# 초기화
mise run init

# Dry-run (dev)
mise run plan

# 적용 (dev)
mise run apply

# Dry-run (prod)
mise run plan:prod

# 적용 (prod)
mise run apply:prod
```

## YouTube transcript 프록시 설정

API는 Cloud Run에서 실행되고, YouTube는 클라우드 사업자 IP 대역에서 온
transcript 요청을 자주 차단합니다. `/api/articles/analyze-url`가
`503`과 함께 `Transcript provider is temporarily unavailable`를 반환하면,
아래 프록시 옵션 중 하나를 Terraform 변수 또는 Infisical 환경값에 설정한 뒤
인프라를 다시 적용하고 API 이미지를 재배포하세요.

권장 런타임 설정값:

```hcl
VIDEO_TRANSCRIPT_TIMEOUT_SECONDS            = 20
VIDEO_TRANSCRIPT_TRANSIENT_RETRIES          = 2
VIDEO_TRANSCRIPT_RETRY_BASE_DELAY_SECONDS   = 0.75
VIDEO_TRANSCRIPT_PROXY_RETRIES_WHEN_BLOCKED = 10
```

일반 프록시:

```hcl
VIDEO_TRANSCRIPT_PROXY_HTTP_URL  = "http://user:pass@host:port"
VIDEO_TRANSCRIPT_PROXY_HTTPS_URL = "http://user:pass@host:port"
```

Webshare 회전 residential 프록시:

```hcl
VIDEO_TRANSCRIPT_PROXY_WEBSHARE_USERNAME  = "..."
VIDEO_TRANSCRIPT_PROXY_WEBSHARE_PASSWORD  = "..."
VIDEO_TRANSCRIPT_PROXY_WEBSHARE_LOCATIONS = "kr,jp"
```
