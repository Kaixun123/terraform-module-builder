import type { ProjectConfig, GeneratedFile, GeneratedProject } from '../types';

// AWS Generators
import {
  generateNetworkingMain,
  generateNetworkingVariables,
  generateNetworkingOutputs,
} from './templates/networking';
import {
  generateComputeMain,
  generateComputeVariables,
  generateComputeOutputs,
} from './templates/compute';
import {
  generateStorageMain,
  generateStorageVariables,
  generateStorageOutputs,
} from './templates/storage';
import {
  generateIAMMain,
  generateIAMVariables,
  generateIAMOutputs,
} from './templates/iam';
import {
  generateSecurityMain,
  generateSecurityVariables,
  generateSecurityOutputs,
} from './templates/security';
import {
  generateDatabaseMain,
  generateDatabaseVariables,
  generateDatabaseOutputs,
} from './templates/database';
import {
  generateServerlessMain,
  generateServerlessVariables,
  generateServerlessOutputs,
} from './templates/serverless';
import {
  generateAPIMain,
  generateAPIVariables,
  generateAPIOutputs,
} from './templates/api';
import {
  generateMessagingMain,
  generateMessagingVariables,
  generateMessagingOutputs,
} from './templates/messaging';
import {
  generateEventsMain,
  generateEventsVariables,
  generateEventsOutputs,
} from './templates/events';
import {
  generateMonitoringMain,
  generateMonitoringVariables,
  generateMonitoringOutputs,
} from './templates/monitoring';
import {
  generateCDNMain,
  generateCDNVariables,
  generateCDNOutputs,
} from './templates/cdn';
import {
  generateEmailMain,
  generateEmailVariables,
  generateEmailOutputs,
} from './templates/email';
import {
  generateRootMain,
  generateRootVariables,
  generateRootOutputs,
  generateVersions,
  generateTfvars,
  generateLocals,
} from './templates/root';

// Azure Generator
import { generateAzureTerraformProject } from './azure';

/**
 * Generate all Terraform files for a project configuration
 * Routes to appropriate generator based on cloud provider
 */
export function generateTerraformProject(project: ProjectConfig): GeneratedProject {
  // Route to Azure generator if provider is Azure
  if (project.provider === 'azure') {
    return generateAzureTerraformProject(project);
  }

  // Default: AWS generator
  return generateAWSTerraformProject(project);
}

/**
 * Generate AWS Terraform files
 */
function generateAWSTerraformProject(project: ProjectConfig): GeneratedProject {
  const rootFiles: GeneratedFile[] = [];
  const modules: GeneratedProject['modules'] = [];

  // Check which services are enabled
  const hasVPC = project.services.vpc !== null;
  const hasSubnets = project.services.subnets !== null;
  const hasSecurityGroups = project.services.security_groups !== null;
  const hasEC2 = project.services.ec2 !== null;
  const hasLambda = project.services.lambda !== null;
  const hasRDS = project.services.rds !== null;
  const hasS3 = project.services.s3 !== null;
  const hasAPIGateway = project.services.api_gateway !== null;
  const hasSQS = project.services.sqs !== null;
  const hasSNS = project.services.sns !== null;
  const hasEventBridge = project.services.eventbridge !== null;
  const hasCloudWatch = project.services.cloudwatch !== null;
  const hasCloudFront = project.services.cloudfront !== null;
  const hasSES = project.services.ses !== null;
  const hasIAM = project.services.iam !== null;

  // If no services selected, return empty project
  const hasAnyService = hasVPC || hasSubnets || hasSecurityGroups || hasEC2 || 
    hasLambda || hasRDS || hasS3 || hasAPIGateway || hasSQS || hasSNS || 
    hasEventBridge || hasCloudWatch || hasCloudFront || hasSES || hasIAM;

  if (!hasAnyService) {
    return { rootFiles: [], modules: [] };
  }

  // Generate root module files
  rootFiles.push({
    path: 'main.tf',
    content: generateRootMain(project),
  });

  rootFiles.push({
    path: 'variables.tf',
    content: generateRootVariables(project),
  });

  rootFiles.push({
    path: 'outputs.tf',
    content: generateRootOutputs(project),
  });

  rootFiles.push({
    path: 'versions.tf',
    content: generateVersions(),
  });

  rootFiles.push({
    path: 'terraform.tfvars',
    content: generateTfvars(project),
  });

  rootFiles.push({
    path: 'locals.tf',
    content: generateLocals(),
  });

  // Generate networking module (VPC + Subnets)
  if (hasVPC) {
    modules.push({
      name: 'networking',
      files: [
        {
          path: 'modules/networking/main.tf',
          content: generateNetworkingMain(
            project.services.vpc!,
            project.services.subnets
          ),
        },
        {
          path: 'modules/networking/variables.tf',
          content: generateNetworkingVariables(
            project.services.vpc!,
            project.services.subnets
          ),
        },
        {
          path: 'modules/networking/outputs.tf',
          content: generateNetworkingOutputs(project.services.subnets),
        },
      ],
    });
  }

  // Generate security module
  if (hasSecurityGroups) {
    modules.push({
      name: 'security',
      files: [
        {
          path: 'modules/security/main.tf',
          content: generateSecurityMain(project.services.security_groups!),
        },
        {
          path: 'modules/security/variables.tf',
          content: generateSecurityVariables(),
        },
        {
          path: 'modules/security/outputs.tf',
          content: generateSecurityOutputs(project.services.security_groups!),
        },
      ],
    });
  }

  // Generate IAM module
  if (hasIAM) {
    modules.push({
      name: 'iam',
      files: [
        {
          path: 'modules/iam/main.tf',
          content: generateIAMMain(project.services.iam!, hasS3),
        },
        {
          path: 'modules/iam/variables.tf',
          content: generateIAMVariables(project.services.iam!, hasS3),
        },
        {
          path: 'modules/iam/outputs.tf',
          content: generateIAMOutputs(project.services.iam!),
        },
      ],
    });
  }

  // Generate storage module
  if (hasS3) {
    modules.push({
      name: 'storage',
      files: [
        {
          path: 'modules/storage/main.tf',
          content: generateStorageMain(project.services.s3!),
        },
        {
          path: 'modules/storage/variables.tf',
          content: generateStorageVariables(project.services.s3!),
        },
        {
          path: 'modules/storage/outputs.tf',
          content: generateStorageOutputs(),
        },
      ],
    });
  }

  // Generate database module
  if (hasRDS) {
    modules.push({
      name: 'database',
      files: [
        {
          path: 'modules/database/main.tf',
          content: generateDatabaseMain(project.services.rds!),
        },
        {
          path: 'modules/database/variables.tf',
          content: generateDatabaseVariables(project.services.rds!),
        },
        {
          path: 'modules/database/outputs.tf',
          content: generateDatabaseOutputs(),
        },
      ],
    });
  }

  // Generate serverless module (Lambda)
  if (hasLambda) {
    modules.push({
      name: 'serverless',
      files: [
        {
          path: 'modules/serverless/main.tf',
          content: generateServerlessMain(project.services.lambda!, hasVPC),
        },
        {
          path: 'modules/serverless/variables.tf',
          content: generateServerlessVariables(project.services.lambda!, hasVPC),
        },
        {
          path: 'modules/serverless/outputs.tf',
          content: generateServerlessOutputs(project.services.lambda!),
        },
      ],
    });
  }

  // Generate API module
  if (hasAPIGateway) {
    modules.push({
      name: 'api',
      files: [
        {
          path: 'modules/api/main.tf',
          content: generateAPIMain(project.services.api_gateway!),
        },
        {
          path: 'modules/api/variables.tf',
          content: generateAPIVariables(project.services.api_gateway!),
        },
        {
          path: 'modules/api/outputs.tf',
          content: generateAPIOutputs(),
        },
      ],
    });
  }

  // Generate messaging module (SQS + SNS)
  if (hasSQS || hasSNS) {
    modules.push({
      name: 'messaging',
      files: [
        {
          path: 'modules/messaging/main.tf',
          content: generateMessagingMain(project.services.sqs, project.services.sns),
        },
        {
          path: 'modules/messaging/variables.tf',
          content: generateMessagingVariables(project.services.sqs, project.services.sns),
        },
        {
          path: 'modules/messaging/outputs.tf',
          content: generateMessagingOutputs(project.services.sqs, project.services.sns),
        },
      ],
    });
  }

  // Generate events module
  if (hasEventBridge) {
    modules.push({
      name: 'events',
      files: [
        {
          path: 'modules/events/main.tf',
          content: generateEventsMain(project.services.eventbridge!),
        },
        {
          path: 'modules/events/variables.tf',
          content: generateEventsVariables(project.services.eventbridge!),
        },
        {
          path: 'modules/events/outputs.tf',
          content: generateEventsOutputs(project.services.eventbridge!),
        },
      ],
    });
  }

  // Generate monitoring module
  if (hasCloudWatch) {
    modules.push({
      name: 'monitoring',
      files: [
        {
          path: 'modules/monitoring/main.tf',
          content: generateMonitoringMain(project.services.cloudwatch!),
        },
        {
          path: 'modules/monitoring/variables.tf',
          content: generateMonitoringVariables(project.services.cloudwatch!),
        },
        {
          path: 'modules/monitoring/outputs.tf',
          content: generateMonitoringOutputs(project.services.cloudwatch!),
        },
      ],
    });
  }

  // Generate CDN module
  if (hasCloudFront) {
    modules.push({
      name: 'cdn',
      files: [
        {
          path: 'modules/cdn/main.tf',
          content: generateCDNMain(project.services.cloudfront!),
        },
        {
          path: 'modules/cdn/variables.tf',
          content: generateCDNVariables(project.services.cloudfront!),
        },
        {
          path: 'modules/cdn/outputs.tf',
          content: generateCDNOutputs(),
        },
      ],
    });
  }

  // Generate email module
  if (hasSES) {
    modules.push({
      name: 'email',
      files: [
        {
          path: 'modules/email/main.tf',
          content: generateEmailMain(project.services.ses!),
        },
        {
          path: 'modules/email/variables.tf',
          content: generateEmailVariables(project.services.ses!),
        },
        {
          path: 'modules/email/outputs.tf',
          content: generateEmailOutputs(project.services.ses!),
        },
      ],
    });
  }

  // Generate compute module (EC2)
  if (hasEC2) {
    modules.push({
      name: 'compute',
      files: [
        {
          path: 'modules/compute/main.tf',
          content: generateComputeMain(project.services.ec2!, hasIAM),
        },
        {
          path: 'modules/compute/variables.tf',
          content: generateComputeVariables(project.services.ec2!, hasIAM),
        },
        {
          path: 'modules/compute/outputs.tf',
          content: generateComputeOutputs(),
        },
      ],
    });
  }

  return { rootFiles, modules };
}

/**
 * Get all files as a flat array with full paths
 */
export function getAllFiles(project: GeneratedProject): GeneratedFile[] {
  const files: GeneratedFile[] = [...project.rootFiles];

  for (const module of project.modules) {
    files.push(...module.files);
  }

  return files;
}

/**
 * Get file tree structure for display
 */
export function getFileTree(project: GeneratedProject): string[] {
  const files: string[] = [];

  // Root files first
  for (const file of project.rootFiles) {
    files.push(file.path);
  }

  // Module files
  for (const module of project.modules) {
    for (const file of module.files) {
      files.push(file.path);
    }
  }

  return files.sort();
}

/**
 * Get file content by path
 */
export function getFileByPath(
  project: GeneratedProject,
  path: string
): GeneratedFile | undefined {
  const allFiles = getAllFiles(project);
  return allFiles.find((f) => f.path === path);
}
