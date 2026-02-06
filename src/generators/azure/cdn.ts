import type { CloudFrontConfig } from '../../types';

// =============================================================================
// Azure CDN Generator
// =============================================================================

export function generateAzureCDNMain(config: CloudFrontConfig): string {
  return `# =============================================================================
# Azure CDN Profile
# =============================================================================

resource "azurerm_cdn_profile" "main" {
  name                = "\${var.project_name}-cdn"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.cdn_sku

  tags = var.tags
}

# CDN Endpoint
resource "azurerm_cdn_endpoint" "main" {
  name                = "\${var.project_name}-endpoint"
  profile_name        = azurerm_cdn_profile.main.name
  location            = azurerm_cdn_profile.main.location
  resource_group_name = var.resource_group_name

  is_http_allowed  = ${config.default_cache_behavior.viewer_protocol_policy === 'allow-all'}
  is_https_allowed = true

  origin_host_header = var.origin_hostname

  origin {
    name      = "primary"
    host_name = var.origin_hostname
    ${config.origin_type === 's3' ? `
    # Storage account origin
    http_port  = 80
    https_port = 443` : `
    # Custom origin
    http_port  = ${config.custom_origin_config?.http_port || 80}
    https_port = ${config.custom_origin_config?.https_port || 443}`}
  }

  ${config.default_cache_behavior.compress ? `
  is_compression_enabled = true
  content_types_to_compress = [
    "application/javascript",
    "application/json",
    "application/xml",
    "text/css",
    "text/html",
    "text/javascript",
    "text/plain",
  ]` : ''}

  # Caching rules
  global_delivery_rule {
    cache_expiration_action {
      behavior = "Override"
      duration = "${formatDuration(config.default_cache_behavior.default_ttl)}"
    }
  }

  tags = var.tags
}

${config.origin_type === 's3' ? `
# Custom Domain (optional)
# resource "azurerm_cdn_endpoint_custom_domain" "main" {
#   name            = "custom-domain"
#   cdn_endpoint_id = azurerm_cdn_endpoint.main.id
#   host_name       = "cdn.example.com"
# }` : ''}`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// =============================================================================
// Variables
// =============================================================================

export function generateAzureCDNVariables(_config: CloudFrontConfig): string {
  return `variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "location" {
  description = "Azure region for CDN profile"
  type        = string
  default     = "global"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "cdn_sku" {
  description = "SKU for the CDN profile"
  type        = string
  default     = "Standard_Microsoft"
}

variable "origin_hostname" {
  description = "Hostname of the origin server"
  type        = string
}

variable "storage_account_name" {
  description = "Name of the storage account (for static website origin)"
  type        = string
  default     = ""
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

export function generateAzureCDNOutputs(): string {
  return `output "cdn_profile_id" {
  description = "ID of the CDN profile"
  value       = azurerm_cdn_profile.main.id
}

output "cdn_profile_name" {
  description = "Name of the CDN profile"
  value       = azurerm_cdn_profile.main.name
}

output "cdn_endpoint_id" {
  description = "ID of the CDN endpoint"
  value       = azurerm_cdn_endpoint.main.id
}

output "cdn_endpoint_hostname" {
  description = "Hostname of the CDN endpoint"
  value       = azurerm_cdn_endpoint.main.fqdn
}

output "cdn_endpoint_url" {
  description = "HTTPS URL of the CDN endpoint"
  value       = "https://\${azurerm_cdn_endpoint.main.fqdn}"
}`;
}
