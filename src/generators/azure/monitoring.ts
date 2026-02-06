import type { CloudWatchConfig } from '../../types';

// =============================================================================
// Azure Monitor Generator
// =============================================================================

export function generateAzureMonitoringMain(config: CloudWatchConfig): string {
  const sections: string[] = [];

  sections.push(`# =============================================================================
# Azure Monitor - Log Analytics Workspace
# =============================================================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = "\${var.project_name}-law"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = var.log_retention_days

  tags = var.tags
}

# Application Insights (for application monitoring)
resource "azurerm_application_insights" "main" {
  name                = "\${var.project_name}-appins"
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  tags = var.tags
}`);

  // Action Groups for alerts
  if (config.alarms.length > 0) {
    sections.push(`
# =============================================================================
# Action Groups
# =============================================================================

resource "azurerm_monitor_action_group" "main" {
  name                = "\${var.project_name}-ag"
  resource_group_name = var.resource_group_name
  short_name          = substr(var.project_name, 0, 12)

  dynamic "email_receiver" {
    for_each = var.alert_email_addresses
    content {
      name          = email_receiver.value
      email_address = email_receiver.value
    }
  }

  tags = var.tags
}`);
  }

  // Metric Alerts
  if (config.alarms.length > 0) {
    sections.push(`
# =============================================================================
# Metric Alerts
# =============================================================================`);

    config.alarms.forEach((alarm) => {
      const alarmName = alarm.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      sections.push(`
resource "azurerm_monitor_metric_alert" "${alarmName}" {
  name                = "${alarm.name}"
  resource_group_name = var.resource_group_name
  scopes              = [var.monitored_resource_id]
  description         = "${alarm.description}"
  severity            = ${mapSeverity(alarm.comparison_operator)}
  frequency           = "PT${Math.ceil(alarm.period / 60)}M"
  window_size         = "PT${Math.ceil(alarm.period * alarm.evaluation_periods / 60)}M"

  criteria {
    metric_namespace = "${alarm.namespace}"
    metric_name      = "${alarm.metric_name}"
    aggregation      = "${alarm.statistic}"
    operator         = "${mapOperator(alarm.comparison_operator)}"
    threshold        = ${alarm.threshold}
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}`);
    });
  }

  // Dashboard
  if (config.dashboard_enabled) {
    sections.push(`
# =============================================================================
# Azure Dashboard
# =============================================================================

resource "azurerm_portal_dashboard" "main" {
  name                = "\${var.project_name}-dashboard"
  resource_group_name = var.resource_group_name
  location            = var.location
  
  dashboard_properties = jsonencode({
    lenses = {
      "0" = {
        order = 0
        parts = {
          "0" = {
            position = {
              x          = 0
              y          = 0
              colSpan    = 6
              rowSpan    = 4
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsExplorerPart"
            }
          }
        }
      }
    }
  })

  tags = var.tags
}`);
  }

  return sections.join('\n');
}

function mapSeverity(comparison: string): number {
  // Map AWS comparison to Azure severity (0=Critical, 1=Error, 2=Warning, 3=Informational, 4=Verbose)
  if (comparison.includes('GreaterThan')) return 1;
  if (comparison.includes('LessThan')) return 2;
  return 2;
}

function mapOperator(comparison: string): string {
  const mapping: Record<string, string> = {
    'GreaterThanThreshold': 'GreaterThan',
    'LessThanThreshold': 'LessThan',
    'GreaterThanOrEqualToThreshold': 'GreaterThanOrEqual',
    'LessThanOrEqualToThreshold': 'LessThanOrEqual',
  };
  return mapping[comparison] || 'GreaterThan';
}

// =============================================================================
// Variables
// =============================================================================

export function generateAzureMonitoringVariables(config: CloudWatchConfig): string {
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

variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = ${config.log_groups[0]?.retention_days || 30}
}

variable "alert_email_addresses" {
  description = "Email addresses for alert notifications"
  type        = list(string)
  default     = []
}

variable "monitored_resource_id" {
  description = "Resource ID to monitor with metric alerts"
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

export function generateAzureMonitoringOutputs(): string {
  return `output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.main.id
}

output "log_analytics_workspace_name" {
  description = "Name of the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.main.name
}

output "workspace_key" {
  description = "Primary shared key for the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.main.primary_shared_key
  sensitive   = true
}

output "application_insights_id" {
  description = "ID of Application Insights"
  value       = azurerm_application_insights.main.id
}

output "application_insights_instrumentation_key" {
  description = "Instrumentation key for Application Insights"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Connection string for Application Insights"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}`;
}
