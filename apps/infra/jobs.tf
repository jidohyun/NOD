resource "google_cloud_run_v2_job" "api_migrate" {
  name     = "${local.name_prefix}-api-migrate"
  location = var.region

  template {
    template {
      service_account = google_service_account.api.email

      vpc_access {
        connector = google_vpc_access_connector.main.id
        egress    = "PRIVATE_RANGES_ONLY"
      }

      containers {
        # Run migrations using the currently deployed API image.
        # (CI deploys commit-sha-tagged images.)
        image   = google_cloud_run_v2_service.api.template[0].containers[0].image
        command = ["sh", "-c"]
        args    = [".venv/bin/alembic upgrade head"]

        env {
          name  = "PROJECT_ENV"
          value = var.environment
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
      }
    }
  }

  labels = local.labels
}
