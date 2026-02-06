import type { VPCConfig, SubnetConfig, SecurityGroupConfig } from '../../types';

// =============================================================================
// Azure Virtual Network Generator
// =============================================================================

export function generateAzureNetworkingMain(
  vnetConfig: VPCConfig | null,
  subnetConfig: SubnetConfig | null,
  nsgConfig: SecurityGroupConfig | null
): string {
  const sections: string[] = [];

  // VNet
  if (vnetConfig) {
    sections.push(`# =============================================================================
# Azure Virtual Network
# =============================================================================

resource "azurerm_virtual_network" "main" {
  name                = "\${var.project_name}-vnet"
  location            = var.location
  resource_group_name = var.resource_group_name
  address_space       = [var.address_space]

  tags = var.tags
}`);
  }

  // Subnets
  if (subnetConfig && vnetConfig) {
    sections.push(`# =============================================================================
# Subnets
# =============================================================================`);

    // Public subnets
    subnetConfig.public_subnet_cidrs.forEach((cidr, index) => {
      sections.push(`
resource "azurerm_subnet" "public_${index + 1}" {
  name                 = "\${var.project_name}-public-${index + 1}"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["${cidr}"]
}`);
    });

    // Private subnets
    subnetConfig.private_subnet_cidrs.forEach((cidr, index) => {
      sections.push(`
resource "azurerm_subnet" "private_${index + 1}" {
  name                 = "\${var.project_name}-private-${index + 1}"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["${cidr}"]
}`);
    });

    // NAT Gateway if enabled
    if (subnetConfig.create_nat_gateway) {
      sections.push(`
# =============================================================================
# NAT Gateway
# =============================================================================

resource "azurerm_public_ip" "nat" {
  name                = "\${var.project_name}-nat-pip"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = ["1"]

  tags = var.tags
}

resource "azurerm_nat_gateway" "main" {
  name                    = "\${var.project_name}-nat"
  location                = var.location
  resource_group_name     = var.resource_group_name
  sku_name                = "Standard"
  idle_timeout_in_minutes = 10

  tags = var.tags
}

resource "azurerm_nat_gateway_public_ip_association" "main" {
  nat_gateway_id       = azurerm_nat_gateway.main.id
  public_ip_address_id = azurerm_public_ip.nat.id
}`);

      // Associate NAT Gateway with private subnets
      subnetConfig.private_subnet_cidrs.forEach((_, index) => {
        sections.push(`
resource "azurerm_subnet_nat_gateway_association" "private_${index + 1}" {
  subnet_id      = azurerm_subnet.private_${index + 1}.id
  nat_gateway_id = azurerm_nat_gateway.main.id
}`);
      });
    }
  }

  // Network Security Groups
  if (nsgConfig && vnetConfig) {
    sections.push(`
# =============================================================================
# Network Security Groups
# =============================================================================`);

    nsgConfig.groups.forEach((group) => {
      const nsgName = group.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      sections.push(`
resource "azurerm_network_security_group" "${nsgName}" {
  name                = "\${var.project_name}-${group.name}-nsg"
  location            = var.location
  resource_group_name = var.resource_group_name

  tags = var.tags
}`);

      // Ingress rules
      let priority = 100;
      group.ingress_rules.forEach((rule) => {
        const ruleName = rule.description.toLowerCase().replace(/[^a-z0-9]/g, '_');
        sections.push(`
resource "azurerm_network_security_rule" "${nsgName}_in_${ruleName}" {
  name                        = "${rule.description.replace(/"/g, '')}"
  priority                    = ${priority}
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "${rule.protocol === '-1' ? '*' : rule.protocol.charAt(0).toUpperCase() + rule.protocol.slice(1)}"
  source_port_range           = "*"
  destination_port_range      = "${rule.from_port === rule.to_port ? rule.from_port : `${rule.from_port}-${rule.to_port}`}"
  source_address_prefix       = "${rule.cidr_blocks?.[0] || (rule.source_security_group ? 'VirtualNetwork' : '*')}"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.${nsgName}.name
}`);
        priority += 10;
      });

      // Egress rules
      priority = 100;
      group.egress_rules.forEach((rule) => {
        const ruleName = rule.description.toLowerCase().replace(/[^a-z0-9]/g, '_');
        sections.push(`
resource "azurerm_network_security_rule" "${nsgName}_out_${ruleName}" {
  name                        = "${rule.description.replace(/"/g, '')}"
  priority                    = ${priority}
  direction                   = "Outbound"
  access                      = "Allow"
  protocol                    = "${rule.protocol === '-1' ? '*' : rule.protocol.charAt(0).toUpperCase() + rule.protocol.slice(1)}"
  source_port_range           = "*"
  destination_port_range      = "${rule.from_port === 0 && rule.to_port === 0 ? '*' : (rule.from_port === rule.to_port ? rule.from_port : `${rule.from_port}-${rule.to_port}`)}"
  source_address_prefix       = "*"
  destination_address_prefix  = "${rule.cidr_blocks?.[0] || '*'}"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.${nsgName}.name
}`);
        priority += 10;
      });
    });
  }

  return sections.join('\n');
}

// =============================================================================
// Variables
// =============================================================================

export function generateAzureNetworkingVariables(
  vnetConfig: VPCConfig | null,
  subnetConfig: SubnetConfig | null,
  _nsgConfig: SecurityGroupConfig | null
): string {
  const vars: string[] = [`variable "project_name" {
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

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}`];

  if (vnetConfig) {
    vars.push(`
variable "address_space" {
  description = "Address space for the virtual network"
  type        = string
  default     = "${vnetConfig.cidr_block}"
}`);
  }

  if (subnetConfig) {
    vars.push(`
variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ${JSON.stringify(subnetConfig.public_subnet_cidrs)}
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ${JSON.stringify(subnetConfig.private_subnet_cidrs)}
}`);
  }

  return vars.join('\n');
}

// =============================================================================
// Outputs
// =============================================================================

export function generateAzureNetworkingOutputs(
  vnetConfig: VPCConfig | null,
  subnetConfig: SubnetConfig | null,
  nsgConfig: SecurityGroupConfig | null
): string {
  const outputs: string[] = [];

  if (vnetConfig) {
    outputs.push(`output "vnet_id" {
  description = "ID of the virtual network"
  value       = azurerm_virtual_network.main.id
}

output "vnet_name" {
  description = "Name of the virtual network"
  value       = azurerm_virtual_network.main.name
}`);
  }

  if (subnetConfig && vnetConfig) {
    const publicSubnetIds = subnetConfig.public_subnet_cidrs
      .map((_, i) => `azurerm_subnet.public_${i + 1}.id`)
      .join(', ');
    const privateSubnetIds = subnetConfig.private_subnet_cidrs
      .map((_, i) => `azurerm_subnet.private_${i + 1}.id`)
      .join(', ');

    outputs.push(`
output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = [${publicSubnetIds}]
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = [${privateSubnetIds}]
}`);
  }

  if (nsgConfig && vnetConfig) {
    const nsgIds = nsgConfig.groups
      .map((g) => {
        const name = g.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `"${g.name}" = azurerm_network_security_group.${name}.id`;
      })
      .join(',\n    ');

    outputs.push(`
output "nsg_ids" {
  description = "Map of NSG names to IDs"
  value = {
    ${nsgIds}
  }
}`);
  }

  return outputs.join('\n');
}
