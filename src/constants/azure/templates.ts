import type { Template } from '../../types';
import {
  DEFAULT_AZURE_VNET_CONFIG,
  DEFAULT_AZURE_SUBNET_CONFIG,
  DEFAULT_AZURE_NSG_CONFIG,
  DEFAULT_AZURE_VM_CONFIG,
  DEFAULT_AZURE_STORAGE_CONFIG,
  DEFAULT_AZURE_DATABASE_CONFIG,
  DEFAULT_AZURE_APIM_CONFIG,
  DEFAULT_AZURE_SERVICEBUS_QUEUE_CONFIG,
  DEFAULT_AZURE_CDN_CONFIG,
  DEFAULT_AZURE_MONITOR_CONFIG,
  DEFAULT_AZURE_COMMUNICATION_CONFIG,
  DEFAULT_AZURE_IDENTITY_CONFIG,
} from './defaults';

// =============================================================================
// Azure Infrastructure Templates
// =============================================================================

export const AZURE_TEMPLATES: Template[] = [
  // 1. Blank Project
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Empty Azure project - start from scratch',
    provider: 'azure',
    services: {},
  },

  // 2. Simple Web
  {
    id: 'simple-web',
    name: 'Simple Web Server',
    description: 'VNet + VM with NSG for web hosting',
    provider: 'azure',
    services: {
      vpc: { ...DEFAULT_AZURE_VNET_CONFIG },
      subnets: { ...DEFAULT_AZURE_SUBNET_CONFIG },
      security_groups: { ...DEFAULT_AZURE_NSG_CONFIG },
      ec2: {
        ...DEFAULT_AZURE_VM_CONFIG,
        instance_type: 'Standard_B2s',
      },
    },
  },

  // 3. Web with Storage
  {
    id: 'web-with-storage',
    name: 'Web Server with Storage',
    description: 'VM with Storage Account for file storage',
    provider: 'azure',
    services: {
      vpc: { ...DEFAULT_AZURE_VNET_CONFIG },
      subnets: { ...DEFAULT_AZURE_SUBNET_CONFIG },
      security_groups: { ...DEFAULT_AZURE_NSG_CONFIG },
      ec2: { ...DEFAULT_AZURE_VM_CONFIG },
      s3: { ...DEFAULT_AZURE_STORAGE_CONFIG },
      iam: { ...DEFAULT_AZURE_IDENTITY_CONFIG },
    },
  },

  // 4. Multi-Tier
  {
    id: 'multi-tier',
    name: 'Multi-Tier Application',
    description: 'VNet, VMs, Database, and Storage',
    provider: 'azure',
    services: {
      vpc: { ...DEFAULT_AZURE_VNET_CONFIG },
      subnets: {
        ...DEFAULT_AZURE_SUBNET_CONFIG,
        public_subnet_cidrs: ['10.0.1.0/24'],
        private_subnet_cidrs: ['10.0.10.0/24', '10.0.11.0/24'],
      },
      security_groups: {
        groups: [
          {
            name: 'web',
            description: 'Web tier security group',
            ingress_rules: [
              { description: 'HTTP', from_port: 80, to_port: 80, protocol: 'tcp', cidr_blocks: ['0.0.0.0/0'] },
              { description: 'HTTPS', from_port: 443, to_port: 443, protocol: 'tcp', cidr_blocks: ['0.0.0.0/0'] },
            ],
            egress_rules: [
              { description: 'All outbound', from_port: 0, to_port: 0, protocol: '-1', cidr_blocks: ['0.0.0.0/0'] },
            ],
          },
          {
            name: 'db',
            description: 'Database tier security group',
            ingress_rules: [
              { description: 'PostgreSQL', from_port: 5432, to_port: 5432, protocol: 'tcp', source_security_group: 'web' },
            ],
            egress_rules: [],
          },
        ],
      },
      ec2: { ...DEFAULT_AZURE_VM_CONFIG },
      rds: { ...DEFAULT_AZURE_DATABASE_CONFIG },
      s3: { ...DEFAULT_AZURE_STORAGE_CONFIG },
      iam: { ...DEFAULT_AZURE_IDENTITY_CONFIG },
    },
  },

  // 5. Serverless API
  {
    id: 'serverless-api',
    name: 'Serverless REST API',
    description: 'API Management + Azure Functions',
    provider: 'azure',
    services: {
      lambda: {
        functions: [
          {
            name: 'api-handler',
            description: 'API request handler',
            runtime: 'nodejs20.x',
            handler: 'index.handler',
            memory_size: 256,
            timeout: 30,
            architecture: 'x86_64',
            environment_variables: {},
            create_function_url: false,
            vpc_enabled: false,
            vpc_subnet_type: 'private',
            layers: [],
            reserved_concurrency: null,
          },
        ],
      },
      api_gateway: {
        ...DEFAULT_AZURE_APIM_CONFIG,
        routes: [
          { path: '/api/health', method: 'GET', lambda_function: 'api-handler' },
          { path: '/api/items', method: 'GET', lambda_function: 'api-handler' },
          { path: '/api/items', method: 'POST', lambda_function: 'api-handler' },
        ],
      },
      cloudwatch: { ...DEFAULT_AZURE_MONITOR_CONFIG },
      iam: { ...DEFAULT_AZURE_IDENTITY_CONFIG },
    },
  },

  // 6. Event-Driven
  {
    id: 'event-driven',
    name: 'Event-Driven Architecture',
    description: 'Event Grid + Functions + Service Bus',
    provider: 'azure',
    services: {
      lambda: {
        functions: [
          {
            name: 'event-processor',
            description: 'Event processing function',
            runtime: 'nodejs20.x',
            handler: 'index.handler',
            memory_size: 512,
            timeout: 60,
            architecture: 'x86_64',
            environment_variables: {},
            create_function_url: false,
            vpc_enabled: false,
            vpc_subnet_type: 'private',
            layers: [],
            reserved_concurrency: null,
          },
        ],
      },
      sqs: {
        queues: [
          {
            name: 'events',
            fifo: false,
            content_based_deduplication: false,
            visibility_timeout_seconds: 60,
            message_retention_seconds: 1209600,
            max_message_size: 262144,
            delay_seconds: 0,
            receive_wait_time_seconds: 0,
            enable_dlq: true,
            dlq_max_receive_count: 3,
          },
        ],
      },
      eventbridge: {
        use_default_bus: false,
        custom_bus_name: 'events',
        rules: [],
      },
      cloudwatch: { ...DEFAULT_AZURE_MONITOR_CONFIG },
      iam: { ...DEFAULT_AZURE_IDENTITY_CONFIG },
    },
  },

  // 7. Static Website with CDN
  {
    id: 'static-website-cdn',
    name: 'Static Website with CDN',
    description: 'Blob Storage + Azure CDN for static hosting',
    provider: 'azure',
    services: {
      s3: {
        ...DEFAULT_AZURE_STORAGE_CONFIG,
        versioning_enabled: false,
      },
      cloudfront: {
        ...DEFAULT_AZURE_CDN_CONFIG,
        origin_type: 's3',
      },
    },
  },

  // 8. Full-Stack Serverless
  {
    id: 'full-stack-serverless',
    name: 'Full-Stack Serverless',
    description: 'VNet, Database, Functions, API Management, Storage, CDN',
    provider: 'azure',
    services: {
      vpc: { ...DEFAULT_AZURE_VNET_CONFIG },
      subnets: { ...DEFAULT_AZURE_SUBNET_CONFIG },
      security_groups: { ...DEFAULT_AZURE_NSG_CONFIG },
      rds: {
        ...DEFAULT_AZURE_DATABASE_CONFIG,
        publicly_accessible: false,
      },
      lambda: {
        functions: [
          {
            name: 'api',
            description: 'API handler',
            runtime: 'nodejs20.x',
            handler: 'index.handler',
            memory_size: 512,
            timeout: 30,
            architecture: 'x86_64',
            environment_variables: {},
            create_function_url: false,
            vpc_enabled: true,
            vpc_subnet_type: 'private',
            layers: [],
            reserved_concurrency: null,
          },
        ],
      },
      api_gateway: { ...DEFAULT_AZURE_APIM_CONFIG },
      s3: { ...DEFAULT_AZURE_STORAGE_CONFIG },
      cloudfront: { ...DEFAULT_AZURE_CDN_CONFIG },
      cloudwatch: { ...DEFAULT_AZURE_MONITOR_CONFIG },
      iam: { ...DEFAULT_AZURE_IDENTITY_CONFIG },
    },
  },

  // 9. Scheduled Jobs
  {
    id: 'scheduled-jobs',
    name: 'Scheduled Jobs',
    description: 'Azure Functions with Timer triggers',
    provider: 'azure',
    services: {
      lambda: {
        functions: [
          {
            name: 'daily-job',
            description: 'Runs daily at midnight',
            runtime: 'python3.12',
            handler: 'main.handler',
            memory_size: 256,
            timeout: 300,
            architecture: 'x86_64',
            environment_variables: {},
            create_function_url: false,
            vpc_enabled: false,
            vpc_subnet_type: 'private',
            layers: [],
            reserved_concurrency: 1,
          },
          {
            name: 'hourly-job',
            description: 'Runs every hour',
            runtime: 'python3.12',
            handler: 'main.handler',
            memory_size: 256,
            timeout: 60,
            architecture: 'x86_64',
            environment_variables: {},
            create_function_url: false,
            vpc_enabled: false,
            vpc_subnet_type: 'private',
            layers: [],
            reserved_concurrency: 1,
          },
        ],
      },
      cloudwatch: { ...DEFAULT_AZURE_MONITOR_CONFIG },
      iam: { ...DEFAULT_AZURE_IDENTITY_CONFIG },
    },
  },

  // 10. Notification System
  {
    id: 'notification-system',
    name: 'Notification System',
    description: 'Service Bus + Functions + Communication Services',
    provider: 'azure',
    services: {
      lambda: {
        functions: [
          {
            name: 'notification-handler',
            description: 'Processes and sends notifications',
            runtime: 'nodejs20.x',
            handler: 'index.handler',
            memory_size: 256,
            timeout: 30,
            architecture: 'x86_64',
            environment_variables: {},
            create_function_url: false,
            vpc_enabled: false,
            vpc_subnet_type: 'private',
            layers: [],
            reserved_concurrency: null,
          },
        ],
      },
      sns: {
        topics: [
          {
            name: 'notifications',
            display_name: 'Notifications',
            fifo: false,
            content_based_deduplication: false,
            subscriptions: [
              {
                protocol: 'lambda',
                endpoint: 'notification-handler',
              },
            ],
          },
        ],
      },
      sqs: { ...DEFAULT_AZURE_SERVICEBUS_QUEUE_CONFIG },
      ses: { ...DEFAULT_AZURE_COMMUNICATION_CONFIG },
      cloudwatch: { ...DEFAULT_AZURE_MONITOR_CONFIG },
      iam: { ...DEFAULT_AZURE_IDENTITY_CONFIG },
    },
  },
];
