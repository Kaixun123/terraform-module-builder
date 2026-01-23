import type { SQSConfig, SNSConfig } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate SQS main.tf content
 */
export function generateSQSMain(config: SQSConfig): string {
  const sections: string[] = [];

  config.queues.forEach((queue) => {
    const resourceName = queue.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const queueName = queue.fifo ? `\${var.project_name}-${queue.name}.fifo` : `\${var.project_name}-${queue.name}`;

    // DLQ if enabled
    if (queue.enable_dlq) {
      const dlqName = queue.fifo ? `\${var.project_name}-${queue.name}-dlq.fifo` : `\${var.project_name}-${queue.name}-dlq`;
      
      sections.push(`${commentBlock(`Dead Letter Queue: ${queue.name}`, 'Stores messages that failed processing.')}

resource "aws_sqs_queue" "${resourceName}_dlq" {
  name                       = "${dlqName}"
  ${queue.fifo ? 'fifo_queue                  = true' : ''}
  message_retention_seconds  = 1209600  # 14 days

  tags = merge(var.tags, {
    Name = "${dlqName}"
    Type = "DLQ"
  })
}`);
    }

    // Main queue
    const dlqPolicy = queue.enable_dlq ? `

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.${resourceName}_dlq.arn
    maxReceiveCount     = ${queue.dlq_max_receive_count}
  })` : '';

    const fifoConfig = queue.fifo ? `
  fifo_queue                  = true
  content_based_deduplication = ${queue.content_based_deduplication}` : '';

    sections.push(`${commentBlock(`SQS Queue: ${queue.name}`, 'Message queue for async processing.')}

resource "aws_sqs_queue" "${resourceName}" {
  name                       = "${queueName}"${fifoConfig}
  visibility_timeout_seconds = ${queue.visibility_timeout_seconds}
  message_retention_seconds  = ${queue.message_retention_seconds}
  max_message_size           = ${queue.max_message_size}
  delay_seconds              = ${queue.delay_seconds}
  receive_wait_time_seconds  = ${queue.receive_wait_time_seconds}${dlqPolicy}

  tags = merge(var.tags, {
    Name = "${queueName}"
  })
}`);
  });

  return joinSections(...sections);
}

/**
 * Generate SNS main.tf content
 */
export function generateSNSMain(config: SNSConfig): string {
  const sections: string[] = [];

  config.topics.forEach((topic) => {
    const resourceName = topic.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const topicName = topic.fifo ? `\${var.project_name}-${topic.name}.fifo` : `\${var.project_name}-${topic.name}`;

    const fifoConfig = topic.fifo ? `
  fifo_topic                  = true
  content_based_deduplication = ${topic.content_based_deduplication}` : '';

    sections.push(`${commentBlock(`SNS Topic: ${topic.name}`, topic.display_name)}

resource "aws_sns_topic" "${resourceName}" {
  name         = "${topicName}"
  display_name = "${topic.display_name}"${fifoConfig}

  tags = merge(var.tags, {
    Name = "${topicName}"
  })
}`);

    // Subscriptions
    topic.subscriptions.forEach((sub, index) => {
      const subResourceName = `${resourceName}_sub_${index}`;
      let endpoint = '';

      switch (sub.protocol) {
        case 'sqs':
          endpoint = `var.sqs_queue_arns["${sub.endpoint}"]`;
          break;
        case 'lambda':
          endpoint = `var.lambda_function_arns["${sub.endpoint}"]`;
          break;
        case 'email':
        case 'https':
          endpoint = `"${sub.endpoint}"`;
          break;
      }

      const filterPolicy = sub.filter_policy 
        ? `\n  filter_policy = jsonencode(${JSON.stringify(sub.filter_policy)})` 
        : '';

      sections.push(`resource "aws_sns_topic_subscription" "${subResourceName}" {
  topic_arn = aws_sns_topic.${resourceName}.arn
  protocol  = "${sub.protocol}"
  endpoint  = ${endpoint}${filterPolicy}
}`);
    });
  });

  return joinSections(...sections);
}

/**
 * Generate messaging module main.tf (combined SQS + SNS)
 */
export function generateMessagingMain(sqsConfig: SQSConfig | null, snsConfig: SNSConfig | null): string {
  const sections: string[] = [];

  if (sqsConfig && sqsConfig.queues.length > 0) {
    sections.push(generateSQSMain(sqsConfig));
  }

  if (snsConfig && snsConfig.topics.length > 0) {
    sections.push(generateSNSMain(snsConfig));
  }

  return joinSections(...sections);
}

/**
 * Generate messaging module variables.tf
 */
export function generateMessagingVariables(_sqsConfig: SQSConfig | null, snsConfig: SNSConfig | null): string {
  const sections = [`variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`];

  // Check if SNS has Lambda or SQS subscriptions
  const hasLambdaSubs = snsConfig?.topics.some(t => t.subscriptions.some(s => s.protocol === 'lambda'));
  const hasSQSSubs = snsConfig?.topics.some(t => t.subscriptions.some(s => s.protocol === 'sqs'));

  if (hasLambdaSubs) {
    sections.push(`variable "lambda_function_arns" {
  description = "Map of Lambda function names to ARNs for SNS subscriptions"
  type        = map(string)
  default     = {}
}`);
  }

  if (hasSQSSubs) {
    sections.push(`variable "sqs_queue_arns" {
  description = "Map of SQS queue names to ARNs for SNS subscriptions"
  type        = map(string)
  default     = {}
}`);
  }

  return joinSections(...sections);
}

/**
 * Generate messaging module outputs.tf
 */
export function generateMessagingOutputs(sqsConfig: SQSConfig | null, snsConfig: SNSConfig | null): string {
  const outputs: string[] = [];

  if (sqsConfig && sqsConfig.queues.length > 0) {
    sqsConfig.queues.forEach((queue) => {
      const resourceName = queue.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
      
      outputs.push(`output "${resourceName}_queue_url" {
  description = "URL of the ${queue.name} queue"
  value       = aws_sqs_queue.${resourceName}.url
}

output "${resourceName}_queue_arn" {
  description = "ARN of the ${queue.name} queue"
  value       = aws_sqs_queue.${resourceName}.arn
}`);
    });

    // Map of queue names to ARNs
    const queueMap = sqsConfig.queues
      .map((q) => {
        const name = q.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        return `    "${q.name}" = aws_sqs_queue.${name}.arn`;
      })
      .join('\n');

    outputs.push(`output "sqs_queue_arns" {
  description = "Map of queue names to ARNs"
  value = {
${queueMap}
  }
}`);
  }

  if (snsConfig && snsConfig.topics.length > 0) {
    snsConfig.topics.forEach((topic) => {
      const resourceName = topic.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
      
      outputs.push(`output "${resourceName}_topic_arn" {
  description = "ARN of the ${topic.name} topic"
  value       = aws_sns_topic.${resourceName}.arn
}`);
    });

    // Map of topic names to ARNs
    const topicMap = snsConfig.topics
      .map((t) => {
        const name = t.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        return `    "${t.name}" = aws_sns_topic.${name}.arn`;
      })
      .join('\n');

    outputs.push(`output "sns_topic_arns" {
  description = "Map of topic names to ARNs"
  value = {
${topicMap}
  }
}`);
  }

  return joinSections(...outputs);
}
