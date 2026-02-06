import type { S3Config } from '../../types';

// =============================================================================
// Azure Storage Account Generator
// =============================================================================

export function generateAzureStorageMain(config: S3Config): string {
  return `# =============================================================================
# Azure Storage Account
# =============================================================================

resource "azurerm_storage_account" "main" {
  name                     = replace("\${var.project_name}storage", "-", "")
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = var.account_tier
  account_replication_type = var.account_replication_type

  min_tls_version                 = "TLS1_2"
  https_traffic_only_enabled      = true
  allow_nested_items_to_be_public = false

  ${config.versioning_enabled ? `blob_properties {
    versioning_enabled = true
    
    delete_retention_policy {
      days = 7
    }

    container_delete_retention_policy {
      days = 7
    }
  }` : ''}

  ${config.encryption_enabled ? `# Encryption is enabled by default in Azure` : ''}

  tags = var.tags
}

# Default container
resource "azurerm_storage_container" "main" {
  name                  = "data"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Static website configuration (if enabled)
${config.versioning_enabled ? '' : `resource "azurerm_storage_account_static_website" "main" {
  count                = var.enable_static_website ? 1 : 0
  storage_account_id   = azurerm_storage_account.main.id
  index_document       = var.static_website_index
  error_404_document   = var.static_website_error
}`}`;
}

// =============================================================================
// Variables
// =============================================================================

export function generateAzureStorageVariables(_config: S3Config): string {
  return `variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "account_tier" {
  description = "Storage account tier"
  type        = string
  default     = "Standard"
}

variable "account_replication_type" {
  description = "Storage account replication type"
  type        = string
  default     = "LRS"
}

variable "enable_static_website" {
  description = "Enable static website hosting"
  type        = bool
  default     = false
}

variable "static_website_index" {
  description = "Index document for static website"
  type        = string
  default     = "index.html"
}

variable "static_website_error" {
  description = "Error document for static website"
  type        = string
  default     = "404.html"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}`;
}

// =============================================================================
// Outputs
// =============================================================================

export function generateAzureStorageOutputs(): string {
  return `output "storage_account_id" {
  description = "ID of the storage account"
  value       = azurerm_storage_account.main.id
}

output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.main.name
}

output "primary_blob_endpoint" {
  description = "Primary blob endpoint"
  value       = azurerm_storage_account.main.primary_blob_endpoint
}

output "primary_web_endpoint" {
  description = "Primary static website endpoint"
  value       = azurerm_storage_account.main.primary_web_endpoint
}

output "primary_access_key" {
  description = "Primary access key"
  value       = azurerm_storage_account.main.primary_access_key
  sensitive   = true
}

output "container_name" {
  description = "Name of the default container"
  value       = azurerm_storage_container.main.name
}`;
}
