variable "resource_group_name" {
  description = "Existing Azure resource group name"
  type        = string
  default     = "gencolink"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "gencolink"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "prod"
}

variable "primary_location" {
  description = "Primary Azure region"
  type        = string
  default     = "eastus2"
}

variable "frontend_location" {
  description = "Location for Static Web App (limited regions: centralus, eastus2, westus2, westeurope, eastasia)"
  type        = string
  default     = null
}

variable "keyvault_location" {
  description = "Location for Key Vault"
  type        = string
  default     = null
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default = {
    Project     = "Jencolink"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

variable "github_actions_client_id" {
  description = "Application (client) ID of the GitHub Actions OIDC app (the same value as the AZURE_CLIENT_ID GitHub secret). When set, Terraform grants that app Key Vault Secrets User so the website workflow can read secrets. Leave empty to assign the role yourself."
  type        = string
  default     = ""
}

variable "github_repo_token" {
  description = "GitHub PAT token (needs repo scope to manage Actions secrets)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_owner" {
  description = "GitHub org/user that owns the repository"
  type        = string
  default     = "Lithira-Amarasinghe"
}

variable "github_repository" {
  description = "GitHub repository name (no owner prefix)"
  type        = string
  default     = "jencolink"
}
