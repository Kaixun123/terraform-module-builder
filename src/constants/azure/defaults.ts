import type {
  VPCConfig,
  SubnetConfig,
  EC2Config,
  S3Config,
  IAMConfig,
  SecurityGroupConfig,
  RDSConfig,
  LambdaConfig,
  APIGatewayConfig,
  SQSConfig,
  SNSConfig,
  EventBridgeConfig,
  CloudWatchConfig,
  CloudFrontConfig,
  SESConfig,
  ProjectConfig,
} from '../../types';

// =============================================================================
// Azure Default Service Configurations
// These use the same interfaces as AWS for provider-agnostic code
// The generators interpret these values appropriately for Azure
// =============================================================================

export const DEFAULT_AZURE_VNET_CONFIG: VPCConfig = {
  cidr_block: '10.0.0.0/16',
  enable_dns_hostnames: true,  // Maps to Azure DNS settings
  enable_dns_support: true,
};

export const DEFAULT_AZURE_SUBNET_CONFIG: SubnetConfig = {
  public_subnet_cidrs: ['10.0.1.0/24'],
  private_subnet_cidrs: ['10.0.10.0/24'],
  availability_zones: ['1'],  // Azure uses zones 1, 2, 3
  create_nat_gateway: false,
};

export const DEFAULT_AZURE_NSG_CONFIG: SecurityGroupConfig = {
  groups: [
    {
      name: 'web',
      description: 'Network security group for web servers',
      ingress_rules: [
        { description: 'HTTP', from_port: 80, to_port: 80, protocol: 'tcp', cidr_blocks: ['0.0.0.0/0'] },
        { description: 'HTTPS', from_port: 443, to_port: 443, protocol: 'tcp', cidr_blocks: ['0.0.0.0/0'] },
        { description: 'SSH', from_port: 22, to_port: 22, protocol: 'tcp', cidr_blocks: ['0.0.0.0/0'] },
      ],
      egress_rules: [
        { description: 'All outbound', from_port: 0, to_port: 0, protocol: '-1', cidr_blocks: ['0.0.0.0/0'] },
      ],
    },
  ],
};

export const DEFAULT_AZURE_VM_CONFIG: EC2Config = {
  instance_type: 'Standard_B1s',  // Azure VM size
  ami_id: '',  // Not used in Azure - uses source_image
  key_pair_name: '',
  associate_public_ip: true,
  root_volume_size: 30,
  security_group_ids: [],
};

export const DEFAULT_AZURE_FUNCTION_CONFIG: LambdaConfig = {
  functions: [
    {
      name: 'handler',
      description: 'Azure Function',
      runtime: 'nodejs20.x',  // Will map to node/18
      handler: 'index.handler',
      memory_size: 256,
      timeout: 30,
      architecture: 'x86_64',  // Azure functions don't specify arch
      environment_variables: {},
      create_function_url: false,
      vpc_enabled: false,
      vpc_subnet_type: 'private',
      layers: [],
      reserved_concurrency: null,
    },
  ],
};

export const DEFAULT_AZURE_DATABASE_CONFIG: RDSConfig = {
  identifier: '',
  engine: 'postgres',
  engine_version: '15',
  instance_class: 'B_Standard_B1ms',  // Azure DB SKU
  allocated_storage: 32,  // In GB for Azure
  max_allocated_storage: 128,
  database_name: 'app',
  master_username: 'dbadmin',
  multi_az: false,  // Maps to high_availability in Azure
  publicly_accessible: false,
  storage_encrypted: true,
  backup_retention_period: 7,
  deletion_protection: false,
  skip_final_snapshot: true,
  allowed_security_groups: [],
};

export const DEFAULT_AZURE_STORAGE_CONFIG: S3Config = {
  bucket_prefix: '',
  versioning_enabled: true,  // Maps to blob versioning
  encryption_enabled: true,
};

export const DEFAULT_AZURE_APIM_CONFIG: APIGatewayConfig = {
  name: '',
  description: 'API Management',
  protocol_type: 'HTTP',
  cors_enabled: true,
  cors_config: {
    allow_origins: ['*'],
    allow_methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allow_headers: ['*'],
    max_age: 300,
  },
  routes: [
    { path: '/health', method: 'GET', lambda_function: 'handler' },
  ],
  stage_name: 'v1',
  auto_deploy: true,
  throttling_burst_limit: 100,
  throttling_rate_limit: 50,
};

export const DEFAULT_AZURE_SERVICEBUS_QUEUE_CONFIG: SQSConfig = {
  queues: [
    {
      name: 'queue',
      fifo: false,  // Azure has session-based ordering
      content_based_deduplication: false,
      visibility_timeout_seconds: 30,  // Maps to lock_duration
      message_retention_seconds: 1209600,  // 14 days, maps to default_message_ttl
      max_message_size: 262144,
      delay_seconds: 0,
      receive_wait_time_seconds: 0,
      enable_dlq: true,
      dlq_max_receive_count: 10,  // Azure default
    },
  ],
};

export const DEFAULT_AZURE_SERVICEBUS_TOPIC_CONFIG: SNSConfig = {
  topics: [
    {
      name: 'notifications',
      display_name: 'Notifications',
      fifo: false,
      content_based_deduplication: false,
      subscriptions: [],
    },
  ],
};

export const DEFAULT_AZURE_EVENTGRID_CONFIG: EventBridgeConfig = {
  use_default_bus: true,  // Azure doesn't have default bus concept
  rules: [],
};

export const DEFAULT_AZURE_MONITOR_CONFIG: CloudWatchConfig = {
  log_groups: [],  // Maps to Log Analytics Workspace
  alarms: [],  // Maps to Metric Alerts
  dashboard_enabled: false,
};

export const DEFAULT_AZURE_CDN_CONFIG: CloudFrontConfig = {
  comment: '',
  enabled: true,
  default_root_object: 'index.html',
  price_class: 'PriceClass_All',  // Azure doesn't have price classes
  origin_type: 's3',  // Maps to storage origin
  default_cache_behavior: {
    allowed_methods: ['GET', 'HEAD'],
    cached_methods: ['GET', 'HEAD'],
    viewer_protocol_policy: 'redirect-to-https',
    min_ttl: 0,
    default_ttl: 86400,
    max_ttl: 31536000,
    compress: true,
  },
  custom_error_responses: [],
  geo_restriction: {
    restriction_type: 'none',
    locations: [],
  },
};

export const DEFAULT_AZURE_COMMUNICATION_CONFIG: SESConfig = {
  email_identities: [],
  configuration_set_name: '',
  create_smtp_credentials: false,
  enable_sending: true,
};

export const DEFAULT_AZURE_IDENTITY_CONFIG: IAMConfig = {
  role_name: '',
  create_instance_profile: false,  // Not applicable to Azure
  managed_policy_arns: [],  // Maps to role assignments
  s3_access: true,  // Maps to Storage Blob Data Contributor
};

// =============================================================================
// Default Azure Project Configuration
// =============================================================================

export const DEFAULT_AZURE_PROJECT_CONFIG: ProjectConfig = {
  name: 'my-terraform-project',
  provider: 'azure',
  region: 'eastus',
  environment: 'dev',
  resourceGroup: 'rg-my-terraform-project',
  services: {
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
  },
  tags: {
    ManagedBy: 'Terraform',
    Environment: 'dev',
  },
};

// =============================================================================
// Azure Environments
// =============================================================================

export const AZURE_ENVIRONMENTS = [
  { value: 'dev', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'prod', label: 'Production' },
] as const;
