import type { LambdaConfig } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate serverless module main.tf
 */
export function generateServerlessMain(config: LambdaConfig, hasVPC: boolean): string {
  const sections: string[] = [];

  // IAM Role for Lambda execution
  sections.push(`${commentBlock('Lambda Execution Role', 'IAM role that Lambda functions assume during execution.')}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda" {
  name               = "\${var.project_name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = merge(var.tags, {
    Name = "\${var.project_name}-lambda-role"
  })
}

# Basic Lambda execution policy (CloudWatch Logs)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}`);

  // VPC access policy if any function uses VPC
  const hasVPCFunction = config.functions.some(f => f.vpc_enabled);
  if (hasVPCFunction && hasVPC) {
    sections.push(`# VPC access policy for Lambda
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}`);
  }

  // Generate each Lambda function
  config.functions.forEach((func) => {
    const funcName = func.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    
    // CloudWatch Log Group
    sections.push(`${commentBlock(`Lambda Function: ${func.name}`, func.description)}

resource "aws_cloudwatch_log_group" "${funcName}" {
  name              = "/aws/lambda/\${var.project_name}-${func.name}"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name = "\${var.project_name}-${func.name}-logs"
  })
}`);

    // Lambda function
    const vpcConfig = func.vpc_enabled && hasVPC ? `

  vpc_config {
    subnet_ids         = var.${func.vpc_subnet_type}_subnet_ids
    security_group_ids = var.lambda_security_group_ids
  }` : '';

    const envVars = Object.keys(func.environment_variables).length > 0
      ? `

  environment {
    variables = {
${Object.entries(func.environment_variables).map(([k, v]) => `      ${k} = "${v}"`).join('\n')}
    }
  }` : '';

    const reservedConcurrency = func.reserved_concurrency !== null
      ? `\n  reserved_concurrent_executions = ${func.reserved_concurrency}` : '';

    const layers = func.layers.length > 0
      ? `\n  layers = ${JSON.stringify(func.layers)}` : '';

    sections.push(`resource "aws_lambda_function" "${funcName}" {
  function_name = "\${var.project_name}-${func.name}"
  description   = "${func.description}"
  role          = aws_iam_role.lambda.arn
  
  # Placeholder - replace with actual deployment package
  filename         = "lambda_placeholder.zip"
  source_code_hash = filebase64sha256("lambda_placeholder.zip")
  
  runtime       = "${func.runtime}"
  handler       = "${func.handler}"
  architectures = ["${func.architecture}"]
  memory_size   = ${func.memory_size}
  timeout       = ${func.timeout}${reservedConcurrency}${layers}${vpcConfig}${envVars}

  depends_on = [aws_cloudwatch_log_group.${funcName}]

  tags = merge(var.tags, {
    Name = "\${var.project_name}-${func.name}"
  })
}`);

    // Function URL if enabled
    if (func.create_function_url) {
      sections.push(`resource "aws_lambda_function_url" "${funcName}" {
  function_name      = aws_lambda_function.${funcName}.function_name
  authorization_type = "NONE"

  cors {
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    max_age           = 86400
  }
}`);
    }
  });

  return joinSections(...sections);
}

/**
 * Generate serverless module variables.tf
 */
export function generateServerlessVariables(config: LambdaConfig, hasVPC: boolean): string {
  const sections = [`variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`];

  const hasVPCFunction = config.functions.some(f => f.vpc_enabled);
  if (hasVPCFunction && hasVPC) {
    sections.push(`variable "public_subnet_ids" {
  description = "List of public subnet IDs for Lambda VPC configuration"
  type        = list(string)
  default     = []
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for Lambda VPC configuration"
  type        = list(string)
  default     = []
}

variable "lambda_security_group_ids" {
  description = "List of security group IDs for Lambda functions"
  type        = list(string)
  default     = []
}`);
  }

  return joinSections(...sections);
}

/**
 * Generate serverless module outputs.tf
 */
export function generateServerlessOutputs(config: LambdaConfig): string {
  const outputs: string[] = [];

  config.functions.forEach((func) => {
    const funcName = func.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    
    outputs.push(`output "${funcName}_function_arn" {
  description = "ARN of the ${func.name} Lambda function"
  value       = aws_lambda_function.${funcName}.arn
}

output "${funcName}_function_name" {
  description = "Name of the ${func.name} Lambda function"
  value       = aws_lambda_function.${funcName}.function_name
}

output "${funcName}_invoke_arn" {
  description = "Invoke ARN of the ${func.name} Lambda function"
  value       = aws_lambda_function.${funcName}.invoke_arn
}`);

    if (func.create_function_url) {
      outputs.push(`output "${funcName}_function_url" {
  description = "URL of the ${func.name} Lambda function"
  value       = aws_lambda_function_url.${funcName}.function_url
}`);
    }
  });

  // Output Lambda role ARN
  outputs.push(`output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda.arn
}

output "lambda_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda.name
}`);

  // Output a map of function names to ARNs
  const funcMap = config.functions
    .map((f) => {
      const name = f.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
      return `    "${f.name}" = aws_lambda_function.${name}.arn`;
    })
    .join('\n');

  outputs.push(`output "function_arns" {
  description = "Map of function names to ARNs"
  value = {
${funcMap}
  }
}`);

  return joinSections(...outputs);
}

/**
 * Get Lambda function info for use by other generators
 */
export function getLambdaFunctionInfo(config: LambdaConfig): { name: string; resourceName: string }[] {
  return config.functions.map((func) => ({
    name: func.name,
    resourceName: func.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase(),
  }));
}
