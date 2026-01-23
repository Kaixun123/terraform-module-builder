import type { SESConfig } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate email module main.tf
 */
export function generateEmailMain(config: SESConfig): string {
  const sections: string[] = [];

  // Domain Identity
  if (config.domain_identity) {
    sections.push(`${commentBlock('SES Domain Identity', 'Verifies domain ownership for sending emails.')}

resource "aws_ses_domain_identity" "main" {
  domain = "${config.domain_identity}"
}

# Domain verification TXT record
resource "aws_ses_domain_identity_verification" "main" {
  domain     = aws_ses_domain_identity.main.id
  depends_on = [aws_ses_domain_identity.main]

  # Note: You need to add a TXT record to your DNS with the verification token
  # The verification token is available in aws_ses_domain_identity.main.verification_token
}

# DKIM for domain
resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

# Mail FROM domain (optional)
resource "aws_ses_domain_mail_from" "main" {
  domain           = aws_ses_domain_identity.main.domain
  mail_from_domain = "mail.\${aws_ses_domain_identity.main.domain}"
}`);
  }

  // Email Identities
  if (config.email_identities.length > 0) {
    sections.push(commentBlock('SES Email Identities', 'Individual email addresses verified for sending.'));

    config.email_identities.forEach((email, index) => {
      const resourceName = `email_${index}`;
      
      sections.push(`resource "aws_ses_email_identity" "${resourceName}" {
  email = "${email}"
}`);
    });
  }

  // Configuration Set
  sections.push(`${commentBlock('SES Configuration Set', 'Tracks email sending metrics and events.')}

resource "aws_ses_configuration_set" "main" {
  name = var.configuration_set_name

  reputation_metrics_enabled = true
  sending_enabled            = ${config.enable_sending}

  delivery_options {
    tls_policy = "REQUIRE"
  }
}`);

  // IAM policy for sending emails
  sections.push(`${commentBlock('SES IAM Policy', 'Policy allowing applications to send emails.')}

data "aws_iam_policy_document" "ses_send" {
  statement {
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
      "ses:SendTemplatedEmail"
    ]
    resources = ["*"]
    
    condition {
      test     = "StringEquals"
      variable = "ses:ConfigurationSetName"
      values   = [aws_ses_configuration_set.main.name]
    }
  }
}

resource "aws_iam_policy" "ses_send" {
  name        = "\${var.project_name}-ses-send"
  description = "Allows sending emails via SES"
  policy      = data.aws_iam_policy_document.ses_send.json

  tags = merge(var.tags, {
    Name = "\${var.project_name}-ses-send-policy"
  })
}`);

  // SMTP Credentials (optional)
  if (config.create_smtp_credentials) {
    sections.push(`${commentBlock('SES SMTP Credentials', 'IAM user for SMTP authentication.')}

resource "aws_iam_user" "ses_smtp" {
  name = "\${var.project_name}-ses-smtp"

  tags = merge(var.tags, {
    Name = "\${var.project_name}-ses-smtp-user"
  })
}

resource "aws_iam_user_policy_attachment" "ses_smtp" {
  user       = aws_iam_user.ses_smtp.name
  policy_arn = aws_iam_policy.ses_send.arn
}

resource "aws_iam_access_key" "ses_smtp" {
  user = aws_iam_user.ses_smtp.name
}

# Store SMTP credentials in Secrets Manager
resource "aws_secretsmanager_secret" "ses_smtp" {
  name        = "\${var.project_name}/ses/smtp-credentials"
  description = "SES SMTP credentials for \${var.project_name}"

  tags = merge(var.tags, {
    Name = "\${var.project_name}-ses-smtp-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "ses_smtp" {
  secret_id = aws_secretsmanager_secret.ses_smtp.id
  secret_string = jsonencode({
    username = aws_iam_access_key.ses_smtp.id
    password = aws_iam_access_key.ses_smtp.ses_smtp_password_v4
    host     = "email-smtp.\${data.aws_region.current.name}.amazonaws.com"
    port     = 587
  })
}

data "aws_region" "current" {}`);
  }

  return joinSections(...sections);
}

/**
 * Generate email module variables.tf
 */
export function generateEmailVariables(config: SESConfig): string {
  return `variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "configuration_set_name" {
  description = "Name of the SES configuration set"
  type        = string
  default     = "${config.configuration_set_name || 'default'}"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`;
}

/**
 * Generate email module outputs.tf
 */
export function generateEmailOutputs(config: SESConfig): string {
  const outputs: string[] = [];

  if (config.domain_identity) {
    outputs.push(`output "domain_identity_arn" {
  description = "ARN of the SES domain identity"
  value       = aws_ses_domain_identity.main.arn
}

output "domain_verification_token" {
  description = "Verification token for DNS TXT record"
  value       = aws_ses_domain_identity.main.verification_token
  sensitive   = true
}

output "dkim_tokens" {
  description = "DKIM tokens for DNS CNAME records"
  value       = aws_ses_domain_dkim.main.dkim_tokens
}`);
  }

  outputs.push(`output "configuration_set_name" {
  description = "Name of the SES configuration set"
  value       = aws_ses_configuration_set.main.name
}

output "ses_send_policy_arn" {
  description = "ARN of the IAM policy for sending emails"
  value       = aws_iam_policy.ses_send.arn
}`);

  if (config.create_smtp_credentials) {
    outputs.push(`output "smtp_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing SMTP credentials"
  value       = aws_secretsmanager_secret.ses_smtp.arn
}`);
  }

  return joinSections(...outputs);
}
