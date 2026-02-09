# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "main" {
  name             = "${local.name_prefix}-postgres"
  database_version = "POSTGRES_16"
  region           = var.region

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    # Cloud SQL defaults to ENTERPRISE_PLUS when not specified, which doesn't
    # support shared-core tiers like db-f1-micro.
    edition           = "ENTERPRISE"
    tier              = var.db_tier
    availability_type = var.environment == "prod" ? "REGIONAL" : "ZONAL"
    disk_size         = 10
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.main.id
      enable_private_path_for_google_cloud_services = true
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = var.environment == "prod"
      backup_retention_settings {
        retained_backups = var.environment == "prod" ? 30 : 7
      }
    }

    maintenance_window {
      day          = 7 # Sunday
      hour         = 4
      update_track = "stable"
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
    }

    user_labels = local.labels
  }

  deletion_protection = var.environment == "prod"
}

# Database
resource "google_sql_database" "main" {
  name     = var.db_name
  instance = google_sql_database_instance.main.name
}

# Database User
resource "google_sql_user" "main" {
  name     = var.db_user
  instance = google_sql_database_instance.main.name
  password = random_password.db_password.result
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${local.name_prefix}-db-password"

  replication {
    auto {}
  }

  labels = local.labels
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# Paddle API Key Secret
resource "google_secret_manager_secret" "paddle_api_key" {
  count     = var.PADDLE_API_KEY != "" ? 1 : 0
  secret_id = "${local.name_prefix}-paddle-api-key"

  replication {
    auto {}
  }

  labels = local.labels
}

resource "google_secret_manager_secret_version" "paddle_api_key" {
  count       = var.PADDLE_API_KEY != "" ? 1 : 0
  secret      = google_secret_manager_secret.paddle_api_key[0].id
  secret_data = var.PADDLE_API_KEY
}

# Paddle Webhook Secret
resource "google_secret_manager_secret" "paddle_webhook_secret" {
  count     = var.PADDLE_WEBHOOK_SECRET != "" ? 1 : 0
  secret_id = "${local.name_prefix}-paddle-webhook-secret"

  replication {
    auto {}
  }

  labels = local.labels
}

resource "google_secret_manager_secret_version" "paddle_webhook_secret" {
  count       = var.PADDLE_WEBHOOK_SECRET != "" ? 1 : 0
  secret      = google_secret_manager_secret.paddle_webhook_secret[0].id
  secret_data = var.PADDLE_WEBHOOK_SECRET
}

# OpenAI API Key Secret
resource "google_secret_manager_secret" "openai_api_key" {
  count     = var.OPENAI_API_KEY != "" ? 1 : 0
  secret_id = "${local.name_prefix}-openai-api-key"

  replication {
    auto {}
  }

  labels = local.labels
}

resource "google_secret_manager_secret_version" "openai_api_key" {
  count       = var.OPENAI_API_KEY != "" ? 1 : 0
  secret      = google_secret_manager_secret.openai_api_key[0].id
  secret_data = var.OPENAI_API_KEY
}

# Google AI (Gemini) API Key Secret
resource "google_secret_manager_secret" "google_ai_api_key" {
  count     = var.GOOGLE_AI_API_KEY != "" ? 1 : 0
  secret_id = "${local.name_prefix}-google-ai-api-key"

  replication {
    auto {}
  }

  labels = local.labels
}

resource "google_secret_manager_secret_version" "google_ai_api_key" {
  count       = var.GOOGLE_AI_API_KEY != "" ? 1 : 0
  secret      = google_secret_manager_secret.google_ai_api_key[0].id
  secret_data = var.GOOGLE_AI_API_KEY
}

# Redis (Memorystore)
resource "google_redis_instance" "main" {
  name           = "${local.name_prefix}-redis"
  tier           = var.environment == "prod" ? "STANDARD_HA" : "BASIC"
  memory_size_gb = var.redis_memory_size_gb
  region         = var.region

  authorized_network = google_compute_network.main.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  redis_version = "REDIS_7_2"

  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 4
        minutes = 0
      }
    }
  }

  labels = local.labels

  depends_on = [google_service_networking_connection.private_vpc_connection]
}
