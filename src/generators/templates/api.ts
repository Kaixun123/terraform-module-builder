import type { APIGatewayConfig } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate API Gateway module main.tf
 */
export function generateAPIMain(config: APIGatewayConfig): string {
  const sections: string[] = [];

  // API Gateway HTTP API
  const corsConfig = config.cors_enabled ? `
  cors_configuration {
    allow_origins     = ${JSON.stringify(config.cors_config.allow_origins)}
    allow_methods     = ${JSON.stringify(config.cors_config.allow_methods)}
    allow_headers     = ${JSON.stringify(config.cors_config.allow_headers)}
    max_age           = ${config.cors_config.max_age}
    allow_credentials = false
  }` : '';

  sections.push(`${commentBlock('API Gateway HTTP API', 'HTTP API endpoint for serverless backend.')}

resource "aws_apigatewayv2_api" "main" {
  name          = var.api_name
  description   = "${config.description}"
  protocol_type = "${config.protocol_type}"${corsConfig}

  tags = merge(var.tags, {
    Name = var.api_name
  })
}`);

  // Default Stage
  sections.push(`${commentBlock('API Stage', 'Deployment stage for the API.')}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "${config.stage_name}"
  auto_deploy = ${config.auto_deploy}

  default_route_settings {
    throttling_burst_limit = ${config.throttling_burst_limit}
    throttling_rate_limit  = ${config.throttling_rate_limit}
  }

  tags = merge(var.tags, {
    Name = "\${var.api_name}-stage"
  })
}`);

  // Generate integrations and routes for each route config
  const uniqueFunctions = [...new Set(config.routes.map(r => r.lambda_function))];
  
  uniqueFunctions.forEach((funcName) => {
    const resourceName = funcName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    
    sections.push(`${commentBlock(`Integration: ${funcName}`, 'Lambda integration for the function.')}

resource "aws_apigatewayv2_integration" "${resourceName}" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = var.lambda_invoke_arns["${funcName}"]
  payload_format_version = "2.0"
}

resource "aws_lambda_permission" "${resourceName}" {
  statement_id  = "AllowAPIGateway-${funcName}"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["${funcName}"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "\${aws_apigatewayv2_api.main.execution_arn}/*/*"
}`);
  });

  // Generate routes
  config.routes.forEach((route, index) => {
    const funcResourceName = route.lambda_function.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const routeResourceName = `route_${index}`;
    const routeKey = route.method === 'ANY' ? `ANY ${route.path}` : `${route.method} ${route.path}`;

    sections.push(`resource "aws_apigatewayv2_route" "${routeResourceName}" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "${routeKey}"
  target    = "integrations/\${aws_apigatewayv2_integration.${funcResourceName}.id}"
}`);
  });

  return joinSections(...sections);
}

/**
 * Generate API Gateway module variables.tf
 */
export function generateAPIVariables(config: APIGatewayConfig): string {
  return `variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "${config.name || 'api'}"
}

variable "lambda_invoke_arns" {
  description = "Map of Lambda function names to invoke ARNs"
  type        = map(string)
}

variable "lambda_function_names" {
  description = "Map of Lambda function names to function names"
  type        = map(string)
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`;
}

/**
 * Generate API Gateway module outputs.tf
 */
export function generateAPIOutputs(): string {
  return `output "api_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.main.id
}

output "api_endpoint" {
  description = "Endpoint URL of the API Gateway"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "api_execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_apigatewayv2_api.main.execution_arn
}

output "stage_id" {
  description = "ID of the API Gateway stage"
  value       = aws_apigatewayv2_stage.main.id
}

output "invoke_url" {
  description = "Invoke URL for the API"
  value       = aws_apigatewayv2_stage.main.invoke_url
}`;
}
