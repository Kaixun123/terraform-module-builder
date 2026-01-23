import type { IAMConfig } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate IAM module main.tf
 */
export function generateIAMMain(
  iam: IAMConfig,
  hasS3: boolean,
  _project?: unknown
): string {
  void _project; // Reserved for future use
  const sections: string[] = [];

  // IAM Role
  sections.push(`${commentBlock('IAM Role for EC2', 'Allows EC2 instances to assume this role and access AWS services.')}

data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ec2" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = merge(var.tags, {
    Name = var.role_name
  })
}`);

  // S3 Access Policy (if S3 is enabled and s3_access is true)
  if (hasS3 && iam.s3_access) {
    sections.push(`${commentBlock('S3 Access Policy', 'Grants read/write access to the S3 bucket for EC2 instances.')}

data "aws_iam_policy_document" "s3_access" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    resources = [
      var.s3_bucket_arn,
      "\${var.s3_bucket_arn}/*"
    ]
  }
}

resource "aws_iam_policy" "s3_access" {
  name        = "\${var.project_name}-s3-access"
  description = "Allows EC2 instances to access the S3 bucket"
  policy      = data.aws_iam_policy_document.s3_access.json

  tags = merge(var.tags, {
    Name = "\${var.project_name}-s3-access-policy"
  })
}

resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.s3_access.arn
}`);
  }

  // SSM Access for Session Manager (recommended for secure access)
  sections.push(`${commentBlock('SSM Access Policy', 'Enables AWS Systems Manager Session Manager for secure shell access without SSH keys.')}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}`);

  // Managed Policy Attachments
  if (iam.managed_policy_arns.length > 0) {
    sections.push(`${commentBlock('Managed Policy Attachments', 'Attaches additional AWS managed policies to the role.')}

resource "aws_iam_role_policy_attachment" "managed" {
  count = length(var.managed_policy_arns)

  role       = aws_iam_role.ec2.name
  policy_arn = var.managed_policy_arns[count.index]
}`);
  }

  // Instance Profile
  if (iam.create_instance_profile) {
    sections.push(`${commentBlock('Instance Profile', 'Allows the IAM role to be attached to EC2 instances.')}

resource "aws_iam_instance_profile" "ec2" {
  name = "\${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = merge(var.tags, {
    Name = "\${var.project_name}-ec2-profile"
  })
}`);
  }

  return joinSections(...sections);
}

/**
 * Generate IAM module variables.tf
 */
export function generateIAMVariables(iam: IAMConfig, hasS3: boolean): string {
  const sections = [
    `variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "role_name" {
  description = "Name of the IAM role"
  type        = string
  default     = "${iam.role_name || 'ec2-role'}"
}

variable "managed_policy_arns" {
  description = "List of managed policy ARNs to attach to the role"
  type        = list(string)
  default     = ${JSON.stringify(iam.managed_policy_arns)}
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`,
  ];

  if (hasS3 && iam.s3_access) {
    sections.push(`variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket to grant access to"
  type        = string
}`);
  }

  return joinSections(...sections);
}

/**
 * Generate IAM module outputs.tf
 */
export function generateIAMOutputs(iam: IAMConfig): string {
  const sections = [
    `output "role_arn" {
  description = "ARN of the IAM role"
  value       = aws_iam_role.ec2.arn
}

output "role_name" {
  description = "Name of the IAM role"
  value       = aws_iam_role.ec2.name
}`,
  ];

  if (iam.create_instance_profile) {
    sections.push(`output "instance_profile_name" {
  description = "Name of the IAM instance profile"
  value       = aws_iam_instance_profile.ec2.name
}

output "instance_profile_arn" {
  description = "ARN of the IAM instance profile"
  value       = aws_iam_instance_profile.ec2.arn
}`);
  }

  return joinSections(...sections);
}
