import type { RDSConfig } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate database module main.tf
 */
export function generateDatabaseMain(config: RDSConfig): string {
  const sections: string[] = [];

  // DB Subnet Group
  sections.push(`${commentBlock('DB Subnet Group', 'Defines which subnets the RDS instance can be placed in.')}

resource "aws_db_subnet_group" "main" {
  name       = "\${var.project_name}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "\${var.project_name}-db-subnet-group"
  })
}`);

  // Security Group for RDS
  sections.push(`${commentBlock('RDS Security Group', 'Controls access to the database instance.')}

resource "aws_security_group" "rds" {
  name        = "\${var.project_name}-rds-sg"
  description = "Security group for RDS instance"
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "\${var.project_name}-rds-sg"
  })
}

resource "aws_vpc_security_group_ingress_rule" "rds_ingress" {
  count = length(var.allowed_security_group_ids)

  security_group_id            = aws_security_group.rds.id
  description                  = "Allow database access from allowed security groups"
  from_port                    = ${config.engine === 'postgres' ? 5432 : 3306}
  to_port                      = ${config.engine === 'postgres' ? 5432 : 3306}
  ip_protocol                  = "tcp"
  referenced_security_group_id = var.allowed_security_group_ids[count.index]
}`);

  // DB Parameter Group
  sections.push(`${commentBlock('DB Parameter Group', 'Custom parameter group for database configuration.')}

resource "aws_db_parameter_group" "main" {
  name   = "\${var.project_name}-db-params"
  family = "${config.engine}${config.engine_version.split('.')[0]}"

  tags = merge(var.tags, {
    Name = "\${var.project_name}-db-params"
  })
}`);

  // Random password for master user
  sections.push(`${commentBlock('Database Password', 'Generates a random password for the master user.')}

resource "random_password" "master" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}`);

  // RDS Instance
  sections.push(`${commentBlock('RDS Instance', 'The main database instance.')}

resource "aws_db_instance" "main" {
  identifier = var.db_identifier

  # Engine configuration
  engine               = "${config.engine}"
  engine_version       = "${config.engine_version}"
  instance_class       = var.instance_class
  
  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = ${config.storage_encrypted}

  # Database configuration
  db_name  = var.database_name
  username = var.master_username
  password = random_password.master.result

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = ${config.publicly_accessible}
  multi_az               = ${config.multi_az}

  # Parameter group
  parameter_group_name = aws_db_parameter_group.main.name

  # Backup configuration
  backup_retention_period = ${config.backup_retention_period}
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Deletion protection
  deletion_protection = ${config.deletion_protection}
  skip_final_snapshot = ${config.skip_final_snapshot}
  ${!config.skip_final_snapshot ? `final_snapshot_identifier = "\${var.project_name}-db-final-snapshot"` : ''}

  tags = merge(var.tags, {
    Name = "\${var.project_name}-db"
  })
}`);

  // Store password in Secrets Manager
  sections.push(`${commentBlock('Secrets Manager', 'Stores the database credentials securely.')}

resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "\${var.project_name}/database/credentials"
  description = "Database credentials for \${var.project_name}"

  tags = merge(var.tags, {
    Name = "\${var.project_name}-db-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = aws_db_instance.main.username
    password = random_password.master.result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    database = aws_db_instance.main.db_name
    engine   = aws_db_instance.main.engine
  })
}`);

  return joinSections(...sections);
}

/**
 * Generate database module variables.tf
 */
export function generateDatabaseVariables(config: RDSConfig): string {
  return `variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the DB subnet group"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "List of security group IDs allowed to access the database"
  type        = list(string)
  default     = []
}

variable "db_identifier" {
  description = "Identifier for the RDS instance"
  type        = string
  default     = "${config.identifier || 'app-db'}"
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "${config.instance_class}"
}

variable "allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = ${config.allocated_storage}
}

variable "max_allocated_storage" {
  description = "Maximum storage for autoscaling in GB"
  type        = number
  default     = ${config.max_allocated_storage}
}

variable "database_name" {
  description = "Name of the initial database"
  type        = string
  default     = "${config.database_name}"
}

variable "master_username" {
  description = "Master username for the database"
  type        = string
  default     = "${config.master_username}"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`;
}

/**
 * Generate database module outputs.tf
 */
export function generateDatabaseOutputs(): string {
  return `output "db_instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "db_instance_address" {
  description = "Address of the RDS instance"
  value       = aws_db_instance.main.address
}

output "db_instance_port" {
  description = "Port of the RDS instance"
  value       = aws_db_instance.main.port
}

output "db_instance_endpoint" {
  description = "Connection endpoint for the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "db_name" {
  description = "Name of the database"
  value       = aws_db_instance.main.db_name
}

output "db_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing DB credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}`;
}
