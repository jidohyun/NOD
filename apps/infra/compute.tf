# Cloud Run Service - API
resource "google_cloud_run_v2_service" "api" {
  name     = "${local.name_prefix}-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.api.email

    scaling {
      min_instance_count = var.api_min_instances
      max_instance_count = var.api_max_instances
    }

    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = local.api_image

      resources {
        limits = {
          cpu    = var.api_cpu
          memory = var.api_memory
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      env {
        name  = "PROJECT_ENV"
        value = var.environment
      }

      env {
        name  = "AI_PROVIDER"
        value = var.AI_PROVIDER
      }

      env {
        name  = "CORS_ORIGINS"
        value = var.domain != "" ? jsonencode(["https://${var.domain}"]) : jsonencode(["http://localhost:3000"])
      }

      env {
        name  = "BETTER_AUTH_URL"
        value = var.domain != "" ? "https://${var.domain}" : "http://localhost:3000"
      }

      env {
        name  = "DATABASE_HOST"
        value = google_sql_database_instance.main.private_ip_address
      }

      env {
        name  = "DATABASE_NAME"
        value = var.db_name
      }

      env {
        name  = "DATABASE_USER"
        value = var.db_user
      }

      env {
        name = "DATABASE_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "REDIS_HOST"
        value = google_redis_instance.main.host
      }

      env {
        name  = "REDIS_PORT"
        value = tostring(google_redis_instance.main.port)
      }

      env {
        name  = "STORAGE_BUCKET"
        value = google_storage_bucket.uploads.name
      }

      env {
        name  = "STORAGE_BACKEND"
        value = "gcs"
      }

      env {
        name  = "GCS_BUCKET_NAME"
        value = google_storage_bucket.uploads.name
      }

      env {
        name  = "WORKER_URL"
        value = google_cloud_run_v2_service.worker.uri
      }

      dynamic "env" {
        for_each = var.OPENAI_API_KEY != "" ? [1] : []
        content {
          name = "OPENAI_API_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.openai_api_key[0].secret_id
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = var.GOOGLE_AI_API_KEY != "" ? [1] : []
        content {
          name = "GEMINI_API_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.google_ai_api_key[0].secret_id
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = var.PADDLE_API_KEY != "" ? [1] : []
        content {
          name = "PADDLE_API_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.paddle_api_key[0].secret_id
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = var.PADDLE_WEBHOOK_SECRET != "" ? [1] : []
        content {
          name = "PADDLE_WEBHOOK_SECRET"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.paddle_webhook_secret[0].secret_id
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = var.PADDLE_CLIENT_TOKEN != "" ? [1] : []
        content {
          name  = "PADDLE_CLIENT_TOKEN"
          value = var.PADDLE_CLIENT_TOKEN
        }
      }

      dynamic "env" {
        for_each = var.PADDLE_PRICE_ID_PRO != "" ? [1] : []
        content {
          name  = "PADDLE_PRICE_ID_PRO"
          value = var.PADDLE_PRICE_ID_PRO
        }
      }

      env {
        name  = "PADDLE_ENVIRONMENT"
        value = var.PADDLE_ENVIRONMENT
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
        }
        period_seconds    = 30
        failure_threshold = 3
      }
    }
  }

  lifecycle {
    # Cloud Run revisions (images, template labels) are deployed/managed by CI.
    # Infra is still managed by Terraform.
    ignore_changes = [
      client,
      client_version,
      template[0].containers[0].image,
      template[0].labels,
    ]
  }

  labels = local.labels

  depends_on = [
    google_secret_manager_secret_iam_member.api_db_password,
    google_project_iam_member.api_secret_accessor,
  ]
}

# Cloud Run Service - Web
resource "google_cloud_run_v2_service" "web" {
  name     = "${local.name_prefix}-web"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.web.email

    scaling {
      min_instance_count = var.web_min_instances
      max_instance_count = var.web_max_instances
    }

    containers {
      image = local.web_image

      resources {
        limits = {
          cpu    = var.web_cpu
          memory = var.web_memory
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = var.domain != "" ? "https://${var.api_subdomain}.${var.domain}" : google_cloud_run_v2_service.api.uri
      }

      env {
        name  = "NEXT_PUBLIC_SITE_URL"
        value = var.domain != "" ? "https://${var.domain}" : "https://example.com"
      }

      startup_probe {
        http_get {
          path = "/api/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/api/health"
        }
        period_seconds    = 30
        failure_threshold = 3
      }
    }
  }

  lifecycle {
    ignore_changes = [
      client,
      client_version,
      template[0].containers[0].image,
      template[0].labels,
    ]
  }

  labels = local.labels
}

# Cloud Run Service - Worker
resource "google_cloud_run_v2_service" "worker" {
  name     = "${local.name_prefix}-worker"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = google_service_account.worker.email

    scaling {
      min_instance_count = var.worker_min_instances
      max_instance_count = var.worker_max_instances
    }

    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = local.worker_image

      resources {
        limits = {
          cpu    = var.worker_cpu
          memory = var.worker_memory
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      env {
        name  = "PROJECT_ENV"
        value = var.environment
      }

      env {
        name  = "AI_PROVIDER"
        value = var.AI_PROVIDER
      }

      env {
        name  = "DATABASE_HOST"
        value = google_sql_database_instance.main.private_ip_address
      }

      env {
        name  = "DATABASE_NAME"
        value = var.db_name
      }

      env {
        name  = "DATABASE_USER"
        value = var.db_user
      }

      env {
        name = "DATABASE_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "REDIS_HOST"
        value = google_redis_instance.main.host
      }

      env {
        name  = "REDIS_PORT"
        value = tostring(google_redis_instance.main.port)
      }

      env {
        name  = "STORAGE_BUCKET"
        value = google_storage_bucket.uploads.name
      }

      env {
        name  = "STORAGE_BACKEND"
        value = "gcs"
      }

      env {
        name  = "GCS_BUCKET_NAME"
        value = google_storage_bucket.uploads.name
      }

      dynamic "env" {
        for_each = var.OPENAI_API_KEY != "" ? [1] : []
        content {
          name = "OPENAI_API_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.openai_api_key[0].secret_id
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = var.GOOGLE_AI_API_KEY != "" ? [1] : []
        content {
          name = "GEMINI_API_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.google_ai_api_key[0].secret_id
              version = "latest"
            }
          }
        }
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }
    }
  }

  lifecycle {
    ignore_changes = [
      client,
      client_version,
      template[0].containers[0].image,
      template[0].labels,
    ]
  }

  labels = local.labels

  depends_on = [
    google_secret_manager_secret_iam_member.worker_db_password,
    google_project_iam_member.worker_secret_accessor,
  ]
}

# Allow API service to invoke Worker (Cloud Run auth)
resource "google_cloud_run_v2_service_iam_member" "worker_api" {
  location = google_cloud_run_v2_service.worker.location
  name     = google_cloud_run_v2_service.worker.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.api.email}"
}

# Allow public access to API
resource "google_cloud_run_v2_service_iam_member" "api_public" {
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Allow public access to Web
resource "google_cloud_run_v2_service_iam_member" "web_public" {
  location = google_cloud_run_v2_service.web.location
  name     = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Allow Cloud Tasks to invoke Worker
resource "google_cloud_run_v2_service_iam_member" "worker_tasks" {
  location = google_cloud_run_v2_service.worker.location
  name     = google_cloud_run_v2_service.worker.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.tasks.email}"
}

# Allow Pub/Sub to invoke Worker
resource "google_cloud_run_v2_service_iam_member" "worker_pubsub" {
  location = google_cloud_run_v2_service.worker.location
  name     = google_cloud_run_v2_service.worker.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.pubsub.email}"
}
