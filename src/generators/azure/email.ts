import type { SESConfig } from '../../types';

// =============================================================================
// Azure Communication Services Generator
// =============================================================================

export function generateAzureEmailMain(config: SESConfig): string {
  return `# =============================================================================
# Azure Communication Services
# =============================================================================

resource "azurerm_communication_service" "main" {
  name                = "\${var.project_name}-comm"
  resource_group_name = var.resource_group_name
  data_location       = var.data_location

  tags = var.tags
}

# Email Communication Service
resource "azurerm_email_communication_service" "main" {
  name                = "\${var.project_name}-email"
  resource_group_name = var.resource_group_name
  data_location       = var.data_location

  tags = var.tags
}

# Azure Managed Domain (for quick start)
resource "azurerm_email_communication_service_domain" "managed" {
  name             = "AzureManagedDomain"
  email_service_id = azurerm_email_communication_service.main.id
  domain_management = "AzureManaged"
}

${config.domain_identity ? `
# Custom Domain
resource "azurerm_email_communication_service_domain" "custom" {
  name             = "${config.domain_identity}"
  email_service_id = azurerm_email_communication_service.main.id
  domain_management = "CustomerManaged"

  # Note: Requires DNS verification
}` : ''}

# Link Email Service to Communication Service
resource "azurerm_communication_service_email_domain_association" "main" {
  communication_service_id = azurerm_communication_service.main.id
  email_service_domain_id  = azurerm_email_communication_service_domain.managed.id
}

${config.create_smtp_credentials ? `
# Note: Azure Communication Services uses connection strings, not SMTP credentials
# For SMTP, consider using Azure SendGrid or another SMTP service
# The connection string is available in the outputs` : ''}`;
}

// =============================================================================
// Variables
// =============================================================================

export function generateAzureEmailVariables(_config: SESConfig): string {
  return `variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "data_location" {
  description = "Data location for Communication Services"
  type        = string
  default     = "United States"
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

export function generateAzureEmailOutputs(): string {
  return `output "communication_service_id" {
  description = "ID of the Communication Service"
  value       = azurerm_communication_service.main.id
}

output "communication_service_name" {
  description = "Name of the Communication Service"
  value       = azurerm_communication_service.main.name
}

output "email_service_id" {
  description = "ID of the Email Communication Service"
  value       = azurerm_email_communication_service.main.id
}

output "primary_connection_string" {
  description = "Primary connection string for Communication Services"
  value       = azurerm_communication_service.main.primary_connection_string
  sensitive   = true
}

output "managed_domain" {
  description = "Azure managed email domain"
  value       = azurerm_email_communication_service_domain.managed.mail_from_sender_domain
}`;
}
