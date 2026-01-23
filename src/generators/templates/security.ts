import type { SecurityGroupConfig } from '../../types';
import { commentBlock, joinSections } from '../utils';

/**
 * Generate security module main.tf
 */
export function generateSecurityMain(config: SecurityGroupConfig): string {
  const sections: string[] = [];

  config.groups.forEach((group) => {
    const resourceName = group.name.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    
    sections.push(`${commentBlock(`Security Group: ${group.name}`, group.description)}

resource "aws_security_group" "${resourceName}" {
  name        = "\${var.project_name}-${group.name}-sg"
  description = "${group.description}"
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "\${var.project_name}-${group.name}-sg"
  })
}`);

    // Ingress rules
    group.ingress_rules.forEach((rule, ruleIndex) => {
      const ruleResourceName = `${resourceName}_ingress_${ruleIndex}`;
      const cidrBlock = rule.cidr_blocks ? `\n  cidr_ipv4         = "${rule.cidr_blocks[0]}"` : '';
      const sgRef = rule.source_security_group 
        ? `\n  referenced_security_group_id = aws_security_group.${rule.source_security_group.replace(/[^a-z0-9_]/gi, '_').toLowerCase()}.id`
        : '';

      sections.push(`resource "aws_vpc_security_group_ingress_rule" "${ruleResourceName}" {
  security_group_id = aws_security_group.${resourceName}.id
  description       = "${rule.description}"
  from_port         = ${rule.from_port}
  to_port           = ${rule.to_port}
  ip_protocol       = "${rule.protocol}"${cidrBlock}${sgRef}
}`);
    });

    // Egress rules
    group.egress_rules.forEach((rule, ruleIndex) => {
      const ruleResourceName = `${resourceName}_egress_${ruleIndex}`;
      const cidrBlock = rule.cidr_blocks ? `\n  cidr_ipv4         = "${rule.cidr_blocks[0]}"` : '';
      const sgRef = rule.source_security_group 
        ? `\n  referenced_security_group_id = aws_security_group.${rule.source_security_group.replace(/[^a-z0-9_]/gi, '_').toLowerCase()}.id`
        : '';

      sections.push(`resource "aws_vpc_security_group_egress_rule" "${ruleResourceName}" {
  security_group_id = aws_security_group.${resourceName}.id
  description       = "${rule.description}"
  from_port         = ${rule.from_port}
  to_port           = ${rule.to_port}
  ip_protocol       = "${rule.protocol}"${cidrBlock}${sgRef}
}`);
    });
  });

  return joinSections(...sections);
}

/**
 * Generate security module variables.tf
 */
export function generateSecurityVariables(): string {
  return `variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}`;
}

/**
 * Generate security module outputs.tf
 */
export function generateSecurityOutputs(config: SecurityGroupConfig): string {
  const outputs: string[] = [];

  config.groups.forEach((group) => {
    const resourceName = group.name.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    
    outputs.push(`output "${resourceName}_security_group_id" {
  description = "ID of the ${group.name} security group"
  value       = aws_security_group.${resourceName}.id
}`);
  });

  // Also output a map of all security groups
  const sgMap = config.groups
    .map((g) => {
      const name = g.name.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
      return `    ${g.name} = aws_security_group.${name}.id`;
    })
    .join('\n');

  outputs.push(`output "security_group_ids" {
  description = "Map of security group names to IDs"
  value = {
${sgMap}
  }
}`);

  return joinSections(...outputs);
}
