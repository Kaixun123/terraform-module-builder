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
} from '../types';

// =============================================================================
// EXISTING Default Service Configurations
// =============================================================================

export const DEFAULT_VPC_CONFIG: VPCConfig = {
  cidr_block: '10.0.0.0/16',
  enable_dns_hostnames: true,
  enable_dns_support: true,
};

export const DEFAULT_SUBNET_CONFIG: SubnetConfig = {
  public_subnet_cidrs: ['10.0.1.0/24'],
  private_subnet_cidrs: ['10.0.10.0/24'],
  availability_zones: ['us-east-1a'],
  create_nat_gateway: false,
};

export const DEFAULT_EC2_CONFIG: EC2Config = {
  instance_type: 't3.micro',
  ami_id: '', // Uses data source for Amazon Linux 2023
  key_pair_name: '',
  associate_public_ip: true,
  root_volume_size: 20,
  security_group_ids: [],
};

export const DEFAULT_S3_CONFIG: S3Config = {
  bucket_prefix: '', // Will use project name
  versioning_enabled: true,
  encryption_enabled: true,
};

export const DEFAULT_IAM_CONFIG: IAMConfig = {
  role_name: '', // Will use "${project}-ec2-role"
  create_instance_profile: true,
  managed_policy_arns: [],
  s3_access: true,
};

// =============================================================================
// NEW Default Service Configurations
// =============================================================================

export const DEFAULT_SECURITY_GROUP_CONFIG: SecurityGroupConfig = {
  groups: [
    {
      name: 'web',
      description: 'Security group for web servers',
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

export const DEFAULT_RDS_CONFIG: RDSConfig = {
  identifier: '', // Will use "${project}-db"
  engine: 'postgres',
  engine_version: '15.4',
  instance_class: 'db.t3.micro',
  allocated_storage: 20,
  max_allocated_storage: 100,
  database_name: 'app',
  master_username: 'dbadmin',
  multi_az: false,
  publicly_accessible: false,
  storage_encrypted: true,
  backup_retention_period: 7,
  deletion_protection: false,
  skip_final_snapshot: true,
  allowed_security_groups: [],
};

export const DEFAULT_LAMBDA_FUNCTION_CONFIG = {
  name: 'handler',
  description: 'Lambda function',
  runtime: 'nodejs20.x' as const,
  handler: 'index.handler',
  memory_size: 256,
  timeout: 30,
  architecture: 'arm64' as const,
  environment_variables: {},
  create_function_url: false,
  vpc_enabled: false,
  vpc_subnet_type: 'private' as const,
  layers: [],
  reserved_concurrency: null,
};

export const DEFAULT_LAMBDA_CONFIG: LambdaConfig = {
  functions: [{ ...DEFAULT_LAMBDA_FUNCTION_CONFIG }],
};

export const DEFAULT_API_GATEWAY_CONFIG: APIGatewayConfig = {
  name: '', // Will use "${project}-api"
  description: 'REST API',
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
  stage_name: '$default',
  auto_deploy: true,
  throttling_burst_limit: 100,
  throttling_rate_limit: 50,
};

export const DEFAULT_SQS_QUEUE_CONFIG = {
  name: 'queue',
  fifo: false,
  content_based_deduplication: false,
  visibility_timeout_seconds: 30,
  message_retention_seconds: 345600, // 4 days
  max_message_size: 262144, // 256 KB
  delay_seconds: 0,
  receive_wait_time_seconds: 0,
  enable_dlq: true,
  dlq_max_receive_count: 3,
};

export const DEFAULT_SQS_CONFIG: SQSConfig = {
  queues: [{ ...DEFAULT_SQS_QUEUE_CONFIG }],
};

export const DEFAULT_SNS_TOPIC_CONFIG = {
  name: 'notifications',
  display_name: 'Notifications',
  fifo: false,
  content_based_deduplication: false,
  subscriptions: [],
};

export const DEFAULT_SNS_CONFIG: SNSConfig = {
  topics: [{ ...DEFAULT_SNS_TOPIC_CONFIG }],
};

export const DEFAULT_EVENTBRIDGE_CONFIG: EventBridgeConfig = {
  use_default_bus: true,
  rules: [],
};

export const DEFAULT_CLOUDWATCH_CONFIG: CloudWatchConfig = {
  log_groups: [],
  alarms: [],
  dashboard_enabled: false,
};

export const DEFAULT_CLOUDFRONT_CONFIG: CloudFrontConfig = {
  comment: '', // Will use "${project} CDN"
  enabled: true,
  default_root_object: 'index.html',
  price_class: 'PriceClass_100',
  origin_type: 's3',
  default_cache_behavior: {
    allowed_methods: ['GET', 'HEAD'],
    cached_methods: ['GET', 'HEAD'],
    viewer_protocol_policy: 'redirect-to-https',
    min_ttl: 0,
    default_ttl: 86400,
    max_ttl: 31536000,
    compress: true,
  },
  custom_error_responses: [
    { error_code: 404, response_code: 200, response_page_path: '/index.html', error_caching_min_ttl: 300 },
    { error_code: 403, response_code: 200, response_page_path: '/index.html', error_caching_min_ttl: 300 },
  ],
  geo_restriction: {
    restriction_type: 'none',
    locations: [],
  },
};

export const DEFAULT_SES_CONFIG: SESConfig = {
  email_identities: [],
  configuration_set_name: '', // Will use "${project}-ses-config"
  create_smtp_credentials: false,
  enable_sending: true,
};

// =============================================================================
// Default Project Configuration
// =============================================================================

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  name: 'my-terraform-project',
  region: 'us-east-1',
  environment: 'dev',
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
// Available Options
// =============================================================================

export const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-west-2', label: 'EU (London)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
] as const;

export const AVAILABILITY_ZONES: Record<string, string[]> = {
  'us-east-1': ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'],
  'us-east-2': ['us-east-2a', 'us-east-2b', 'us-east-2c'],
  'us-west-1': ['us-west-1a', 'us-west-1b'],
  'us-west-2': ['us-west-2a', 'us-west-2b', 'us-west-2c', 'us-west-2d'],
  'eu-west-1': ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
  'eu-west-2': ['eu-west-2a', 'eu-west-2b', 'eu-west-2c'],
  'eu-central-1': ['eu-central-1a', 'eu-central-1b', 'eu-central-1c'],
  'ap-northeast-1': ['ap-northeast-1a', 'ap-northeast-1c', 'ap-northeast-1d'],
  'ap-southeast-1': ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'],
  'ap-southeast-2': ['ap-southeast-2a', 'ap-southeast-2b', 'ap-southeast-2c'],
};

export const INSTANCE_TYPES = [
  { value: 't3.micro', label: 't3.micro (1 vCPU, 1 GB)' },
  { value: 't3.small', label: 't3.small (2 vCPU, 2 GB)' },
  { value: 't3.medium', label: 't3.medium (2 vCPU, 4 GB)' },
  { value: 't3.large', label: 't3.large (2 vCPU, 8 GB)' },
  { value: 't3.xlarge', label: 't3.xlarge (4 vCPU, 16 GB)' },
  { value: 'm5.large', label: 'm5.large (2 vCPU, 8 GB)' },
  { value: 'm5.xlarge', label: 'm5.xlarge (4 vCPU, 16 GB)' },
  { value: 'm5.2xlarge', label: 'm5.2xlarge (8 vCPU, 32 GB)' },
  { value: 'c5.large', label: 'c5.large (2 vCPU, 4 GB)' },
  { value: 'c5.xlarge', label: 'c5.xlarge (4 vCPU, 8 GB)' },
] as const;

export const ENVIRONMENTS = [
  { value: 'dev', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'prod', label: 'Production' },
] as const;

// =============================================================================
// RDS Options
// =============================================================================

export const RDS_ENGINES = [
  { value: 'postgres', label: 'PostgreSQL', defaultVersion: '15.4' },
  { value: 'mysql', label: 'MySQL', defaultVersion: '8.0' },
  { value: 'mariadb', label: 'MariaDB', defaultVersion: '10.11' },
] as const;

export const RDS_ENGINE_VERSIONS: Record<string, { value: string; label: string }[]> = {
  postgres: [
    { value: '15.4', label: 'PostgreSQL 15.4' },
    { value: '14.9', label: 'PostgreSQL 14.9' },
    { value: '13.12', label: 'PostgreSQL 13.12' },
  ],
  mysql: [
    { value: '8.0', label: 'MySQL 8.0' },
    { value: '5.7', label: 'MySQL 5.7' },
  ],
  mariadb: [
    { value: '10.11', label: 'MariaDB 10.11' },
    { value: '10.6', label: 'MariaDB 10.6' },
  ],
};

export const RDS_INSTANCE_CLASSES = [
  { value: 'db.t3.micro', label: 'db.t3.micro (1 vCPU, 1 GB)' },
  { value: 'db.t3.small', label: 'db.t3.small (2 vCPU, 2 GB)' },
  { value: 'db.t3.medium', label: 'db.t3.medium (2 vCPU, 4 GB)' },
  { value: 'db.t3.large', label: 'db.t3.large (2 vCPU, 8 GB)' },
  { value: 'db.r5.large', label: 'db.r5.large (2 vCPU, 16 GB)' },
  { value: 'db.r5.xlarge', label: 'db.r5.xlarge (4 vCPU, 32 GB)' },
] as const;

// =============================================================================
// Lambda Options
// =============================================================================

export const LAMBDA_RUNTIMES = [
  { value: 'nodejs20.x', label: 'Node.js 20.x' },
  { value: 'nodejs18.x', label: 'Node.js 18.x' },
  { value: 'python3.12', label: 'Python 3.12' },
  { value: 'python3.11', label: 'Python 3.11' },
  { value: 'java21', label: 'Java 21' },
  { value: 'provided.al2023', label: 'Custom Runtime (AL2023)' },
] as const;

export const LAMBDA_ARCHITECTURES = [
  { value: 'arm64', label: 'ARM64 (Graviton2)' },
  { value: 'x86_64', label: 'x86_64' },
] as const;

export const LAMBDA_MEMORY_SIZES = [
  { value: 128, label: '128 MB' },
  { value: 256, label: '256 MB' },
  { value: 512, label: '512 MB' },
  { value: 1024, label: '1024 MB' },
  { value: 2048, label: '2048 MB' },
  { value: 3008, label: '3008 MB' },
] as const;

// =============================================================================
// API Gateway Options
// =============================================================================

export const API_GATEWAY_METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'ANY', label: 'ANY' },
] as const;

// =============================================================================
// CloudWatch Options
// =============================================================================

export const CLOUDWATCH_RETENTION_DAYS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
  { value: 60, label: '2 months' },
  { value: 90, label: '3 months' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
] as const;

// =============================================================================
// CloudFront Options
// =============================================================================

export const CLOUDFRONT_PRICE_CLASSES = [
  { value: 'PriceClass_100', label: 'Use Only North America and Europe' },
  { value: 'PriceClass_200', label: 'Use North America, Europe, Asia, Middle East, and Africa' },
  { value: 'PriceClass_All', label: 'Use All Edge Locations (Best Performance)' },
] as const;
