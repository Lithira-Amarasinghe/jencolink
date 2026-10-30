variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region - Static Web Apps' managed Functions/staging backend only supports a limited region set"
  type        = string
  default     = "eastus2"

  validation {
    condition     = contains(["centralus", "eastus2", "westus2", "westeurope", "eastasia"], var.location)
    error_message = "Static Web App region must be one of: centralus, eastus2, westus2, westeurope, eastasia."
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "location_short" {
  description = "DEPRECATED: Short location code (no longer used in naming)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags for resources"
  type        = map(string)
}
