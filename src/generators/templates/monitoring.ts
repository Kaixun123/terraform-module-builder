import type { CloudWatchConfig } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate monitoring module main.tf
 */
export function generateMonitoringMain(config: CloudWatchConfig): string {
  const sections: string[] = [];

  // Log Groups
  if (config.log_groups.length > 0) {
    sections.push(commentBlock('CloudWatch Log Groups', 'Log groups for application logging.'));

    config.log_groups.forEach((logGroup) => {
      const resourceName = logGroup.name
        .replace(/^\/aws\//, '')
        .replace(/[^a-z0-9_-]/gi, '_')
        .toLowerCase();

      sections.push(`resource "aws_cloudwatch_log_group" "${resourceName}" {
  name              = "${logGroup.name}"
  retention_in_days = ${logGroup.retention_days}

  tags = merge(var.tags, {
    Name = "${logGroup.name}"
  })
}`);
    });
  }

  // Alarms
  if (config.alarms.length > 0) {
    sections.push(commentBlock('CloudWatch Alarms', 'Metric alarms for monitoring.'));

    config.alarms.forEach((alarm) => {
      const resourceName = alarm.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
      
      const dimensions = Object.entries(alarm.dimensions)
        .map(([key, value]) => `    ${key} = "${value}"`)
        .join('\n');

      const alarmActions = alarm.alarm_actions.length > 0
        ? `\n  alarm_actions = var.alarm_sns_topic_arns`
        : '';

      const okActions = alarm.ok_actions.length > 0
        ? `\n  ok_actions = var.ok_sns_topic_arns`
        : '';

      sections.push(`resource "aws_cloudwatch_metric_alarm" "${resourceName}" {
  alarm_name          = "\${var.project_name}-${alarm.name}"
  alarm_description   = "${alarm.description}"
  comparison_operator = "${alarm.comparison_operator}"
  evaluation_periods  = ${alarm.evaluation_periods}
  metric_name         = "${alarm.metric_name}"
  namespace           = "${alarm.namespace}"
  period              = ${alarm.period}
  statistic           = "${alarm.statistic}"
  threshold           = ${alarm.threshold}
  actions_enabled     = ${alarm.actions_enabled}${alarmActions}${okActions}

  dimensions = {
${dimensions}
  }

  tags = merge(var.tags, {
    Name = "\${var.project_name}-${alarm.name}"
  })
}`);
    });
  }

  // Dashboard
  if (config.dashboard_enabled && config.dashboard_name) {
    sections.push(`${commentBlock('CloudWatch Dashboard', 'Operational dashboard for monitoring.')}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "\${var.project_name}-${config.dashboard_name}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 1
        properties = {
          markdown = "# \${var.project_name} Dashboard"
        }
      }
    ]
  })
}`);
  }

  if (sections.length === 0) {
    sections.push(`# CloudWatch module placeholder
# Add log groups, alarms, or dashboards via configuration`);
  }

  return joinSections(...sections);
}

/**
 * Generate monitoring module variables.tf
 */
export function generateMonitoringVariables(config: CloudWatchConfig): string {
  const sections = [`variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`];

  const hasAlarmActions = config.alarms.some(a => a.alarm_actions.length > 0);
  const hasOkActions = config.alarms.some(a => a.ok_actions.length > 0);

  if (hasAlarmActions) {
    sections.push(`variable "alarm_sns_topic_arns" {
  description = "List of SNS topic ARNs for alarm actions"
  type        = list(string)
  default     = []
}`);
  }

  if (hasOkActions) {
    sections.push(`variable "ok_sns_topic_arns" {
  description = "List of SNS topic ARNs for OK actions"
  type        = list(string)
  default     = []
}`);
  }

  return joinSections(...sections);
}

/**
 * Generate monitoring module outputs.tf
 */
export function generateMonitoringOutputs(config: CloudWatchConfig): string {
  const outputs: string[] = [];

  if (config.log_groups.length > 0) {
    const logGroupMap = config.log_groups
      .map((lg) => {
        const name = lg.name
          .replace(/^\/aws\//, '')
          .replace(/[^a-z0-9_-]/gi, '_')
          .toLowerCase();
        return `    "${lg.name}" = aws_cloudwatch_log_group.${name}.arn`;
      })
      .join('\n');

    outputs.push(`output "log_group_arns" {
  description = "Map of log group names to ARNs"
  value = {
${logGroupMap}
  }
}`);
  }

  if (config.alarms.length > 0) {
    const alarmMap = config.alarms
      .map((a) => {
        const name = a.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        return `    "${a.name}" = aws_cloudwatch_metric_alarm.${name}.arn`;
      })
      .join('\n');

    outputs.push(`output "alarm_arns" {
  description = "Map of alarm names to ARNs"
  value = {
${alarmMap}
  }
}`);
  }

  if (config.dashboard_enabled && config.dashboard_name) {
    outputs.push(`output "dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}`);
  }

  if (outputs.length === 0) {
    outputs.push(`# No outputs - add log groups, alarms, or dashboards via configuration`);
  }

  return joinSections(...outputs);
}
