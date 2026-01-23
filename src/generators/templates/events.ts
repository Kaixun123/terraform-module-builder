import type { EventBridgeConfig } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate events module main.tf
 */
export function generateEventsMain(config: EventBridgeConfig): string {
  const sections: string[] = [];

  // Custom event bus if not using default
  if (!config.use_default_bus && config.custom_bus_name) {
    sections.push(`${commentBlock('Custom Event Bus', 'Custom EventBridge bus for application events.')}

resource "aws_cloudwatch_event_bus" "main" {
  name = "\${var.project_name}-${config.custom_bus_name}"

  tags = merge(var.tags, {
    Name = "\${var.project_name}-${config.custom_bus_name}"
  })
}`);
  }

  const busRef = config.use_default_bus ? '"default"' : 'aws_cloudwatch_event_bus.main.name';

  // Generate rules
  config.rules.forEach((rule) => {
    const ruleName = rule.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();

    let eventConfig = '';
    if (rule.event_pattern) {
      eventConfig = `
  event_pattern = jsonencode(${JSON.stringify(rule.event_pattern, null, 2).split('\n').join('\n  ')})`;
    } else if (rule.schedule_expression) {
      eventConfig = `
  schedule_expression = "${rule.schedule_expression}"`;
    }

    sections.push(`${commentBlock(`EventBridge Rule: ${rule.name}`, rule.description)}

resource "aws_cloudwatch_event_rule" "${ruleName}" {
  name           = "\${var.project_name}-${rule.name}"
  description    = "${rule.description}"
  event_bus_name = ${busRef}${eventConfig}

  tags = merge(var.tags, {
    Name = "\${var.project_name}-${rule.name}"
  })
}`);

    // Generate targets for this rule
    rule.targets.forEach((target, targetIndex) => {
      const targetResourceName = `${ruleName}_target_${targetIndex}`;
      const targetName = target.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();

      let targetArn = '';
      let roleArn = '';

      switch (target.type) {
        case 'lambda':
          targetArn = `var.lambda_function_arns["${target.name}"]`;
          break;
        case 'sqs':
          targetArn = `var.sqs_queue_arns["${target.name}"]`;
          roleArn = `\n  role_arn = aws_iam_role.eventbridge.arn`;
          break;
        case 'sns':
          targetArn = `var.sns_topic_arns["${target.name}"]`;
          break;
      }

      const inputTransformer = target.input_transformer ? `

  input_transformer {
    input_paths    = ${JSON.stringify(target.input_transformer.input_paths)}
    input_template = "${target.input_transformer.input_template.replace(/"/g, '\\"')}"
  }` : '';

      sections.push(`resource "aws_cloudwatch_event_target" "${targetResourceName}" {
  rule           = aws_cloudwatch_event_rule.${ruleName}.name
  event_bus_name = ${busRef}
  target_id      = "${targetName}"
  arn            = ${targetArn}${roleArn}${inputTransformer}
}`);

      // Lambda permission for EventBridge
      if (target.type === 'lambda') {
        sections.push(`resource "aws_lambda_permission" "${targetResourceName}" {
  statement_id  = "AllowEventBridge-${rule.name}-${target.name}"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["${target.name}"]
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.${ruleName}.arn
}`);
      }
    });
  });

  // IAM role for EventBridge to invoke SQS/SNS
  const hasSQSTargets = config.rules.some(r => r.targets.some(t => t.type === 'sqs'));
  if (hasSQSTargets) {
    sections.push(`${commentBlock('EventBridge IAM Role', 'Role for EventBridge to invoke targets.')}

data "aws_iam_policy_document" "eventbridge_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "eventbridge" {
  name               = "\${var.project_name}-eventbridge-role"
  assume_role_policy = data.aws_iam_policy_document.eventbridge_assume.json

  tags = merge(var.tags, {
    Name = "\${var.project_name}-eventbridge-role"
  })
}

data "aws_iam_policy_document" "eventbridge_sqs" {
  statement {
    effect    = "Allow"
    actions   = ["sqs:SendMessage"]
    resources = values(var.sqs_queue_arns)
  }
}

resource "aws_iam_role_policy" "eventbridge_sqs" {
  name   = "sqs-send-message"
  role   = aws_iam_role.eventbridge.id
  policy = data.aws_iam_policy_document.eventbridge_sqs.json
}`);
  }

  return joinSections(...sections);
}

/**
 * Generate events module variables.tf
 */
export function generateEventsVariables(config: EventBridgeConfig): string {
  const sections = [`variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`];

  const hasLambdaTargets = config.rules.some(r => r.targets.some(t => t.type === 'lambda'));
  const hasSQSTargets = config.rules.some(r => r.targets.some(t => t.type === 'sqs'));
  const hasSNSTargets = config.rules.some(r => r.targets.some(t => t.type === 'sns'));

  if (hasLambdaTargets) {
    sections.push(`variable "lambda_function_arns" {
  description = "Map of Lambda function names to ARNs"
  type        = map(string)
  default     = {}
}

variable "lambda_function_names" {
  description = "Map of Lambda function names to function names"
  type        = map(string)
  default     = {}
}`);
  }

  if (hasSQSTargets) {
    sections.push(`variable "sqs_queue_arns" {
  description = "Map of SQS queue names to ARNs"
  type        = map(string)
  default     = {}
}`);
  }

  if (hasSNSTargets) {
    sections.push(`variable "sns_topic_arns" {
  description = "Map of SNS topic names to ARNs"
  type        = map(string)
  default     = {}
}`);
  }

  return joinSections(...sections);
}

/**
 * Generate events module outputs.tf
 */
export function generateEventsOutputs(config: EventBridgeConfig): string {
  const outputs: string[] = [];

  if (!config.use_default_bus && config.custom_bus_name) {
    outputs.push(`output "event_bus_name" {
  description = "Name of the custom event bus"
  value       = aws_cloudwatch_event_bus.main.name
}

output "event_bus_arn" {
  description = "ARN of the custom event bus"
  value       = aws_cloudwatch_event_bus.main.arn
}`);
  }

  config.rules.forEach((rule) => {
    const ruleName = rule.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    
    outputs.push(`output "${ruleName}_rule_arn" {
  description = "ARN of the ${rule.name} rule"
  value       = aws_cloudwatch_event_rule.${ruleName}.arn
}`);
  });

  return joinSections(...outputs);
}
