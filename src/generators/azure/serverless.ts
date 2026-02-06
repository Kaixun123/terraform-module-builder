import type { LambdaConfig } from '../../types';

// =============================================================================
// Azure Functions Generator
// =============================================================================

export function generateAzureServerlessMain(config: LambdaConfig): string {
  const sections: string[] = [];

  sections.push(`# =============================================================================
# Azure Functions
# =============================================================================

# Storage Account for Function App
resource "azurerm_storage_account" "functions" {
  name                     = "\${replace(var.project_name, "-", "")}func"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = var.tags
}

# App Service Plan (Consumption)
resource "azurerm_service_plan" "functions" {
  name                = "\${var.project_name}-asp"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = var.sku_name

  tags = var.tags
}`);

  // Generate each function app
  config.functions.forEach((func) => {
    const funcName = func.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const runtime = mapRuntime(func.runtime);

    sections.push(`
# Function App: ${func.name}
resource "azurerm_linux_function_app" "${funcName}" {
  name                = "\${var.project_name}-${func.name}"
  resource_group_name = var.resource_group_name
  location            = var.location

  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key
  service_plan_id            = azurerm_service_plan.functions.id

  site_config {
    application_stack {
      ${runtime.stack}
    }
    
    ${func.vpc_enabled ? `vnet_route_all_enabled = true` : ''}
  }

  app_settings = merge({
    "FUNCTIONS_WORKER_RUNTIME" = "${runtime.worker}"
  }, var.${funcName}_app_settings)

  identity {
    type = var.managed_identity_id != "" ? "UserAssigned" : "SystemAssigned"
    identity_ids = var.managed_identity_id != "" ? [var.managed_identity_id] : []
  }

  ${func.vpc_enabled ? `
  virtual_network_subnet_id = var.subnet_id
  ` : ''}

  tags = var.tags
}

${func.create_function_url ? `# Function URL (HTTP trigger endpoint)
# Note: Azure Functions have built-in HTTP endpoints when HTTP triggers are configured` : ''}`);
  });

  return sections.join('\n');
}

function mapRuntime(awsRuntime: string): { stack: string; worker: string } {
  if (awsRuntime.startsWith('nodejs')) {
    const version = awsRuntime.replace('nodejs', '').replace('.x', '');
    return { stack: `node_version = "${version}"`, worker: 'node' };
  }
  if (awsRuntime.startsWith('python')) {
    const version = awsRuntime.replace('python', '');
    return { stack: `python_version = "${version}"`, worker: 'python' };
  }
  if (awsRuntime.startsWith('java')) {
    const version = awsRuntime.replace('java', '');
    return { stack: `java_version = "${version}"`, worker: 'java' };
  }
  // Default to Node.js
  return { stack: 'node_version = "18"', worker: 'node' };
}

// =============================================================================
// Variables
// =============================================================================

export function generateAzureServerlessVariables(config: LambdaConfig): string {
  const vars: string[] = [`variable "project_name" {
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
  description = "SKU for the App Service Plan"
  type        = string
  default     = "Y1"
}

variable "managed_identity_id" {
  description = "ID of the managed identity to assign"
  type        = string
  default     = ""
}

variable "subnet_id" {
  description = "Subnet ID for VNet integration"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}`];

  // Add app_settings variable for each function
  config.functions.forEach((func) => {
    const funcName = func.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    vars.push(`
variable "${funcName}_app_settings" {
  description = "App settings for ${func.name} function"
  type        = map(string)
  default     = ${JSON.stringify(func.environment_variables || {})}
}`);
  });

  return vars.join('\n');
}

// =============================================================================
// Outputs
// =============================================================================

export function generateAzureServerlessOutputs(config: LambdaConfig): string {
  const outputs: string[] = [];

  config.functions.forEach((func) => {
    const funcName = func.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    outputs.push(`output "${funcName}_id" {
  description = "ID of the ${func.name} function app"
  value       = azurerm_linux_function_app.${funcName}.id
}

output "${funcName}_hostname" {
  description = "Default hostname of the ${func.name} function app"
  value       = azurerm_linux_function_app.${funcName}.default_hostname
}

output "${funcName}_identity_principal_id" {
  description = "Principal ID of the ${func.name} function's identity"
  value       = azurerm_linux_function_app.${funcName}.identity[0].principal_id
}`);
  });

  return outputs.join('\n\n');
}
