output "static_web_app_url" {
  description = "Public website URL"
  value       = module.static_web_app.default_url
}

output "static_web_app_name" {
  description = "Static Web App resource name"
  value       = module.static_web_app.name
}

output "key_vault_name" {
  description = "Key Vault that holds the Sanity and Web3Forms values"
  value       = module.key_vault.vault_name
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = module.key_vault.vault_uri
}

output "manual_key_vault_secrets" {
  description = "Secret names to fill in the Azure portal. Terraform will not overwrite the values after the first create."
  value       = sort(local.manual_secret_names)
}

output "azure_swa_deployment_token" {
  description = "Static Web App deployment token (terraform output -raw azure_swa_deployment_token)"
  value       = module.static_web_app.api_key
  sensitive   = true
}

output "github_actions_key_vault_access" {
  description = "Whether the GitHub Actions app can read Key Vault secrets"
  value       = var.github_actions_client_id != "" ? "Key Vault Secrets User will be granted to the GitHub Actions app on apply." : "Not granted yet. Set github_actions_client_id to the OIDC app's client id and apply again, or assign Key Vault Secrets User yourself."
}

output "deployment_summary" {
  description = "What this configuration manages"
  value = {
    website        = module.static_web_app.default_url
    key_vault      = module.key_vault.vault_name
    content        = "Sanity (hosted by Sanity, not Azure)"
    contact        = "Web3Forms (browser posts directly)"
    studio         = "https://jencolink.sanity.studio after sanity deploy"
    secrets_filled = "Set sanity-project-id, sanity-dataset, sanity-auth-token, and web3forms-access-key in Key Vault by hand"
  }
}
