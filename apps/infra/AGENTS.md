# apps/infra/AGENTS.md - Infrastructure Guidance

This document provides specific guidance for AI agents working within the `apps/infra` Terraform configurations. It supplements the root `AGENTS.md` by detailing local conventions, commands, and key file locations.

**Note**: All mise run commands for apply and plan tasks require Infisical to be running and configured, as they use infisical run ... to inject secrets.

## 1. Where to Look

*   **Terraform Configurations**: `provider.tf`, `variables.tf`, `outputs.tf`, `terraform.tfvars.example`
*   **Development Variables**: terraform.tfvars (user-provided, not committed)
*   **Production Variables**: terraform.prod.tfvars (user-provided, not committed)
*   **Documentation**: `README.md`
*   **Mise Configuration**: `mise.toml`

## 2. Commands (via `mise run` from `apps/infra/`)

| Command           | Description                                   |
| :---------------- | :-------------------------------------------- |
| `init`            | Initialize Terraform working directory        |
| `plan`            | Generate and show an execution plan (dev)     |
| `plan:prod`       | Generate and show an execution plan (prod)    |
| `apply`           | Apply the changes required to reach the desired state (dev) |
| `apply:prod`      | Apply the changes required to reach the desired state (prod) |
| `destroy`         | Destroy previously-created infrastructure (dev) |
| `fmt`             | Rewrite Terraform configuration files to a canonical format |
| `fmt:check`       | Check if Terraform files are formatted correctly |
| `validate`        | Validate the configuration files              |
| `output`          | Show output values from the state file        |
| `state:list`      | List resources in the state file              |
