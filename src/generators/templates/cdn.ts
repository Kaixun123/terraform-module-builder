import type { CloudFrontConfig } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate CDN module main.tf
 */
export function generateCDNMain(config: CloudFrontConfig): string {
  const sections: string[] = [];

  // Origin Access Control for S3
  if (config.origin_type === 's3') {
    sections.push(`${commentBlock('Origin Access Control', 'Restricts S3 bucket access to CloudFront only.')}

resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "\${var.project_name}-oac"
  description                       = "OAC for \${var.project_name} S3 origin"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}`);
  }

  // Cache Policy (use managed policies)
  sections.push(`${commentBlock('Cache Policy', 'Defines caching behavior for CloudFront.')}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_origin_request_policy" "cors_s3" {
  name = "Managed-CORS-S3Origin"
}`);

  // CloudFront Distribution
  const originConfig = config.origin_type === 's3' ? `
    origin_id                = "S3Origin"
    domain_name              = var.s3_bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id` : `
    origin_id   = "CustomOrigin"
    domain_name = "${config.custom_origin_config?.domain_name || 'example.com'}"

    custom_origin_config {
      http_port              = ${config.custom_origin_config?.http_port || 80}
      https_port             = ${config.custom_origin_config?.https_port || 443}
      origin_protocol_policy = "${config.custom_origin_config?.origin_protocol_policy || 'https-only'}"
      origin_ssl_protocols   = ["TLSv1.2"]
    }`;

  const errorResponses = config.custom_error_responses
    .map((err) => `
  custom_error_response {
    error_code            = ${err.error_code}
    response_code         = ${err.response_code}
    response_page_path    = "${err.response_page_path}"
    error_caching_min_ttl = ${err.error_caching_min_ttl}
  }`)
    .join('');

  const geoRestriction = config.geo_restriction.restriction_type !== 'none' ? `
    restriction_type = "${config.geo_restriction.restriction_type}"
    locations        = ${JSON.stringify(config.geo_restriction.locations)}` : `
    restriction_type = "none"`;

  sections.push(`${commentBlock('CloudFront Distribution', 'CDN distribution for content delivery.')}

resource "aws_cloudfront_distribution" "main" {
  enabled             = ${config.enabled}
  is_ipv6_enabled     = true
  comment             = var.distribution_comment
  default_root_object = "${config.default_root_object}"
  price_class         = "${config.price_class}"

  origin {${originConfig}
  }

  default_cache_behavior {
    target_origin_id       = "${config.origin_type === 's3' ? 'S3Origin' : 'CustomOrigin'}"
    viewer_protocol_policy = "${config.default_cache_behavior.viewer_protocol_policy}"
    allowed_methods        = ${JSON.stringify(config.default_cache_behavior.allowed_methods)}
    cached_methods         = ${JSON.stringify(config.default_cache_behavior.cached_methods)}
    compress               = ${config.default_cache_behavior.compress}

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.cors_s3.id
  }${errorResponses}

  restrictions {
    geo_restriction {${geoRestriction}
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(var.tags, {
    Name = "\${var.project_name}-cdn"
  })
}`);

  // S3 Bucket Policy for OAC
  if (config.origin_type === 's3') {
    sections.push(`${commentBlock('S3 Bucket Policy', 'Allows CloudFront to access the S3 bucket.')}

data "aws_iam_policy_document" "s3_policy" {
  statement {
    sid    = "AllowCloudFrontOAC"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["\${var.s3_bucket_arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.main.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "cdn" {
  bucket = var.s3_bucket_id
  policy = data.aws_iam_policy_document.s3_policy.json
}`);
  }

  return joinSections(...sections);
}

/**
 * Generate CDN module variables.tf
 */
export function generateCDNVariables(config: CloudFrontConfig): string {
  const sections = [`variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "distribution_comment" {
  description = "Comment for the CloudFront distribution"
  type        = string
  default     = "${config.comment || 'CDN Distribution'}"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`];

  if (config.origin_type === 's3') {
    sections.push(`variable "s3_bucket_id" {
  description = "ID of the S3 bucket for the origin"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for the origin"
  type        = string
}

variable "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  type        = string
}`);
  }

  return joinSections(...sections);
}

/**
 * Generate CDN module outputs.tf
 */
export function generateCDNOutputs(): string {
  return `output "distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.arn
}

output "distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "distribution_hosted_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}`;
}
