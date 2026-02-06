import type { APIGatewayConfig } from '../../types';

// =============================================================================
// Azure API Management Generator
// =============================================================================

export function generateAzureAPIMain(config: APIGatewayConfig): string {
  const sections: string[] = [];

  sections.push(`# =============================================================================
# Azure API Management
# =============================================================================

resource "azurerm_api_management" "main" {
  name                = "\${var.project_name}-apim"
  location            = var.location
  resource_group_name = var.resource_group_name
  publisher_name      = var.publisher_name
  publisher_email     = var.publisher_email
  sku_name            = var.sku_name

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# API Definition
resource "azurerm_api_management_api" "main" {
  name                = "\${var.project_name}-api"
  resource_group_name = var.resource_group_name
  api_management_name = azurerm_api_management.main.name
  revision            = "1"
  display_name        = "${config.name || 'Main API'}"
  path                = "api"
  protocols           = ["https"]

  subscription_required = false
}`);

  // Generate operations for each route
  config.routes.forEach((route, index) => {
    const operationId = route.path.replace(/[{}\/]/g, '_').replace(/^_/, '');
    sections.push(`
resource "azurerm_api_management_api_operation" "op_${index}" {
  operation_id        = "${operationId}_${route.method.toLowerCase()}"
  api_name            = azurerm_api_management_api.main.name
  api_management_name = azurerm_api_management.main.name
  resource_group_name = var.resource_group_name
  display_name        = "${route.method} ${route.path}"
  method              = "${route.method}"
  url_template        = "${route.path}"

  response {
    status_code = 200
  }
}`);
  });

  // CORS policy if enabled
  if (config.cors_enabled) {
    sections.push(`
# CORS Policy
resource "azurerm_api_management_api_policy" "cors" {
  api_name            = azurerm_api_management_api.main.name
  api_management_name = azurerm_api_management.main.name
  resource_group_name = var.resource_group_name

  xml_content = <<XML
<policies>
  <inbound>
    <cors allow-credentials="true">
      <allowed-origins>
        ${config.cors_config.allow_origins.map(o => `<origin>${o}</origin>`).join('\n        ')}
      </allowed-origins>
      <allowed-methods>
        ${config.cors_config.allow_methods.map(m => `<method>${m}</method>`).join('\n        ')}
      </allowed-methods>
      <allowed-headers>
        ${config.cors_config.allow_headers.map(h => `<header>${h}</header>`).join('\n        ')}
      </allowed-headers>
    </cors>
    <base />
  </inbound>
  <backend>
    <base />
  </backend>
  <outbound>
    <base />
  </outbound>
  <on-error>
    <base />
  </on-error>
</policies>
XML
}`);
  }

  return sections.join('\n');
}

// =============================================================================
// Variables
// =============================================================================

export function generateAzureAPIVariables(_config: APIGatewayConfig): string {
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

variable "sku_name" {
  description = "SKU for API Management"
  type        = string
  default     = "Consumption_0"
}

variable "publisher_name" {
  description = "Publisher name for API Management"
  type        = string
  default     = "Organization"
}

variable "publisher_email" {
  description = "Publisher email for API Management"
  type        = string
}

variable "function_app_urls" {
  description = "Map of function names to their URLs for backend integration"
  type        = map(string)
  default     = {}
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

export function generateAzureAPIOutputs(): string {
  return `output "apim_id" {
  description = "ID of the API Management instance"
  value       = azurerm_api_management.main.id
}

output "apim_name" {
  description = "Name of the API Management instance"
  value       = azurerm_api_management.main.name
}

output "gateway_url" {
  description = "Gateway URL of the API Management instance"
  value       = azurerm_api_management.main.gateway_url
}

output "api_id" {
  description = "ID of the API"
  value       = azurerm_api_management_api.main.id
}

output "management_api_url" {
  description = "Management API URL"
  value       = azurerm_api_management.main.management_api_url
}

output "identity_principal_id" {
  description = "Principal ID of the API Management identity"
  value       = azurerm_api_management.main.identity[0].principal_id
}`;
}
