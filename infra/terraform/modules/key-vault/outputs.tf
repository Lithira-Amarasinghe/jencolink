output "vault_id" {
  description = "Key Vault ID"
  value       = azurerm_key_vault.main.id
  sensitive   = true
}

output "vault_name" {
  description = "Key Vault name"
  value       = azurerm_key_vault.main.name
}

output "vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

output "administrator_assignment_id" {
  description = "Deployer role assignment. Secret resources depend on this so the assignment exists before the first secret write."
  value       = azurerm_role_assignment.deployer_secrets_officer.id
}
