import { create } from 'zustand';
import type {
  ProjectConfig,
  ServiceSelection,
  ServiceType,
  CloudProvider,
} from '../types';
import {
  DEFAULT_PROJECT_CONFIG,
  DEFAULT_VPC_CONFIG,
  DEFAULT_SUBNET_CONFIG,
  DEFAULT_EC2_CONFIG,
  DEFAULT_S3_CONFIG,
  DEFAULT_IAM_CONFIG,
  DEFAULT_SECURITY_GROUP_CONFIG,
  DEFAULT_RDS_CONFIG,
  DEFAULT_LAMBDA_CONFIG,
  DEFAULT_API_GATEWAY_CONFIG,
  DEFAULT_SQS_CONFIG,
  DEFAULT_SNS_CONFIG,
  DEFAULT_EVENTBRIDGE_CONFIG,
  DEFAULT_CLOUDWATCH_CONFIG,
  DEFAULT_CLOUDFRONT_CONFIG,
  DEFAULT_SES_CONFIG,
} from '../constants/defaults';
import {
  DEFAULT_AZURE_VNET_CONFIG,
  DEFAULT_AZURE_SUBNET_CONFIG,
  DEFAULT_AZURE_NSG_CONFIG,
  DEFAULT_AZURE_VM_CONFIG,
  DEFAULT_AZURE_STORAGE_CONFIG,
  DEFAULT_AZURE_IDENTITY_CONFIG,
  DEFAULT_AZURE_DATABASE_CONFIG,
  DEFAULT_AZURE_FUNCTION_CONFIG,
  DEFAULT_AZURE_APIM_CONFIG,
  DEFAULT_AZURE_SERVICEBUS_QUEUE_CONFIG,
  DEFAULT_AZURE_SERVICEBUS_TOPIC_CONFIG,
  DEFAULT_AZURE_EVENTGRID_CONFIG,
  DEFAULT_AZURE_MONITOR_CONFIG,
  DEFAULT_AZURE_CDN_CONFIG,
  DEFAULT_AZURE_COMMUNICATION_CONFIG,
} from '../constants/azure/defaults';
import { getTemplateById } from '../constants/templates';
import {
  getAllDependencies,
  getAllDependents,
  AVAILABILITY_ZONES,
} from '../constants';

// =============================================================================
// Store Interface
// =============================================================================

interface ProjectStore {
  // State
  project: ProjectConfig;
  selectedTemplate: string | null;

  // Project Actions
  updateProject: (updates: Partial<ProjectConfig>) => void;
  updateProjectName: (name: string) => void;
  updateRegion: (region: string) => void;
  updateEnvironment: (environment: string) => void;
  updateTags: (tags: Record<string, string>) => void;
  setProvider: (provider: CloudProvider) => void;

  // Service Actions
  toggleService: (service: ServiceType, enabled: boolean) => void;
  updateServiceConfig: <T extends ServiceType>(
    service: T,
    config: Partial<NonNullable<ServiceSelection[T]>>
  ) => void;

  // Template Actions
  loadTemplate: (templateId: string) => void;
  resetProject: () => void;

  // Computed Helpers
  isServiceEnabled: (service: ServiceType) => boolean;
  getEnabledServices: () => ServiceType[];
  getServiceDependents: (service: ServiceType) => ServiceType[];
}

// =============================================================================
// Default Config Getters
// =============================================================================

function getDefaultConfig(
  service: ServiceType,
  projectName: string,
  provider: CloudProvider = 'aws'
): NonNullable<ServiceSelection[ServiceType]> {
  // AWS defaults
  if (provider === 'aws') {
    switch (service) {
      case 'vpc':
        return { ...DEFAULT_VPC_CONFIG };
      case 'subnets':
        return { ...DEFAULT_SUBNET_CONFIG };
      case 'security_groups':
        return { ...DEFAULT_SECURITY_GROUP_CONFIG };
      case 'ec2':
        return { ...DEFAULT_EC2_CONFIG };
      case 'lambda':
        return { ...DEFAULT_LAMBDA_CONFIG };
      case 'rds':
        return {
          ...DEFAULT_RDS_CONFIG,
          identifier: `${projectName || 'app'}-db`,
        };
      case 's3':
        return {
          ...DEFAULT_S3_CONFIG,
          bucket_prefix: projectName || 'my-app',
        };
      case 'api_gateway':
        return {
          ...DEFAULT_API_GATEWAY_CONFIG,
          name: `${projectName || 'app'}-api`,
        };
      case 'sqs':
        return { ...DEFAULT_SQS_CONFIG };
      case 'sns':
        return { ...DEFAULT_SNS_CONFIG };
      case 'eventbridge':
        return { ...DEFAULT_EVENTBRIDGE_CONFIG };
      case 'cloudwatch':
        return { ...DEFAULT_CLOUDWATCH_CONFIG };
      case 'cloudfront':
        return {
          ...DEFAULT_CLOUDFRONT_CONFIG,
          comment: `${projectName || 'app'} CDN`,
        };
      case 'ses':
        return {
          ...DEFAULT_SES_CONFIG,
          configuration_set_name: `${projectName || 'app'}-ses-config`,
        };
      case 'iam':
        return {
          ...DEFAULT_IAM_CONFIG,
          role_name: `${projectName || 'app'}-role`,
        };
    }
  }

  // Azure defaults
  switch (service) {
    case 'vpc':
      return { ...DEFAULT_AZURE_VNET_CONFIG };
    case 'subnets':
      return { ...DEFAULT_AZURE_SUBNET_CONFIG };
    case 'security_groups':
      return { ...DEFAULT_AZURE_NSG_CONFIG };
    case 'ec2':
      return { ...DEFAULT_AZURE_VM_CONFIG };
    case 'lambda':
      return { ...DEFAULT_AZURE_FUNCTION_CONFIG };
    case 'rds':
      return {
        ...DEFAULT_AZURE_DATABASE_CONFIG,
        identifier: `${projectName || 'app'}-db`,
      };
    case 's3':
      return {
        ...DEFAULT_AZURE_STORAGE_CONFIG,
        bucket_prefix: projectName || 'my-app',
      };
    case 'api_gateway':
      return {
        ...DEFAULT_AZURE_APIM_CONFIG,
        name: `${projectName || 'app'}-api`,
      };
    case 'sqs':
      return { ...DEFAULT_AZURE_SERVICEBUS_QUEUE_CONFIG };
    case 'sns':
      return { ...DEFAULT_AZURE_SERVICEBUS_TOPIC_CONFIG };
    case 'eventbridge':
      return { ...DEFAULT_AZURE_EVENTGRID_CONFIG };
    case 'cloudwatch':
      return { ...DEFAULT_AZURE_MONITOR_CONFIG };
    case 'cloudfront':
      return {
        ...DEFAULT_AZURE_CDN_CONFIG,
        comment: `${projectName || 'app'} CDN`,
      };
    case 'ses':
      return {
        ...DEFAULT_AZURE_COMMUNICATION_CONFIG,
        configuration_set_name: `${projectName || 'app'}-comm`,
      };
    case 'iam':
      return {
        ...DEFAULT_AZURE_IDENTITY_CONFIG,
        role_name: `${projectName || 'app'}-identity`,
      };
  }
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Initial State
  project: { ...DEFAULT_PROJECT_CONFIG },
  selectedTemplate: null,

  // Project Actions
  updateProject: (updates) =>
    set((state) => ({
      project: { ...state.project, ...updates },
    })),

  updateProjectName: (name) =>
    set((state) => {
      const newProject = { ...state.project, name };
      const newServices = { ...newProject.services };
      
      // Update dependent configs that use project name
      if (newServices.s3) {
        newServices.s3 = { ...newServices.s3, bucket_prefix: name || 'my-app' };
      }
      if (newServices.iam) {
        newServices.iam = { ...newServices.iam, role_name: `${name || 'app'}-role` };
      }
      if (newServices.rds) {
        newServices.rds = { ...newServices.rds, identifier: `${name || 'app'}-db` };
      }
      if (newServices.api_gateway) {
        newServices.api_gateway = { ...newServices.api_gateway, name: `${name || 'app'}-api` };
      }
      if (newServices.cloudfront) {
        newServices.cloudfront = { ...newServices.cloudfront, comment: `${name || 'app'} CDN` };
      }
      if (newServices.ses) {
        newServices.ses = { ...newServices.ses, configuration_set_name: `${name || 'app'}-ses-config` };
      }
      
      newProject.services = newServices;
      return { project: newProject };
    }),

  updateRegion: (region) =>
    set((state) => {
      const newProject = { ...state.project, region };
      
      // Update availability zones in subnet config if region changes
      if (state.project.services.subnets) {
        const availableAZs = AVAILABILITY_ZONES[region] || [];
        const currentAZs = state.project.services.subnets.availability_zones;
        const validAZs = currentAZs.filter((az) => availableAZs.includes(az));
        
        newProject.services = {
          ...newProject.services,
          subnets: {
            ...state.project.services.subnets,
            availability_zones:
              validAZs.length > 0 ? validAZs : [availableAZs[0] || ''],
          },
        };
      }
      
      return { project: newProject };
    }),

  updateEnvironment: (environment) =>
    set((state) => ({
      project: {
        ...state.project,
        environment,
        tags: {
          ...state.project.tags,
          Environment: environment,
        },
      },
    })),

  updateTags: (tags) =>
    set((state) => ({
      project: { ...state.project, tags },
    })),

  // Provider Action
  setProvider: (provider) =>
    set((state) => {
      // Reset services when changing provider
      const emptyServices: ServiceSelection = {
        vpc: null,
        subnets: null,
        security_groups: null,
        ec2: null,
        lambda: null,
        rds: null,
        s3: null,
        api_gateway: null,
        sqs: null,
        sns: null,
        eventbridge: null,
        cloudfront: null,
        ses: null,
        cloudwatch: null,
        iam: null,
      };

      // Set default region based on provider
      const defaultRegion = provider === 'azure' ? 'eastus' : 'us-east-1';
      const resourceGroup = provider === 'azure' ? `rg-${state.project.name}` : undefined;

      return {
        project: {
          ...state.project,
          provider,
          region: defaultRegion,
          resourceGroup,
          services: emptyServices,
        },
        selectedTemplate: null,
      };
    }),

  // Service Actions
  toggleService: (service, enabled) =>
    set((state) => {
      const newServices = { ...state.project.services };
      const projectName = state.project.name;
      const provider = state.project.provider || 'aws';

      if (enabled) {
        // Enable the service with default config
        (newServices as Record<ServiceType, unknown>)[service] = getDefaultConfig(service, projectName, provider);

        // Auto-enable all dependencies
        const deps = getAllDependencies(service);
        deps.forEach((dep) => {
          if (!newServices[dep]) {
            (newServices as Record<ServiceType, unknown>)[dep] = getDefaultConfig(dep, projectName, provider);
          }
        });

        // If enabling S3 and EC2/Lambda is enabled, enable IAM s3_access
        if (service === 's3' && (newServices.ec2 || newServices.lambda) && newServices.iam) {
          newServices.iam = { ...newServices.iam, s3_access: true };
        }

        // If enabling CloudFront with S3 origin, ensure S3 is enabled
        if (service === 'cloudfront' && !newServices.s3) {
          (newServices as Record<ServiceType, unknown>).s3 = getDefaultConfig('s3', projectName, provider);
        }
      } else {
        // Disable the service
        (newServices as Record<ServiceType, unknown>)[service] = null;

        // Disable all dependents
        const dependents = getAllDependents(service);
        dependents.forEach((dep) => {
          (newServices as Record<ServiceType, unknown>)[dep] = null;
        });

        // If disabling S3, update IAM s3_access and disable CloudFront
        if (service === 's3') {
          if (newServices.iam) {
            newServices.iam = { ...newServices.iam, s3_access: false };
          }
          newServices.cloudfront = null;
        }

        // If disabling Lambda, disable API Gateway and EventBridge Lambda targets
        if (service === 'lambda') {
          newServices.api_gateway = null;
        }
      }

      return {
        project: { ...state.project, services: newServices as ServiceSelection },
        selectedTemplate: null,
      };
    }),

  updateServiceConfig: (service, config) =>
    set((state) => {
      const currentConfig = state.project.services[service];
      if (!currentConfig) return state;

      return {
        project: {
          ...state.project,
          services: {
            ...state.project.services,
            [service]: { ...currentConfig, ...config },
          },
        },
        selectedTemplate: null,
      };
    }),

  // Template Actions
  loadTemplate: (templateId) =>
    set((state) => {
      const template = getTemplateById(templateId);
      if (!template) return state;

      const projectName = state.project.name;

      // Build new services from template, applying project name to relevant configs
      const newServices: ServiceSelection = {
        vpc: template.services.vpc ? { ...template.services.vpc } : null,
        subnets: template.services.subnets ? { ...template.services.subnets } : null,
        security_groups: template.services.security_groups ? { ...template.services.security_groups } : null,
        ec2: template.services.ec2 ? { ...template.services.ec2 } : null,
        lambda: template.services.lambda ? { ...template.services.lambda } : null,
        rds: template.services.rds 
          ? { ...template.services.rds, identifier: template.services.rds.identifier || `${projectName}-db` }
          : null,
        s3: template.services.s3
          ? { ...template.services.s3, bucket_prefix: template.services.s3.bucket_prefix || projectName }
          : null,
        api_gateway: template.services.api_gateway
          ? { ...template.services.api_gateway, name: template.services.api_gateway.name || `${projectName}-api` }
          : null,
        sqs: template.services.sqs ? { ...template.services.sqs } : null,
        sns: template.services.sns ? { ...template.services.sns } : null,
        eventbridge: template.services.eventbridge ? { ...template.services.eventbridge } : null,
        cloudwatch: template.services.cloudwatch ? { ...template.services.cloudwatch } : null,
        cloudfront: template.services.cloudfront
          ? { ...template.services.cloudfront, comment: template.services.cloudfront.comment || `${projectName} CDN` }
          : null,
        ses: template.services.ses
          ? { ...template.services.ses, configuration_set_name: template.services.ses.configuration_set_name || `${projectName}-ses-config` }
          : null,
        iam: template.services.iam
          ? { ...template.services.iam, role_name: template.services.iam.role_name || `${projectName}-role` }
          : null,
      };

      return {
        project: { ...state.project, services: newServices },
        selectedTemplate: templateId,
      };
    }),

  resetProject: () =>
    set(() => ({
      project: { ...DEFAULT_PROJECT_CONFIG },
      selectedTemplate: null,
    })),

  // Computed Helpers
  isServiceEnabled: (service) => {
    return get().project.services[service] !== null;
  },

  getEnabledServices: () => {
    const services = get().project.services;
    const enabled: ServiceType[] = [];
    
    if (services.vpc) enabled.push('vpc');
    if (services.subnets) enabled.push('subnets');
    if (services.security_groups) enabled.push('security_groups');
    if (services.ec2) enabled.push('ec2');
    if (services.lambda) enabled.push('lambda');
    if (services.rds) enabled.push('rds');
    if (services.s3) enabled.push('s3');
    if (services.api_gateway) enabled.push('api_gateway');
    if (services.sqs) enabled.push('sqs');
    if (services.sns) enabled.push('sns');
    if (services.eventbridge) enabled.push('eventbridge');
    if (services.cloudwatch) enabled.push('cloudwatch');
    if (services.cloudfront) enabled.push('cloudfront');
    if (services.ses) enabled.push('ses');
    if (services.iam) enabled.push('iam');
    
    return enabled;
  },

  getServiceDependents: (service) => {
    const enabledServices = new Set(get().getEnabledServices());
    return getAllDependents(service).filter((dep) => enabledServices.has(dep));
  },
}));
