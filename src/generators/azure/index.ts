import type { ProjectConfig, GeneratedProject, GeneratedModule } from '../../types';

import {
  generateAzureNetworkingMain,
  generateAzureNetworkingVariables,
  generateAzureNetworkingOutputs,
} from './networking';

import {
  generateAzureComputeMain,
  generateAzureComputeVariables,
  generateAzureComputeOutputs,
} from './compute';

import {
  generateAzureServerlessMain,
  generateAzureServerlessVariables,
  generateAzureServerlessOutputs,
} from './serverless';

import {
  generateAzureDatabaseMain,
  generateAzureDatabaseVariables,
  generateAzureDatabaseOutputs,
} from './database';

import {
  generateAzureStorageMain,
  generateAzureStorageVariables,
  generateAzureStorageOutputs,
} from './storage';

import {
  generateAzureAPIMain,
  generateAzureAPIVariables,
  generateAzureAPIOutputs,
} from './api';

import {
  generateAzureMessagingMain,
  generateAzureMessagingVariables,
  generateAzureMessagingOutputs,
} from './messaging';

import {
  generateAzureEventsMain,
  generateAzureEventsVariables,
  generateAzureEventsOutputs,
} from './events';

import {
  generateAzureMonitoringMain,
  generateAzureMonitoringVariables,
  generateAzureMonitoringOutputs,
} from './monitoring';

import {
  generateAzureCDNMain,
  generateAzureCDNVariables,
  generateAzureCDNOutputs,
} from './cdn';

import {
  generateAzureEmailMain,
  generateAzureEmailVariables,
  generateAzureEmailOutputs,
} from './email';

import {
  generateAzureIdentityMain,
  generateAzureIdentityVariables,
  generateAzureIdentityOutputs,
} from './identity';

import {
  generateAzureRootMain,
  generateAzureRootVariables,
  generateAzureRootOutputs,
} from './root';

// =============================================================================
// Azure Project Generator
// =============================================================================

export function generateAzureTerraformProject(project: ProjectConfig): GeneratedProject {
  const s = project.services;
  const modules: GeneratedModule[] = [];

  // Generate module files based on enabled services

  // Networking (VNet, Subnets, NSG)
  if (s.vpc || s.subnets || s.security_groups) {
    modules.push({
      name: 'networking',
      files: [
        {
          path: 'modules/networking/main.tf',
          content: generateAzureNetworkingMain(s.vpc, s.subnets, s.security_groups),
        },
        {
          path: 'modules/networking/variables.tf',
          content: generateAzureNetworkingVariables(s.vpc, s.subnets, s.security_groups),
        },
        {
          path: 'modules/networking/outputs.tf',
          content: generateAzureNetworkingOutputs(s.vpc, s.subnets, s.security_groups),
        },
      ],
    });
  }

  // Compute (Virtual Machines)
  if (s.ec2) {
    modules.push({
      name: 'compute',
      files: [
        {
          path: 'modules/compute/main.tf',
          content: generateAzureComputeMain(s.ec2),
        },
        {
          path: 'modules/compute/variables.tf',
          content: generateAzureComputeVariables(s.ec2),
        },
        {
          path: 'modules/compute/outputs.tf',
          content: generateAzureComputeOutputs(s.ec2),
        },
      ],
    });
  }

  // Serverless (Azure Functions)
  if (s.lambda) {
    modules.push({
      name: 'serverless',
      files: [
        {
          path: 'modules/serverless/main.tf',
          content: generateAzureServerlessMain(s.lambda),
        },
        {
          path: 'modules/serverless/variables.tf',
          content: generateAzureServerlessVariables(s.lambda),
        },
        {
          path: 'modules/serverless/outputs.tf',
          content: generateAzureServerlessOutputs(s.lambda),
        },
      ],
    });
  }

  // Database
  if (s.rds) {
    modules.push({
      name: 'database',
      files: [
        {
          path: 'modules/database/main.tf',
          content: generateAzureDatabaseMain(s.rds),
        },
        {
          path: 'modules/database/variables.tf',
          content: generateAzureDatabaseVariables(s.rds),
        },
        {
          path: 'modules/database/outputs.tf',
          content: generateAzureDatabaseOutputs(s.rds),
        },
      ],
    });
  }

  // Storage
  if (s.s3) {
    modules.push({
      name: 'storage',
      files: [
        {
          path: 'modules/storage/main.tf',
          content: generateAzureStorageMain(s.s3),
        },
        {
          path: 'modules/storage/variables.tf',
          content: generateAzureStorageVariables(s.s3),
        },
        {
          path: 'modules/storage/outputs.tf',
          content: generateAzureStorageOutputs(),
        },
      ],
    });
  }

  // API Management
  if (s.api_gateway) {
    modules.push({
      name: 'api',
      files: [
        {
          path: 'modules/api/main.tf',
          content: generateAzureAPIMain(s.api_gateway),
        },
        {
          path: 'modules/api/variables.tf',
          content: generateAzureAPIVariables(s.api_gateway),
        },
        {
          path: 'modules/api/outputs.tf',
          content: generateAzureAPIOutputs(),
        },
      ],
    });
  }

  // Messaging (Service Bus)
  if (s.sqs || s.sns) {
    modules.push({
      name: 'messaging',
      files: [
        {
          path: 'modules/messaging/main.tf',
          content: generateAzureMessagingMain(s.sqs, s.sns),
        },
        {
          path: 'modules/messaging/variables.tf',
          content: generateAzureMessagingVariables(),
        },
        {
          path: 'modules/messaging/outputs.tf',
          content: generateAzureMessagingOutputs(s.sqs, s.sns),
        },
      ],
    });
  }

  // Events (Event Grid)
  if (s.eventbridge) {
    modules.push({
      name: 'events',
      files: [
        {
          path: 'modules/events/main.tf',
          content: generateAzureEventsMain(s.eventbridge),
        },
        {
          path: 'modules/events/variables.tf',
          content: generateAzureEventsVariables(),
        },
        {
          path: 'modules/events/outputs.tf',
          content: generateAzureEventsOutputs(s.eventbridge),
        },
      ],
    });
  }

  // Monitoring (Azure Monitor)
  if (s.cloudwatch) {
    modules.push({
      name: 'monitoring',
      files: [
        {
          path: 'modules/monitoring/main.tf',
          content: generateAzureMonitoringMain(s.cloudwatch),
        },
        {
          path: 'modules/monitoring/variables.tf',
          content: generateAzureMonitoringVariables(s.cloudwatch),
        },
        {
          path: 'modules/monitoring/outputs.tf',
          content: generateAzureMonitoringOutputs(),
        },
      ],
    });
  }

  // CDN
  if (s.cloudfront) {
    modules.push({
      name: 'cdn',
      files: [
        {
          path: 'modules/cdn/main.tf',
          content: generateAzureCDNMain(s.cloudfront),
        },
        {
          path: 'modules/cdn/variables.tf',
          content: generateAzureCDNVariables(s.cloudfront),
        },
        {
          path: 'modules/cdn/outputs.tf',
          content: generateAzureCDNOutputs(),
        },
      ],
    });
  }

  // Email (Communication Services)
  if (s.ses) {
    modules.push({
      name: 'email',
      files: [
        {
          path: 'modules/email/main.tf',
          content: generateAzureEmailMain(s.ses),
        },
        {
          path: 'modules/email/variables.tf',
          content: generateAzureEmailVariables(s.ses),
        },
        {
          path: 'modules/email/outputs.tf',
          content: generateAzureEmailOutputs(),
        },
      ],
    });
  }

  // Identity (Managed Identity)
  if (s.iam) {
    modules.push({
      name: 'identity',
      files: [
        {
          path: 'modules/identity/main.tf',
          content: generateAzureIdentityMain(s.iam),
        },
        {
          path: 'modules/identity/variables.tf',
          content: generateAzureIdentityVariables(s.iam),
        },
        {
          path: 'modules/identity/outputs.tf',
          content: generateAzureIdentityOutputs(),
        },
      ],
    });
  }

  // Root module files
  const rootFiles = [
    {
      path: 'main.tf',
      content: generateAzureRootMain(project),
    },
    {
      path: 'variables.tf',
      content: generateAzureRootVariables(project),
    },
    {
      path: 'outputs.tf',
      content: generateAzureRootOutputs(project),
    },
    {
      path: 'README.md',
      content: generateAzureReadme(project),
    },
    {
      path: '.gitignore',
      content: generateTerraformGitignore(),
    },
  ];

  return { rootFiles, modules };
}

// =============================================================================
// Helper Functions
// =============================================================================

function generateAzureReadme(project: ProjectConfig): string {
  const enabledServices = Object.entries(project.services)
    .filter(([_, config]) => config !== null)
    .map(([key]) => key);

  const serviceNames: Record<string, string> = {
    vpc: 'Virtual Network',
    subnets: 'Subnets',
    security_groups: 'Network Security Groups',
    ec2: 'Virtual Machines',
    lambda: 'Azure Functions',
    rds: 'Azure Database',
    s3: 'Storage Account',
    api_gateway: 'API Management',
    sqs: 'Service Bus Queue',
    sns: 'Service Bus Topic',
    eventbridge: 'Event Grid',
    cloudwatch: 'Azure Monitor',
    cloudfront: 'Azure CDN',
    ses: 'Communication Services',
    iam: 'Managed Identity',
  };

  return `# ${project.name} - Azure Infrastructure

This Terraform configuration was generated by **Terraform Builder**.

## Overview

| Property | Value |
|----------|-------|
| Cloud Provider | Microsoft Azure |
| Region | ${project.region} |
| Environment | ${project.environment} |
| Resource Group | ${project.resourceGroup || `rg-${project.name}`} |

## Enabled Services

${enabledServices.map(s => `- ${serviceNames[s] || s}`).join('\n')}

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads) >= 1.0
2. [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed and authenticated
3. Azure subscription with appropriate permissions

## Quick Start

\`\`\`bash
# Login to Azure
az login

# Set subscription (if you have multiple)
az account set --subscription "Your-Subscription-Name"

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply
\`\`\`

## Variables

Review and customize \`variables.tf\` before applying:

${project.services.ec2 ? `- \`ssh_public_key\`: SSH public key for VM access` : ''}
${project.services.api_gateway ? `- \`api_publisher_email\`: Email for API Management` : ''}

## Module Structure

\`\`\`
.
├── main.tf              # Root module with resource group and module calls
├── variables.tf         # Input variables
├── outputs.tf           # Output values
└── modules/
${enabledServices.map(s => `    ├── ${s === 'vpc' ? 'networking' : s === 'ec2' ? 'compute' : s === 'lambda' ? 'serverless' : s === 's3' ? 'storage' : s === 'rds' ? 'database' : s === 'api_gateway' ? 'api' : s === 'sqs' || s === 'sns' ? 'messaging' : s === 'eventbridge' ? 'events' : s === 'cloudwatch' ? 'monitoring' : s === 'cloudfront' ? 'cdn' : s === 'ses' ? 'email' : s}/`).filter((v, i, a) => a.indexOf(v) === i).join('\n')}
\`\`\`

## Cleanup

\`\`\`bash
terraform destroy
\`\`\`

## Tags

All resources are tagged with:
${Object.entries(project.tags).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`;
}

function generateTerraformGitignore(): string {
  return `# Terraform
.terraform/
*.tfstate
*.tfstate.*
*.tfplan
.terraform.lock.hcl

# Credentials
*.tfvars
!example.tfvars

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;
}

// Re-export individual generators for direct access if needed
export * from './networking';
export * from './compute';
export * from './serverless';
export * from './database';
export * from './storage';
export * from './api';
export * from './messaging';
export * from './events';
export * from './monitoring';
export * from './cdn';
export * from './email';
export * from './identity';
export * from './root';
