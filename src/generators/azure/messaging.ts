import type { SQSConfig, SNSConfig } from '../../types';

// =============================================================================
// Azure Service Bus Generator
// =============================================================================

export function generateAzureMessagingMain(
  sqsConfig: SQSConfig | null,
  snsConfig: SNSConfig | null
): string {
  const sections: string[] = [];

  // Service Bus Namespace (required for both queues and topics)
  sections.push(`# =============================================================================
# Azure Service Bus
# =============================================================================

resource "azurerm_servicebus_namespace" "main" {
  name                = "\${var.project_name}-sb"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.servicebus_sku

  tags = var.tags
}`);

  // Queues
  if (sqsConfig && sqsConfig.queues.length > 0) {
    sections.push(`
# =============================================================================
# Service Bus Queues
# =============================================================================`);

    sqsConfig.queues.forEach((queue) => {
      const queueName = queue.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const ttlDays = Math.ceil(queue.message_retention_seconds / 86400);

      sections.push(`
resource "azurerm_servicebus_queue" "${queueName}" {
  name         = "${queue.name}"
  namespace_id = azurerm_servicebus_namespace.main.id

  max_size_in_megabytes                = var.queue_max_size_mb
  default_message_ttl                  = "P${ttlDays}D"
  lock_duration                        = "PT${Math.ceil(queue.visibility_timeout_seconds / 60)}M"
  max_delivery_count                   = ${queue.dlq_max_receive_count}
  dead_lettering_on_message_expiration = ${queue.enable_dlq}
  requires_session                     = ${queue.fifo}
  enable_partitioning                  = false
}`);

      // Dead Letter Queue is automatic in Azure Service Bus
    });
  }

  // Topics
  if (snsConfig && snsConfig.topics.length > 0) {
    sections.push(`
# =============================================================================
# Service Bus Topics
# =============================================================================`);

    snsConfig.topics.forEach((topic) => {
      const topicName = topic.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

      sections.push(`
resource "azurerm_servicebus_topic" "${topicName}" {
  name         = "${topic.name}"
  namespace_id = azurerm_servicebus_namespace.main.id

  max_size_in_megabytes = var.topic_max_size_mb
  enable_partitioning   = ${topic.fifo}
}`);

      // Subscriptions
      topic.subscriptions.forEach((sub) => {
        const subName = sub.endpoint.toLowerCase().replace(/[^a-z0-9]/g, '_');
        sections.push(`
resource "azurerm_servicebus_subscription" "${topicName}_${subName}" {
  name               = "${sub.endpoint}"
  topic_id           = azurerm_servicebus_topic.${topicName}.id
  max_delivery_count = 10

  dead_lettering_on_message_expiration = true
}`);
      });
    });
  }

  return sections.join('\n');
}

// =============================================================================
// Variables
// =============================================================================

export function generateAzureMessagingVariables(): string {
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

variable "servicebus_sku" {
  description = "SKU for Service Bus namespace"
  type        = string
  default     = "Standard"
}

variable "queue_max_size_mb" {
  description = "Maximum size of queues in MB"
  type        = number
  default     = 1024
}

variable "topic_max_size_mb" {
  description = "Maximum size of topics in MB"
  type        = number
  default     = 1024
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

export function generateAzureMessagingOutputs(
  sqsConfig: SQSConfig | null,
  snsConfig: SNSConfig | null
): string {
  const outputs: string[] = [];

  outputs.push(`output "namespace_id" {
  description = "ID of the Service Bus namespace"
  value       = azurerm_servicebus_namespace.main.id
}

output "namespace_name" {
  description = "Name of the Service Bus namespace"
  value       = azurerm_servicebus_namespace.main.name
}

output "primary_connection_string" {
  description = "Primary connection string"
  value       = azurerm_servicebus_namespace.main.default_primary_connection_string
  sensitive   = true
}`);

  if (sqsConfig && sqsConfig.queues.length > 0) {
    const queueIds = sqsConfig.queues
      .map((q) => {
        const name = q.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `"${q.name}" = azurerm_servicebus_queue.${name}.id`;
      })
      .join(',\n    ');

    outputs.push(`
output "queue_ids" {
  description = "Map of queue names to IDs"
  value = {
    ${queueIds}
  }
}`);
  }

  if (snsConfig && snsConfig.topics.length > 0) {
    const topicIds = snsConfig.topics
      .map((t) => {
        const name = t.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `"${t.name}" = azurerm_servicebus_topic.${name}.id`;
      })
      .join(',\n    ');

    outputs.push(`
output "topic_ids" {
  description = "Map of topic names to IDs"
  value = {
    ${topicIds}
  }
}`);
  }

  return outputs.join('\n');
}
