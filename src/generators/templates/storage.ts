import type { S3Config } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate storage module main.tf
 */
export function generateStorageMain(s3: S3Config, _project?: unknown): string {
  void _project; // Reserved for future use
  const sections: string[] = [];

  // Random suffix for globally unique bucket name
  sections.push(`${commentBlock('Random Suffix', 'Ensures globally unique S3 bucket name.')}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}`);

  // S3 Bucket
  sections.push(`${commentBlock('S3 Bucket', 'Main storage bucket for application data.')}

resource "aws_s3_bucket" "main" {
  bucket = "\${var.bucket_prefix}-\${random_id.bucket_suffix.hex}"

  # Prevent accidental deletion of this bucket
  # lifecycle {
  #   prevent_destroy = true
  # }

  tags = merge(var.tags, {
    Name = "\${var.project_name}-bucket"
  })
}`);

  // Versioning
  if (s3.versioning_enabled) {
    sections.push(`${commentBlock('Bucket Versioning', 'Keeps multiple versions of objects for data protection and recovery.')}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}`);
  }

  // Server-side encryption
  if (s3.encryption_enabled) {
    sections.push(`${commentBlock('Server-Side Encryption', 'Encrypts all objects stored in the bucket using AES-256.')}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}`);
  }

  // Block public access
  sections.push(`${commentBlock('Public Access Block', 'Blocks all public access to the bucket for security.')}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`);

  return joinSections(...sections);
}

/**
 * Generate storage module variables.tf
 */
export function generateStorageVariables(s3: S3Config): string {
  return `variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "bucket_prefix" {
  description = "Prefix for the S3 bucket name (will be suffixed with random ID)"
  type        = string
  default     = "${s3.bucket_prefix || 'my-app'}"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`;
}

/**
 * Generate storage module outputs.tf
 */
export function generateStorageOutputs(): string {
  return `output "bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket_domain_name
}`;
}
