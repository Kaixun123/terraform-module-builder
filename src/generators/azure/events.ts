import type { EventBridgeConfig } from '../../types';

// =============================================================================
// Azure Event Grid Generator
// =============================================================================

export function generateAzureEventsMain(config: EventBridgeConfig): string {
  const sections: string[] = [];

  // Custom Event Grid Topic (if not using default)
  if (!config.use_default_bus && config.custom_bus_name) {
    sections.push(`# =============================================================================
# Azure Event Grid Topic
# =============================================================================

resource "azurerm_eventgrid_topic" "main" {
  name                = "\${var.project_name}-${config.custom_bus_name}"
  location            = var.location
  resource_group_name = var.resource_group_name

  input_schema = "EventGridSchema"

  tags = var.tags
}`);
  }

  // Event Subscriptions for rules
  if (config.rules.length > 0) {
    sections.push(`
# =============================================================================
# Event Grid Subscriptions
# =============================================================================`);

    config.rules.forEach((rule) => {
      const ruleName = rule.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

      rule.targets.forEach((target) => {
        const targetName = target.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const subscriptionName = `${ruleName}_${targetName}`;

        // Determine endpoint type and configuration
        let endpointConfig = '';
        switch (target.type) {
          case 'lambda':
            endpointConfig = `
  azure_function_endpoint {
    function_id = var.function_ids["${target.name}"]
  }`;
            break;
          case 'sqs':
            endpointConfig = `
  service_bus_queue_endpoint_id = var.queue_ids["${target.name}"]`;
            break;
          case 'sns':
            endpointConfig = `
  service_bus_topic_endpoint_id = var.topic_ids["${target.name}"]`;
            break;
        }

        sections.push(`
resource "azurerm_eventgrid_event_subscription" "${subscriptionName}" {
  name  = "${rule.name}-${target.name}"
  scope = ${!config.use_default_bus && config.custom_bus_name ? 'azurerm_eventgrid_topic.main.id' : 'var.resource_group_id'}
${endpointConfig}

  ${rule.event_pattern?.detail_type ? `
  included_event_types = ${JSON.stringify(rule.event_pattern.detail_type)}` : ''}

  ${rule.schedule_expression ? `# Note: For scheduled events, use Azure Logic Apps or Function Timer triggers` : ''}
}`);
      });
    });
  }

  // If no custom topic or rules, provide a placeholder
  if (sections.length === 0) {
    sections.push(`# =============================================================================
# Azure Event Grid
# =============================================================================

# Event Grid is configured at the system level in Azure
# Use azurerm_eventgrid_system_topic for resource-based events
# Use azurerm_eventgrid_topic for custom application events

# Example system topic for storage account events:
# resource "azurerm_eventgrid_system_topic" "storage" {
#   name                   = "\${var.project_name}-storage-events"
#   resource_group_name    = var.resource_group_name
#   location               = var.location
#   source_arm_resource_id = var.storage_account_id
#   topic_type             = "Microsoft.Storage.StorageAccounts"
# }`);
  }

  return sections.join('\n');
}

// =============================================================================
// Variables
// =============================================================================

export function generateAzureEventsVariables(): string {
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
  description = "ID of the resource group for subscription scope"
  type        = string
}

variable "function_ids" {
  description = "Map of function names to their resource IDs"
  type        = map(string)
  default     = {}
}

variable "queue_ids" {
  description = "Map of queue names to their resource IDs"
  type        = map(string)
  default     = {}
}

variable "topic_ids" {
  description = "Map of topic names to their resource IDs"
  type        = map(string)
  default     = {}
}

variable "storage_account_id" {
  description = "Storage account ID for system topic events"
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

export function generateAzureEventsOutputs(config: EventBridgeConfig): string {
  const outputs: string[] = [];

  if (!config.use_default_bus && config.custom_bus_name) {
    outputs.push(`output "topic_id" {
  description = "ID of the Event Grid topic"
  value       = azurerm_eventgrid_topic.main.id
}

output "topic_endpoint" {
  description = "Endpoint of the Event Grid topic"
  value       = azurerm_eventgrid_topic.main.endpoint
}

output "topic_primary_access_key" {
  description = "Primary access key for the Event Grid topic"
  value       = azurerm_eventgrid_topic.main.primary_access_key
  sensitive   = true
}`);
  }

  if (outputs.length === 0) {
    outputs.push(`output "info" {
  description = "Event Grid configuration info"
  value       = "Event Grid configured - use system topics for resource events"
}`);
  }

  return outputs.join('\n');
}
