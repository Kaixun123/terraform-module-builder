import type { EC2Config } from '../../types';

// =============================================================================
// Azure Virtual Machine Generator
// =============================================================================

export function generateAzureComputeMain(config: EC2Config): string {
  return `# =============================================================================
# Azure Virtual Machine
# =============================================================================

# Public IP (if enabled)
${config.associate_public_ip ? `resource "azurerm_public_ip" "vm" {
  name                = "\${var.project_name}-vm-pip"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = var.tags
}` : '# Public IP disabled'}

# Network Interface
resource "azurerm_network_interface" "vm" {
  name                = "\${var.project_name}-vm-nic"
  location            = var.location
  resource_group_name = var.resource_group_name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = var.subnet_id
    private_ip_address_allocation = "Dynamic"
    ${config.associate_public_ip ? 'public_ip_address_id           = azurerm_public_ip.vm.id' : ''}
  }

  tags = var.tags
}

# Associate NIC with NSG
resource "azurerm_network_interface_security_group_association" "vm" {
  count                     = var.nsg_id != "" ? 1 : 0
  network_interface_id      = azurerm_network_interface.vm.id
  network_security_group_id = var.nsg_id
}

# Linux Virtual Machine
resource "azurerm_linux_virtual_machine" "main" {
  name                = "\${var.project_name}-vm"
  resource_group_name = var.resource_group_name
  location            = var.location
  size                = var.vm_size
  admin_username      = var.admin_username

  network_interface_ids = [
    azurerm_network_interface.vm.id,
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = var.os_disk_type
    disk_size_gb         = var.os_disk_size_gb
  }

  source_image_reference {
    publisher = var.image_publisher
    offer     = var.image_offer
    sku       = var.image_sku
    version   = var.image_version
  }

  identity {
    type = var.managed_identity_id != "" ? "UserAssigned" : "SystemAssigned"
    identity_ids = var.managed_identity_id != "" ? [var.managed_identity_id] : []
  }

  tags = var.tags
}`;
}

// =============================================================================
// Variables
// =============================================================================

export function generateAzureComputeVariables(config: EC2Config): string {
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

variable "subnet_id" {
  description = "ID of the subnet for the VM"
  type        = string
}

variable "nsg_id" {
  description = "ID of the network security group"
  type        = string
  default     = ""
}

variable "vm_size" {
  description = "Azure VM size"
  type        = string
  default     = "${config.instance_type}"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "SSH public key for the admin user"
  type        = string
}

variable "os_disk_size_gb" {
  description = "Size of the OS disk in GB"
  type        = number
  default     = ${config.root_volume_size}
}

variable "os_disk_type" {
  description = "Storage account type for the OS disk"
  type        = string
  default     = "StandardSSD_LRS"
}

variable "image_publisher" {
  description = "VM image publisher"
  type        = string
  default     = "Canonical"
}

variable "image_offer" {
  description = "VM image offer"
  type        = string
  default     = "0001-com-ubuntu-server-jammy"
}

variable "image_sku" {
  description = "VM image SKU"
  type        = string
  default     = "22_04-lts-gen2"
}

variable "image_version" {
  description = "VM image version"
  type        = string
  default     = "latest"
}

variable "managed_identity_id" {
  description = "ID of the managed identity to assign"
  type        = string
  default     = ""
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

export function generateAzureComputeOutputs(config: EC2Config): string {
  return `output "vm_id" {
  description = "ID of the virtual machine"
  value       = azurerm_linux_virtual_machine.main.id
}

output "vm_name" {
  description = "Name of the virtual machine"
  value       = azurerm_linux_virtual_machine.main.name
}

output "private_ip" {
  description = "Private IP address of the VM"
  value       = azurerm_network_interface.vm.private_ip_address
}

${config.associate_public_ip ? `output "public_ip" {
  description = "Public IP address of the VM"
  value       = azurerm_public_ip.vm.ip_address
}` : ''}

output "identity_principal_id" {
  description = "Principal ID of the VM's managed identity"
  value       = azurerm_linux_virtual_machine.main.identity[0].principal_id
}`;
}
