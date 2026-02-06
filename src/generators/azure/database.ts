import type { RDSConfig } from '../../types';

// =============================================================================
// Azure Database Generator
// =============================================================================

export function generateAzureDatabaseMain(config: RDSConfig): string {
  const engine = config.engine === 'postgres' ? 'postgresql' : config.engine;
  
  return `# =============================================================================
# Azure Database for ${engine.charAt(0).toUpperCase() + engine.slice(1)}
# =============================================================================

# Random password for database admin
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Key Vault for storing credentials
resource "azurerm_key_vault_secret" "db_password" {
  name         = "\${var.project_name}-db-password"
  value        = random_password.db_password.result
  key_vault_id = var.key_vault_id

  depends_on = [random_password.db_password]
}

${engine === 'postgresql' ? generatePostgresFlexible(config) : generateMySQLFlexible(config)}`;
}

function generatePostgresFlexible(config: RDSConfig): string {
  return `# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = var.server_name
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = var.engine_version
  delegated_subnet_id    = var.public_network_access ? null : var.subnet_id
  private_dns_zone_id    = var.public_network_access ? null : var.private_dns_zone_id
  administrator_login    = var.administrator_login
  administrator_password = random_password.db_password.result
  zone                   = "1"

  storage_mb = var.storage_mb

  sku_name = var.sku_name

  ${config.multi_az ? `high_availability {
    mode = "ZoneRedundant"
  }` : ''}

  backup_retention_days        = var.backup_retention_days
  geo_redundant_backup_enabled = var.geo_redundant_backup

  tags = var.tags
}

# Database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# Firewall rule for Azure services (if public)
${config.publicly_accessible ? `resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}` : '# Private access only - no firewall rules needed'}`;
}

function generateMySQLFlexible(config: RDSConfig): string {
  return `# MySQL Flexible Server
resource "azurerm_mysql_flexible_server" "main" {
  name                   = var.server_name
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = var.engine_version
  delegated_subnet_id    = var.public_network_access ? null : var.subnet_id
  private_dns_zone_id    = var.public_network_access ? null : var.private_dns_zone_id
  administrator_login    = var.administrator_login
  administrator_password = random_password.db_password.result
  zone                   = "1"

  storage {
    size_gb = var.storage_mb / 1024
  }

  sku_name = var.sku_name

  ${config.multi_az ? `high_availability {
    mode = "ZoneRedundant"
  }` : ''}

  backup_retention_days        = var.backup_retention_days
  geo_redundant_backup_enabled = var.geo_redundant_backup

  tags = var.tags
}

# Database
resource "azurerm_mysql_flexible_database" "main" {
  name                = var.database_name
  resource_group_name = var.resource_group_name
  server_name         = azurerm_mysql_flexible_server.main.name
  charset             = "utf8mb4"
  collation           = "utf8mb4_unicode_ci"
}`;
}

// =============================================================================
// Variables
// =============================================================================

export function generateAzureDatabaseVariables(config: RDSConfig): string {
  return `variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "server_name" {
  description = "Name of the database server"
  type        = string
  default     = "${config.identifier || 'db'}"
}

variable "engine_version" {
  description = "Database engine version"
  type        = string
  default     = "${config.engine_version}"
}

variable "sku_name" {
  description = "SKU for the database server"
  type        = string
  default     = "${config.instance_class}"
}

variable "storage_mb" {
  description = "Storage size in MB"
  type        = number
  default     = ${config.allocated_storage * 1024}
}

variable "administrator_login" {
  description = "Database administrator login"
  type        = string
  default     = "${config.master_username}"
}

variable "database_name" {
  description = "Name of the database to create"
  type        = string
  default     = "${config.database_name}"
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = ${config.backup_retention_period}
}

variable "geo_redundant_backup" {
  description = "Enable geo-redundant backups"
  type        = bool
  default     = false
}

variable "public_network_access" {
  description = "Enable public network access"
  type        = bool
  default     = ${config.publicly_accessible}
}

variable "subnet_id" {
  description = "Subnet ID for private access"
  type        = string
  default     = ""
}

variable "private_dns_zone_id" {
  description = "Private DNS zone ID for private access"
  type        = string
  default     = ""
}

variable "key_vault_id" {
  description = "Key Vault ID for storing secrets"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}`;
}

// =============================================================================
// Outputs
// =============================================================================

export function generateAzureDatabaseOutputs(config: RDSConfig): string {
  const engine = config.engine === 'postgres' ? 'postgresql' : config.engine;
  const resourceType = engine === 'postgresql' ? 'azurerm_postgresql_flexible_server' : 'azurerm_mysql_flexible_server';

  return `output "server_id" {
  description = "ID of the database server"
  value       = ${resourceType}.main.id
}

output "server_fqdn" {
  description = "FQDN of the database server"
  value       = ${resourceType}.main.fqdn
}

output "server_name" {
  description = "Name of the database server"
  value       = ${resourceType}.main.name
}

output "database_name" {
  description = "Name of the database"
  value       = var.database_name
}

output "administrator_login" {
  description = "Administrator login"
  value       = var.administrator_login
}

output "password_secret_id" {
  description = "Key Vault secret ID for the database password"
  value       = azurerm_key_vault_secret.db_password.id
  sensitive   = true
}`;
}
