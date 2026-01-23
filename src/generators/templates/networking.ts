import type { VPCConfig, SubnetConfig } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate VPC and networking module main.tf
 */
export function generateNetworkingMain(
  vpc: VPCConfig,
  subnets: SubnetConfig | null,
  _project?: unknown
): string {
  void _project; // Reserved for future use
  const sections: string[] = [];

  // VPC Resource
  sections.push(`${commentBlock('VPC - Main Virtual Private Cloud', 'Creates an isolated network environment for your AWS resources.')}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = ${vpc.enable_dns_hostnames}
  enable_dns_support   = ${vpc.enable_dns_support}

  tags = merge(var.tags, {
    Name = "\${var.project_name}-vpc"
  })
}`);

  // Internet Gateway
  sections.push(`${commentBlock('Internet Gateway', 'Enables internet access for resources in public subnets.')}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "\${var.project_name}-igw"
  })
}`);

  // Public Route Table
  sections.push(`${commentBlock('Public Route Table', 'Routes traffic from public subnets to the internet gateway.')}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "\${var.project_name}-public-rt"
  })
}`);

  // Subnets if configured
  if (subnets) {
    // Public Subnets
    if (subnets.public_subnet_cidrs.length > 0) {
      sections.push(`${commentBlock('Public Subnets', 'Subnets with direct internet access via the Internet Gateway.')}

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index % length(var.availability_zones)]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "\${var.project_name}-public-subnet-\${count.index + 1}"
    Type = "Public"
  })
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}`);
    }

    // Private Subnets
    if (subnets.private_subnet_cidrs.length > 0) {
      sections.push(`${commentBlock('Private Subnets', 'Subnets without direct internet access. Use NAT Gateway for outbound traffic.')}

resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index % length(var.availability_zones)]

  tags = merge(var.tags, {
    Name = "\${var.project_name}-private-subnet-\${count.index + 1}"
    Type = "Private"
  })
}`);

      // NAT Gateway if enabled
      if (subnets.create_nat_gateway) {
        sections.push(`${commentBlock('NAT Gateway', 'Allows private subnet resources to access the internet for updates, etc.')}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "\${var.project_name}-nat-eip"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(var.tags, {
    Name = "\${var.project_name}-nat-gw"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "\${var.project_name}-private-rt"
  })
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}`);
      }
    }
  }

  return joinSections(...sections);
}

/**
 * Generate networking module variables.tf
 */
export function generateNetworkingVariables(
  vpc: VPCConfig,
  subnets: SubnetConfig | null
): string {
  const sections = [
    `variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "${vpc.cidr_block}"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`,
  ];

  if (subnets) {
    sections.push(`variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ${JSON.stringify(subnets.public_subnet_cidrs)}
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ${JSON.stringify(subnets.private_subnet_cidrs)}
}

variable "availability_zones" {
  description = "Availability zones to use for subnets"
  type        = list(string)
  default     = ${JSON.stringify(subnets.availability_zones)}
}`);
  }

  return joinSections(...sections);
}

/**
 * Generate networking module outputs.tf
 */
export function generateNetworkingOutputs(
  subnets: SubnetConfig | null
): string {
  const sections = [
    `output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}`,
  ];

  if (subnets) {
    if (subnets.public_subnet_cidrs.length > 0) {
      sections.push(`output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "public_subnet_cidrs" {
  description = "CIDR blocks of the public subnets"
  value       = aws_subnet.public[*].cidr_block
}`);
    }

    if (subnets.private_subnet_cidrs.length > 0) {
      sections.push(`output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of the private subnets"
  value       = aws_subnet.private[*].cidr_block
}`);

      if (subnets.create_nat_gateway) {
        sections.push(`output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.main.id
}

output "nat_gateway_public_ip" {
  description = "Public IP of the NAT Gateway"
  value       = aws_eip.nat.public_ip
}`);
      }
    }
  }

  return joinSections(...sections);
}
