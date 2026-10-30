terraform {
  required_version = ">= 1.5"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.13"
    }
  }

  # Remote state, encrypted at rest in Azure Storage. use_azuread_auth means
  # Terraform authenticates with the same Azure identity already used for
  # `az login` / the azurerm provider - no storage account key to generate,
  # rotate, or store anywhere. The storage account (gencolink-rg-tfstate
  # resource group) is bootstrapped by hand via the Azure CLI, deliberately
  # outside this Terraform config, to avoid the chicken-and-egg problem of
  # state storage depending on itself.
  #
  # website.tfstate is a new empty state. prod.tfstate listed the old
  # Directus, SQL, storage, and Functions resources. Those were removed in
  # Azure by hand, so that file must not be copied here. Init with
  # `terraform init -reconfigure` and do not migrate state.
  backend "azurerm" {
    resource_group_name  = "gencolink-rg-tfstate"
    storage_account_name = "gencolinktfstate"
    container_name       = "tfstate"
    key                  = "website.tfstate"
    use_azuread_auth     = true
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

# Auth: personal access token with `repo` scope. Prefer the GITHUB_TOKEN
# environment variable (the provider reads it automatically) over
# var.github_repo_token, so the token never has to sit in terraform.tfvars.
# token = null here means "not explicitly set" - Terraform then lets the
# provider fall back to GITHUB_TOKEN. var.github_repo_token remains as an
# explicit override only for workflows that genuinely need it in tfvars.
provider "github" {
  token = var.github_repo_token != "" ? var.github_repo_token : null
  owner = var.github_owner
}

# Used only when github_actions_client_id is set, to look up that app's
# service principal and grant it Key Vault Secrets User.
provider "azuread" {}
