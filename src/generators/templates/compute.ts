import type { EC2Config } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate compute module main.tf
 */
export function generateComputeMain(
  ec2: EC2Config,
  hasIAM: boolean,
  _project?: unknown
): string {
  void _project; // Reserved for future use
  const sections: string[] = [];

  // AMI Data Source (Amazon Linux 2023)
  sections.push(`${commentBlock('AMI Data Source', 'Automatically finds the latest Amazon Linux 2023 AMI for the current region.')}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}`);

  // Security Group
  sections.push(`${commentBlock('Security Group', 'Controls inbound and outbound traffic for the EC2 instance.')}

resource "aws_security_group" "main" {
  name        = "\${var.project_name}-ec2-sg"
  description = "Security group for EC2 instance"
  vpc_id      = var.vpc_id

  # SSH access (restrict in production!)
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP access
  ingress {
    description = "HTTP access"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access
  ingress {
    description = "HTTPS access"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "\${var.project_name}-ec2-sg"
  })
}`);

  // Key Pair Data Source (if specified)
  if (ec2.key_pair_name) {
    sections.push(`${commentBlock('Key Pair', 'References an existing EC2 key pair for SSH access.')}

data "aws_key_pair" "main" {
  key_name = var.key_pair_name
}`);
  }

  // EC2 Instance
  const instanceProfile = hasIAM ? '\n  iam_instance_profile = var.instance_profile_name' : '';
  const keyName = ec2.key_pair_name ? '\n  key_name             = data.aws_key_pair.main.key_name' : '';

  sections.push(`${commentBlock('EC2 Instance', 'Main compute instance running Amazon Linux 2023.')}

resource "aws_instance" "main" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [aws_security_group.main.id]
  associate_public_ip_address = var.associate_public_ip${instanceProfile}${keyName}

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  # Enable detailed monitoring (optional, incurs additional costs)
  monitoring = false

  # User data script for initial setup
  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              echo "Instance initialized by Terraform" > /tmp/terraform-init.txt
              EOF

  tags = merge(var.tags, {
    Name = "\${var.project_name}-ec2"
  })
}`);

  return joinSections(...sections);
}

/**
 * Generate compute module variables.tf
 */
export function generateComputeVariables(ec2: EC2Config, hasIAM: boolean): string {
  const sections = [
    `variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "subnet_id" {
  description = "ID of the subnet to launch the instance in"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "${ec2.instance_type}"
}

variable "associate_public_ip" {
  description = "Whether to associate a public IP address"
  type        = bool
  default     = ${ec2.associate_public_ip}
}

variable "root_volume_size" {
  description = "Size of the root EBS volume in GB"
  type        = number
  default     = ${ec2.root_volume_size}
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`,
  ];

  if (ec2.key_pair_name) {
    sections.push(`variable "key_pair_name" {
  description = "Name of the EC2 key pair for SSH access"
  type        = string
  default     = "${ec2.key_pair_name}"
}`);
  }

  if (hasIAM) {
    sections.push(`variable "instance_profile_name" {
  description = "Name of the IAM instance profile to attach"
  type        = string
}`);
  }

  return joinSections(...sections);
}

/**
 * Generate compute module outputs.tf
 */
export function generateComputeOutputs(): string {
  return `output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.main.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.main.public_ip
}

output "instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.main.private_ip
}

output "security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.main.id
}`;
}
