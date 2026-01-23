import type { Template } from '../types';
import {
  DEFAULT_VPC_CONFIG,
  DEFAULT_SUBNET_CONFIG,
  DEFAULT_EC2_CONFIG,
  DEFAULT_S3_CONFIG,
  DEFAULT_IAM_CONFIG,
  DEFAULT_SECURITY_GROUP_CONFIG,
  DEFAULT_RDS_CONFIG,
  DEFAULT_API_GATEWAY_CONFIG,
  DEFAULT_CLOUDFRONT_CONFIG,
} from './defaults';

// =============================================================================
// Pre-built Infrastructure Templates
// =============================================================================

export const TEMPLATES: Template[] = [
  // ==========================================================================
  // Blank Template
  // ==========================================================================
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch - select services manually',
    services: {},
  },

  // ==========================================================================
  // Original Templates (v1.0)
  // ==========================================================================
  {
    id: 'simple-web',
    name: 'Simple Web Server',
    description: 'VPC + public subnet + EC2 with security group',
    services: {
      vpc: { ...DEFAULT_VPC_CONFIG },
      subnets: {
        ...DEFAULT_SUBNET_CONFIG,
        private_subnet_cidrs: [],
        create_nat_gateway: false,
      },
      security_groups: { ...DEFAULT_SECURITY_GROUP_CONFIG },
      ec2: { ...DEFAULT_EC2_CONFIG },
      iam: {
        ...DEFAULT_IAM_CONFIG,
        s3_access: false,
      },
    },
  },
  {
    id: 'web-with-storage',
    name: 'Web App with Storage',
    description: 'Web server + S3 bucket with EC2 access permissions',
    services: {
      vpc: { ...DEFAULT_VPC_CONFIG },
      subnets: {
        ...DEFAULT_SUBNET_CONFIG,
        private_subnet_cidrs: [],
        create_nat_gateway: false,
      },
      security_groups: { ...DEFAULT_SECURITY_GROUP_CONFIG },
      ec2: { ...DEFAULT_EC2_CONFIG },
      s3: { ...DEFAULT_S3_CONFIG },
      iam: {
        ...DEFAULT_IAM_CONFIG,
        s3_access: true,
      },
    },
  },
  {
    id: 'multi-tier',
    name: 'Multi-Tier Architecture',
    description: 'VPC with public/private subnets, NAT Gateway, EC2, S3',
    services: {
      vpc: { ...DEFAULT_VPC_CONFIG },
      subnets: {
        ...DEFAULT_SUBNET_CONFIG,
        public_subnet_cidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        private_subnet_cidrs: ['10.0.10.0/24', '10.0.11.0/24'],
        availability_zones: ['us-east-1a', 'us-east-1b'],
        create_nat_gateway: true,
      },
      security_groups: { ...DEFAULT_SECURITY_GROUP_CONFIG },
      ec2: { ...DEFAULT_EC2_CONFIG },
      s3: { ...DEFAULT_S3_CONFIG },
      iam: {
        ...DEFAULT_IAM_CONFIG,
        s3_access: true,
      },
    },
  },

  // ==========================================================================
  // New Templates (v1.1)
  // ==========================================================================
  {
    id: 'serverless-api',
    name: 'Serverless REST API',
    description: 'API Gateway + Lambda - fully serverless backend',
    services: {
      iam: { ...DEFAULT_IAM_CONFIG, s3_access: false },
      lambda: {
        functions: [
          {
            name: 'api-handler',
            description: 'Main API handler',
            runtime: 'nodejs20.x',
            handler: 'index.handler',
            memory_size: 256,
            timeout: 30,
            architecture: 'arm64',
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
        ...DEFAULT_API_GATEWAY_CONFIG,
        routes: [
          { path: '/health', method: 'GET', lambda_function: 'api-handler' },
          { path: '/items', method: 'GET', lambda_function: 'api-handler' },
          { path: '/items', method: 'POST', lambda_function: 'api-handler' },
          { path: '/items/{id}', method: 'GET', lambda_function: 'api-handler' },
          { path: '/items/{id}', method: 'PUT', lambda_function: 'api-handler' },
          { path: '/items/{id}', method: 'DELETE', lambda_function: 'api-handler' },
        ],
      },
      cloudwatch: {
        log_groups: [{ name: '/aws/lambda/api-handler', retention_days: 30 }],
        alarms: [],
        dashboard_enabled: false,
      },
    },
  },
  {
    id: 'event-driven',
    name: 'Event-Driven Architecture',
    description: 'EventBridge + Lambda + SQS + SNS - decoupled microservices',
    services: {
      iam: { ...DEFAULT_IAM_CONFIG, s3_access: false },
      lambda: {
        functions: [
          {
            name: 'event-processor',
            description: 'Processes incoming events',
            runtime: 'python3.12',
            handler: 'handler.process',
            memory_size: 256,
            timeout: 60,
            architecture: 'arm64',
            environment_variables: {},
            create_function_url: false,
            vpc_enabled: false,
            vpc_subnet_type: 'private',
            layers: [],
            reserved_concurrency: null,
          },
          {
            name: 'notification-sender',
            description: 'Sends notifications',
            runtime: 'python3.12',
            handler: 'handler.notify',
            memory_size: 128,
            timeout: 30,
            architecture: 'arm64',
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
            name: 'events-queue',
            fifo: false,
            content_based_deduplication: false,
            visibility_timeout_seconds: 60,
            message_retention_seconds: 345600,
            max_message_size: 262144,
            delay_seconds: 0,
            receive_wait_time_seconds: 20,
            enable_dlq: true,
            dlq_max_receive_count: 3,
          },
        ],
      },
      sns: {
        topics: [
          {
            name: 'notifications',
            display_name: 'App Notifications',
            fifo: false,
            content_based_deduplication: false,
            subscriptions: [],
          },
        ],
      },
      eventbridge: {
        use_default_bus: true,
        rules: [
          {
            name: 'process-events',
            description: 'Route events to processor',
            event_pattern: {
              source: ['app.events'],
              detail_type: ['OrderCreated', 'OrderUpdated'],
            },
            targets: [{ type: 'lambda', name: 'event-processor' }],
          },
        ],
      },
      cloudwatch: {
        log_groups: [
          { name: '/aws/lambda/event-processor', retention_days: 14 },
          { name: '/aws/lambda/notification-sender', retention_days: 14 },
        ],
        alarms: [],
        dashboard_enabled: false,
      },
    },
  },
  {
    id: 'static-website-cdn',
    name: 'Static Website with CDN',
    description: 'S3 + CloudFront - global static site hosting',
    services: {
      iam: { ...DEFAULT_IAM_CONFIG, s3_access: false },
      s3: {
        bucket_prefix: 'website',
        versioning_enabled: false,
        encryption_enabled: true,
      },
      cloudfront: {
        ...DEFAULT_CLOUDFRONT_CONFIG,
        comment: 'Static website CDN',
      },
    },
  },
  {
    id: 'full-stack-serverless',
    name: 'Full-Stack Serverless',
    description: 'VPC + RDS + Lambda + API Gateway + S3 + CloudFront',
    services: {
      vpc: { ...DEFAULT_VPC_CONFIG },
      subnets: {
        ...DEFAULT_SUBNET_CONFIG,
        public_subnet_cidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        private_subnet_cidrs: ['10.0.10.0/24', '10.0.11.0/24'],
        availability_zones: ['us-east-1a', 'us-east-1b'],
        create_nat_gateway: true,
      },
      security_groups: {
        groups: [
          {
            name: 'lambda',
            description: 'Security group for Lambda functions',
            ingress_rules: [],
            egress_rules: [
              { description: 'All outbound', from_port: 0, to_port: 0, protocol: '-1', cidr_blocks: ['0.0.0.0/0'] },
            ],
          },
          {
            name: 'rds',
            description: 'Security group for RDS',
            ingress_rules: [
              { description: 'PostgreSQL from Lambda', from_port: 5432, to_port: 5432, protocol: 'tcp', source_security_group: 'lambda' },
            ],
            egress_rules: [],
          },
        ],
      },
      iam: { ...DEFAULT_IAM_CONFIG, s3_access: true },
      rds: {
        ...DEFAULT_RDS_CONFIG,
        allowed_security_groups: ['lambda'],
      },
      lambda: {
        functions: [
          {
            name: 'api-handler',
            description: 'Main API handler with DB access',
            runtime: 'nodejs20.x',
            handler: 'index.handler',
            memory_size: 512,
            timeout: 30,
            architecture: 'arm64',
            environment_variables: {},
            create_function_url: false,
            vpc_enabled: true,
            vpc_subnet_type: 'private',
            layers: [],
            reserved_concurrency: null,
          },
        ],
      },
      api_gateway: {
        ...DEFAULT_API_GATEWAY_CONFIG,
        routes: [
          { path: '/api/{proxy+}', method: 'ANY', lambda_function: 'api-handler' },
        ],
      },
      s3: {
        bucket_prefix: 'frontend',
        versioning_enabled: false,
        encryption_enabled: true,
      },
      cloudfront: {
        ...DEFAULT_CLOUDFRONT_CONFIG,
        comment: 'Frontend CDN',
      },
      cloudwatch: {
        log_groups: [{ name: '/aws/lambda/api-handler', retention_days: 30 }],
        alarms: [
          {
            name: 'lambda-errors',
            description: 'Alert on Lambda errors',
            metric_name: 'Errors',
            namespace: 'AWS/Lambda',
            statistic: 'Sum',
            period: 300,
            evaluation_periods: 2,
            threshold: 5,
            comparison_operator: 'GreaterThanThreshold',
            dimensions: { FunctionName: 'api-handler' },
            actions_enabled: true,
            alarm_actions: [],
            ok_actions: [],
          },
        ],
        dashboard_enabled: false,
      },
    },
  },
  {
    id: 'scheduled-jobs',
    name: 'Scheduled Jobs',
    description: 'EventBridge + Lambda - cron-based background processing',
    services: {
      iam: { ...DEFAULT_IAM_CONFIG, s3_access: false },
      lambda: {
        functions: [
          {
            name: 'daily-cleanup',
            description: 'Daily cleanup job',
            runtime: 'python3.12',
            handler: 'handler.cleanup',
            memory_size: 256,
            timeout: 300,
            architecture: 'arm64',
            environment_variables: {},
            create_function_url: false,
            vpc_enabled: false,
            vpc_subnet_type: 'private',
            layers: [],
            reserved_concurrency: 1,
          },
          {
            name: 'hourly-sync',
            description: 'Hourly data sync',
            runtime: 'python3.12',
            handler: 'handler.sync',
            memory_size: 512,
            timeout: 600,
            architecture: 'arm64',
            environment_variables: {},
            create_function_url: false,
            vpc_enabled: false,
            vpc_subnet_type: 'private',
            layers: [],
            reserved_concurrency: 1,
          },
        ],
      },
      eventbridge: {
        use_default_bus: true,
        rules: [
          {
            name: 'daily-cleanup-schedule',
            description: 'Trigger daily cleanup at midnight UTC',
            schedule_expression: 'cron(0 0 * * ? *)',
            targets: [{ type: 'lambda', name: 'daily-cleanup' }],
          },
          {
            name: 'hourly-sync-schedule',
            description: 'Trigger sync every hour',
            schedule_expression: 'rate(1 hour)',
            targets: [{ type: 'lambda', name: 'hourly-sync' }],
          },
        ],
      },
      cloudwatch: {
        log_groups: [
          { name: '/aws/lambda/daily-cleanup', retention_days: 14 },
          { name: '/aws/lambda/hourly-sync', retention_days: 14 },
        ],
        alarms: [],
        dashboard_enabled: false,
      },
    },
  },
  {
    id: 'notification-system',
    name: 'Notification System',
    description: 'SNS + SQS + Lambda + SES - multi-channel notifications',
    services: {
      iam: { ...DEFAULT_IAM_CONFIG, s3_access: false },
      sns: {
        topics: [
          {
            name: 'user-notifications',
            display_name: 'User Notifications',
            fifo: false,
            content_based_deduplication: false,
            subscriptions: [
              { protocol: 'sqs', endpoint: 'email-queue' },
              { protocol: 'lambda', endpoint: 'push-sender' },
            ],
          },
        ],
      },
      sqs: {
        queues: [
          {
            name: 'email-queue',
            fifo: false,
            content_based_deduplication: false,
            visibility_timeout_seconds: 60,
            message_retention_seconds: 345600,
            max_message_size: 262144,
            delay_seconds: 0,
            receive_wait_time_seconds: 20,
            enable_dlq: true,
            dlq_max_receive_count: 3,
          },
        ],
      },
      lambda: {
        functions: [
          {
            name: 'email-sender',
            description: 'Processes email queue and sends via SES',
            runtime: 'nodejs20.x',
            handler: 'index.handler',
            memory_size: 256,
            timeout: 30,
            architecture: 'arm64',
            environment_variables: {},
            create_function_url: false,
            vpc_enabled: false,
            vpc_subnet_type: 'private',
            layers: [],
            reserved_concurrency: 5,
          },
          {
            name: 'push-sender',
            description: 'Sends push notifications',
            runtime: 'nodejs20.x',
            handler: 'index.handler',
            memory_size: 128,
            timeout: 10,
            architecture: 'arm64',
            environment_variables: {},
            create_function_url: false,
            vpc_enabled: false,
            vpc_subnet_type: 'private',
            layers: [],
            reserved_concurrency: 10,
          },
        ],
      },
      ses: {
        email_identities: ['noreply@example.com'],
        configuration_set_name: 'notifications',
        create_smtp_credentials: false,
        enable_sending: true,
      },
      cloudwatch: {
        log_groups: [
          { name: '/aws/lambda/email-sender', retention_days: 14 },
          { name: '/aws/lambda/push-sender', retention_days: 14 },
        ],
        alarms: [],
        dashboard_enabled: false,
      },
    },
  },
];

// =============================================================================
// Template Helper Functions
// =============================================================================

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplateNames(): { id: string; name: string }[] {
  return TEMPLATES.map(({ id, name }) => ({ id, name }));
}
