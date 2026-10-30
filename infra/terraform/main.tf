# Jencolink website infrastructure.
#
# Azure hosts only the static site and a Key Vault. Content lives in Sanity.
# Contact messages go to Web3Forms from the browser. The three content
# secrets are created here as placeholders. Set their values in the Azure
# portal. Later applies do not overwrite those values.

data "azurerm_resource_group" "main" {
  name = var.resource_group_name
}

locals {
  app_name          = "${var.project_name}-${var.environment}"
  frontend_location = coalesce(var.frontend_location, var.primary_location)
  keyvault_location = coalesce(var.keyvault_location, var.primary_location)

  common_tags = merge(
    var.tags,
    {
      ManagedBy   = "Terraform"
      Environment = var.environment
      Project     = var.project_name
    }
  )

  keyvault_tags = merge(
    local.common_tags,
    {
      Service  = "Secrets"
      Location = local.keyvault_location
      Tier     = "Critical"
    }
  )

  frontend_tags = merge(
    local.common_tags,
    {
      Service  = "Frontend-Angular"
      Location = local.frontend_location
      Tier     = "Standard"
    }
  )

  # Placeholder value. The deploy workflow treats this (and an empty value)
  # as "not configured yet" and stops. sanity-dataset falls back to production.
  secret_placeholder = "pending"

  manual_secret_names = toset([
    "sanity-project-id",
    "sanity-dataset",
    "web3forms-access-key",
  ])
}

module "key_vault" {
  source = "./modules/key-vault"

  resource_group_name = data.azurerm_resource_group.main.name
  location            = local.keyvault_location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.keyvault_tags
}

module "static_web_app" {
  source = "./modules/static-web-app"

  resource_group_name = data.azurerm_resource_group.main.name
  location            = local.frontend_location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.frontend_tags
}

# Role assignment success returns before the data plane accepts writes.
resource "time_sleep" "key_vault_rbac" {
  create_duration = "30s"

  depends_on = [module.key_vault]
}

# Slots for secrets the operator sets in the portal. ignore_changes keeps a
# later apply from putting "pending" back over a real value.
resource "azurerm_key_vault_secret" "manual" {
  for_each = local.manual_secret_names

  name         = each.value
  value        = local.secret_placeholder
  key_vault_id = module.key_vault.vault_id
  content_type = "text/plain"

  lifecycle {
    ignore_changes = [value]
  }

  depends_on = [time_sleep.key_vault_rbac]
}

# Optional. When github_actions_client_id is set, the GitHub OIDC app can
# read the three secrets during deploy. Contributor on the resource group
# does not include this data-plane role.
data "azuread_service_principal" "github_actions" {
  count     = var.github_actions_client_id != "" ? 1 : 0
  client_id = var.github_actions_client_id
}

resource "azurerm_role_assignment" "github_actions_key_vault_secrets_user" {
  count                = var.github_actions_client_id != "" ? 1 : 0
  scope                = module.key_vault.vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = data.azuread_service_principal.github_actions[0].object_id
}

# ============================================================
# GITHUB ACTIONS SECRETS
# Names and the Static Web App deploy token. Content secrets stay in
# Key Vault and are read at deploy time. OIDC ids stay manual:
# AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID.
# ============================================================
resource "github_actions_secret" "azure_resource_group" {
  repository  = var.github_repository
  secret_name = "AZURE_RESOURCE_GROUP"
  value       = data.azurerm_resource_group.main.name
}

resource "github_actions_secret" "azure_key_vault_name" {
  repository  = var.github_repository
  secret_name = "AZURE_KEY_VAULT_NAME"
  value       = module.key_vault.vault_name
}

resource "github_actions_secret" "azure_swa_name" {
  repository  = var.github_repository
  secret_name = "AZURE_SWA_NAME"
  value       = module.static_web_app.name
}

resource "github_actions_secret" "azure_swa_deployment_token" {
  repository  = var.github_repository
  secret_name = "AZURE_SWA_DEPLOYMENT_TOKEN"
  value       = module.static_web_app.api_key
}
