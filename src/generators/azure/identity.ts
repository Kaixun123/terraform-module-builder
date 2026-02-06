import type { IAMConfig } from '../../types';

// =============================================================================
// Azure Managed Identity Generator
// =============================================================================

export function generateAzureIdentityMain(config: IAMConfig): string {
  const sections: string[] = [];

  sections.push(`# =============================================================================
# Azure User-Assigned Managed Identity
# =============================================================================

resource "azurerm_user_assigned_identity" "main" {
  name                = "\${var.project_name}-identity"
  location            = var.location
  resource_group_name = var.resource_group_name

  tags = var.tags
}`);

  // Role assignments
  if (config.s3_access) {
    sections.push(`
# Storage Blob Data Contributor role (for storage access)
resource "azurerm_role_assignment" "storage_blob" {
  count                = var.storage_account_id != "" ? 1 : 0
  scope                = var.storage_account_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}`);
  }

  // Additional role assignments based on managed_policy_arns
  // In Azure, these map to built-in roles
  sections.push(`
# Resource Group Contributor (general access)
resource "azurerm_role_assignment" "contributor" {
  count                = var.enable_contributor_role ? 1 : 0
  scope                = var.resource_group_id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}

# Reader role (read-only access)
resource "azurerm_role_assignment" "reader" {
  count                = var.enable_reader_role ? 1 : 0
  scope                = var.resource_group_id
  role_definition_name = "Reader"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}

# Key Vault Secrets User (for accessing secrets)
resource "azurerm_role_assignment" "keyvault" {
  count                = var.key_vault_id != "" ? 1 : 0
  scope                = var.key_vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}`);

  return sections.join('\n');
}

// =============================================================================
// Variables
// =============================================================================

export function generateAzureIdentityVariables(_config: IAMConfig): string {
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

variable "resource_group_id" {
  description = "ID of the resource group for role assignments"
  type        = string
}

variable "storage_account_id" {
  description = "Storage account ID for blob access role assignment"
  type        = string
  default     = ""
}

variable "key_vault_id" {
  description = "Key Vault ID for secrets access role assignment"
  type        = string
  default     = ""
}

variable "enable_contributor_role" {
  description = "Enable Contributor role on resource group"
  type        = bool
  default     = false
}

variable "enable_reader_role" {
  description = "Enable Reader role on resource group"
  type        = bool
  default     = true
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

export function generateAzureIdentityOutputs(): string {
  return `output "identity_id" {
  description = "ID of the managed identity"
  value       = azurerm_user_assigned_identity.main.id
}

output "identity_name" {
  description = "Name of the managed identity"
  value       = azurerm_user_assigned_identity.main.name
}

output "principal_id" {
  description = "Principal ID of the managed identity"
  value       = azurerm_user_assigned_identity.main.principal_id
}

output "client_id" {
  description = "Client ID of the managed identity"
  value       = azurerm_user_assigned_identity.main.client_id
}

output "tenant_id" {
  description = "Tenant ID of the managed identity"
  value       = azurerm_user_assigned_identity.main.tenant_id
}`;
}
