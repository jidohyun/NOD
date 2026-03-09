"""Prometheus metrics for application monitoring."""

from prometheus_client import Counter, Gauge, Histogram, Info

# --- AI Summarization Metrics ---
AI_SUMMARY_REQUESTS = Counter(
    "nod_ai_summary_requests_total",
    "Total AI summarization requests",
    ["provider", "content_type", "status"],
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
    ["status"],
)

# --- Search Metrics ---
SEARCH_REQUESTS = Counter(
    "nod_search_requests_total",
    "Total search requests",
    ["type"],
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
    ["method", "status"],
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
