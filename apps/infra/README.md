# Infrastructure

Terraform configuration for GCP infrastructure provisioning.

## Prerequisites

### Enable Required GCP APIs

Before running `terraform apply`, enable the following APIs in your GCP project:

- [Compute Engine API](https://console.cloud.google.com/apis/api/compute.googleapis.com/metrics)
- [Cloud Run API](https://console.cloud.google.com/apis/library/run.googleapis.com)
- [Cloud Tasks API](https://console.cloud.google.com/apis/library/cloudtasks.googleapis.com)
- [IAM Service Account Credentials API](https://console.cloud.google.com/marketplace/product/google/iamcredentials.googleapis.com)
- [Service Networking API](https://console.cloud.google.com/apis/api/servicenetworking.googleapis.com/metrics)

### Domain Configuration

If you use third-party DNS services (Cloudflare, Route53, etc.), you must map your domains at [Cloud Run Domains](https://console.cloud.google.com/run/domains).

## Usage

```bash
# Initialize
mise run init

# Dry-run (dev)
mise run plan

# Apply (dev)
mise run apply

# Dry-run (prod)
mise run plan:prod

# Apply (prod)
mise run apply:prod
```

## YouTube transcript proxy configuration

The API runs on Cloud Run, and YouTube often blocks transcript requests that
originate from cloud-provider IP ranges. If `/api/articles/analyze-url` returns
`503` with `Transcript provider is temporarily unavailable`, configure one of the
proxy options below in your Terraform variables or Infisical-managed env set,
then re-apply infra before redeploying the API image.

Recommended runtime knobs:

```hcl
VIDEO_TRANSCRIPT_TIMEOUT_SECONDS           = 20
VIDEO_TRANSCRIPT_TRANSIENT_RETRIES         = 2
VIDEO_TRANSCRIPT_RETRY_BASE_DELAY_SECONDS  = 0.75
VIDEO_TRANSCRIPT_PROXY_RETRIES_WHEN_BLOCKED = 10
```

Generic proxy:

```hcl
VIDEO_TRANSCRIPT_PROXY_HTTP_URL  = "http://user:pass@host:port"
VIDEO_TRANSCRIPT_PROXY_HTTPS_URL = "http://user:pass@host:port"
```

Webshare rotating residential proxy:

```hcl
VIDEO_TRANSCRIPT_PROXY_WEBSHARE_USERNAME  = "..."
VIDEO_TRANSCRIPT_PROXY_WEBSHARE_PASSWORD  = "..."
VIDEO_TRANSCRIPT_PROXY_WEBSHARE_LOCATIONS = "kr,jp"
```
