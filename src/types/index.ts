// =============================================================================
// Cloud Provider Types
// =============================================================================

export type CloudProvider = 'aws' | 'azure';

// =============================================================================
// Core Project Configuration Types
// =============================================================================

export interface ProjectConfig {
  name: string;                    // e.g., "my-app"
  provider: CloudProvider;         // 'aws' or 'azure'
  region: string;                  // e.g., "us-east-1" or "eastus"
  environment: string;             // e.g., "dev", "prod"
  resourceGroup?: string;          // Azure only: resource group name
  services: ServiceSelection;
  tags: Record<string, string>;
}

export interface ServiceSelection {
  // Networking
  vpc: VPCConfig | null;
  subnets: SubnetConfig | null;
  security_groups: SecurityGroupConfig | null;
  
  // Compute
  ec2: EC2Config | null;
  lambda: LambdaConfig | null;
  
  // Database
  rds: RDSConfig | null;
  
  // Storage
  s3: S3Config | null;
  
  // API
  api_gateway: APIGatewayConfig | null;
  
  // Messaging
  sqs: SQSConfig | null;
  sns: SNSConfig | null;
  
  // Events
  eventbridge: EventBridgeConfig | null;
  
  // Delivery
  cloudfront: CloudFrontConfig | null;
  ses: SESConfig | null;
  
  // Observability
  cloudwatch: CloudWatchConfig | null;
  
  // Identity
  iam: IAMConfig | null;
}

// =============================================================================
// EXISTING AWS Service Configuration Types
// =============================================================================

export interface VPCConfig {
  cidr_block: string;              // default: "10.0.0.0/16"
  enable_dns_hostnames: boolean;   // default: true
  enable_dns_support: boolean;     // default: true
}

export interface SubnetConfig {
  public_subnet_cidrs: string[];   // default: ["10.0.1.0/24"]
  private_subnet_cidrs: string[];  // default: ["10.0.10.0/24"]
  availability_zones: string[];    // default: ["us-east-1a"]
  create_nat_gateway: boolean;     // default: false
}

export interface EC2Config {
  instance_type: string;           // default: "t3.micro"
  ami_id: string;                  // default: "" (uses data source)
  key_pair_name: string;           // default: ""
  associate_public_ip: boolean;    // default: true
  root_volume_size: number;        // default: 20
  security_group_ids: string[];    // references to security group names
}

export interface S3Config {
  bucket_prefix: string;           // default: project name
  versioning_enabled: boolean;     // default: true
  encryption_enabled: boolean;     // default: true
}

export interface IAMConfig {
  role_name: string;               // default: "${project}-ec2-role"
  create_instance_profile: boolean; // default: true
  managed_policy_arns: string[];   // default: []
  s3_access: boolean;              // default: true if S3 selected
}

// =============================================================================
// SECURITY GROUPS
// =============================================================================

export interface SecurityGroupConfig {
  groups: SecurityGroupDefinition[];
}

export interface SecurityGroupDefinition {
  name: string;                           // e.g., "web", "db", "lambda"
  description: string;
  ingress_rules: SecurityGroupRule[];
  egress_rules: SecurityGroupRule[];
}

export interface SecurityGroupRule {
  description: string;
  from_port: number;
  to_port: number;
  protocol: 'tcp' | 'udp' | 'icmp' | '-1';
  cidr_blocks?: string[];                 // e.g., ["0.0.0.0/0"]
  source_security_group?: string;         // Reference another SG by name
}

// =============================================================================
// RDS
// =============================================================================

export interface RDSConfig {
  identifier: string;                     // default: "${project}-db"
  engine: 'postgres' | 'mysql' | 'mariadb';
  engine_version: string;                 // default: "15.4" for postgres
  instance_class: string;                 // default: "db.t3.micro"
  allocated_storage: number;              // default: 20
  max_allocated_storage: number;          // default: 100 (autoscaling)
  database_name: string;                  // default: "app"
  master_username: string;                // default: "dbadmin"
  multi_az: boolean;                      // default: false
  publicly_accessible: boolean;           // default: false
  storage_encrypted: boolean;             // default: true
  backup_retention_period: number;        // default: 7
  deletion_protection: boolean;           // default: false (for dev)
  skip_final_snapshot: boolean;           // default: true (for dev)
  allowed_security_groups: string[];      // SG names that can connect
}

// =============================================================================
// LAMBDA
// =============================================================================

export interface LambdaConfig {
  functions: LambdaFunctionConfig[];
}

export interface LambdaFunctionConfig {
  name: string;                           // e.g., "api-handler"
  description: string;
  runtime: 'nodejs20.x' | 'nodejs18.x' | 'python3.12' | 'python3.11' | 'java21' | 'provided.al2023';
  handler: string;                        // default: "index.handler"
  memory_size: number;                    // default: 256
  timeout: number;                        // default: 30
  architecture: 'x86_64' | 'arm64';       // default: "arm64"
  environment_variables: Record<string, string>;
  create_function_url: boolean;           // default: false
  vpc_enabled: boolean;                   // default: false
  vpc_subnet_type: 'public' | 'private';  // default: "private"
  layers: string[];                       // ARNs of Lambda layers
  reserved_concurrency: number | null;    // default: null (unreserved)
}

// =============================================================================
// API GATEWAY (HTTP API v2)
// =============================================================================

export interface APIGatewayConfig {
  name: string;                           // default: "${project}-api"
  description: string;
  protocol_type: 'HTTP' | 'WEBSOCKET';    // default: "HTTP"
  cors_enabled: boolean;                  // default: true
  cors_config: {
    allow_origins: string[];              // default: ["*"]
    allow_methods: string[];              // default: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers: string[];              // default: ["*"]
    max_age: number;                      // default: 300
  };
  routes: APIRouteConfig[];
  stage_name: string;                     // default: "$default"
  auto_deploy: boolean;                   // default: true
  throttling_burst_limit: number;         // default: 100
  throttling_rate_limit: number;          // default: 50
}

export interface APIRouteConfig {
  path: string;                           // e.g., "/users", "/users/{id}"
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ANY';
  lambda_function: string;                // Reference Lambda function by name
}

// =============================================================================
// SQS
// =============================================================================

export interface SQSConfig {
  queues: SQSQueueConfig[];
}

export interface SQSQueueConfig {
  name: string;                           // e.g., "orders-queue"
  fifo: boolean;                          // default: false
  content_based_deduplication: boolean;   // default: false (only for FIFO)
  visibility_timeout_seconds: number;     // default: 30
  message_retention_seconds: number;      // default: 345600 (4 days)
  max_message_size: number;               // default: 262144 (256 KB)
  delay_seconds: number;                  // default: 0
  receive_wait_time_seconds: number;      // default: 0
  enable_dlq: boolean;                    // default: true
  dlq_max_receive_count: number;          // default: 3
}

// =============================================================================
// SNS
// =============================================================================

export interface SNSConfig {
  topics: SNSTopicConfig[];
}

export interface SNSTopicConfig {
  name: string;                           // e.g., "order-notifications"
  display_name: string;
  fifo: boolean;                          // default: false
  content_based_deduplication: boolean;   // default: false
  subscriptions: SNSSubscription[];
}

export interface SNSSubscription {
  protocol: 'sqs' | 'lambda' | 'email' | 'https';
  endpoint: string;                       // Queue name, Lambda name, email, or URL
  filter_policy?: Record<string, string[]>;  // Optional message filtering
}

// =============================================================================
// EVENTBRIDGE
// =============================================================================

export interface EventBridgeConfig {
  use_default_bus: boolean;               // default: true
  custom_bus_name?: string;               // if not using default
  rules: EventBridgeRuleConfig[];
}

export interface EventBridgeRuleConfig {
  name: string;                           // e.g., "order-created-rule"
  description: string;
  event_pattern?: {                       // Pattern-based trigger
    source?: string[];
    detail_type?: string[];
    detail?: Record<string, string[]>;
  };
  schedule_expression?: string;           // e.g., "rate(5 minutes)", "cron(0 12 * * ? *)"
  targets: EventBridgeTarget[];
}

export interface EventBridgeTarget {
  type: 'lambda' | 'sqs' | 'sns';
  name: string;                           // Reference by name
  input_transformer?: {
    input_paths: Record<string, string>;
    input_template: string;
  };
}

// =============================================================================
// CLOUDWATCH
// =============================================================================

export interface CloudWatchConfig {
  log_groups: CloudWatchLogGroupConfig[];
  alarms: CloudWatchAlarmConfig[];
  dashboard_enabled: boolean;             // default: false
  dashboard_name?: string;
}

export interface CloudWatchLogGroupConfig {
  name: string;
  retention_days: number;                 // default: 30
}

export interface CloudWatchAlarmConfig {
  name: string;                           // e.g., "high-cpu-alarm"
  description: string;
  metric_name: string;                    // e.g., "CPUUtilization"
  namespace: string;                      // e.g., "AWS/EC2", "AWS/RDS"
  statistic: 'Average' | 'Sum' | 'Maximum' | 'Minimum';
  period: number;                         // seconds, default: 300
  evaluation_periods: number;             // default: 2
  threshold: number;
  comparison_operator: 'GreaterThanThreshold' | 'LessThanThreshold' | 'GreaterThanOrEqualToThreshold' | 'LessThanOrEqualToThreshold';
  dimensions: Record<string, string>;     // e.g., { InstanceId: "reference" }
  actions_enabled: boolean;               // default: true
  alarm_actions: string[];                // SNS topic names
  ok_actions: string[];
}

// =============================================================================
// CLOUDFRONT
// =============================================================================

export interface CloudFrontConfig {
  comment: string;                        // default: "${project} CDN"
  enabled: boolean;                       // default: true
  default_root_object: string;            // default: "index.html"
  price_class: 'PriceClass_100' | 'PriceClass_200' | 'PriceClass_All'; // default: "PriceClass_100"
  origin_type: 's3' | 'custom';           // default: "s3"
  s3_bucket_name?: string;                // Reference S3 bucket by name
  custom_origin_config?: {
    domain_name: string;
    origin_protocol_policy: 'http-only' | 'https-only' | 'match-viewer';
    http_port: number;
    https_port: number;
  };
  default_cache_behavior: {
    allowed_methods: string[];            // default: ["GET", "HEAD"]
    cached_methods: string[];             // default: ["GET", "HEAD"]
    viewer_protocol_policy: 'redirect-to-https' | 'https-only' | 'allow-all';
    min_ttl: number;                      // default: 0
    default_ttl: number;                  // default: 3600
    max_ttl: number;                      // default: 86400
    compress: boolean;                    // default: true
  };
  custom_error_responses: CustomErrorResponse[];
  geo_restriction: {
    restriction_type: 'none' | 'whitelist' | 'blacklist';
    locations: string[];                  // ISO 3166-1-alpha-2 codes
  };
}

export interface CustomErrorResponse {
  error_code: number;                     // e.g., 404, 403
  response_code: number;                  // e.g., 200
  response_page_path: string;             // e.g., "/index.html"
  error_caching_min_ttl: number;          // default: 300
}

// =============================================================================
// SES
// =============================================================================

export interface SESConfig {
  domain_identity?: string;               // e.g., "example.com"
  email_identities: string[];             // e.g., ["noreply@example.com"]
  configuration_set_name: string;         // default: "${project}-ses-config"
  create_smtp_credentials: boolean;       // default: false
  enable_sending: boolean;                // default: true
}

// =============================================================================
// Template Types
// =============================================================================

export interface Template {
  id: string;
  name: string;
  description: string;
  provider: CloudProvider;
  services: Partial<ServiceSelection>;
}

// =============================================================================
// Service Metadata Types (for UI and Diagram)
// =============================================================================

export type ServiceType = 
  | 'vpc' 
  | 'subnets' 
  | 'security_groups'
  | 'ec2' 
  | 'lambda'
  | 'rds'
  | 's3' 
  | 'api_gateway'
  | 'sqs'
  | 'sns'
  | 'eventbridge'
  | 'cloudfront'
  | 'ses'
  | 'cloudwatch'
  | 'iam';

export interface ServiceMetadata {
  id: ServiceType;
  name: string;
  description: string;
  color: string;
  icon: string;
  dependencies: ServiceType[];
}

export interface ServiceCategory {
  name: string;
  services: ServiceType[];
}

// =============================================================================
// Generated Files Types
// =============================================================================

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GeneratedModule {
  name: string;
  files: GeneratedFile[];
}

export interface GeneratedProject {
  rootFiles: GeneratedFile[];
  modules: GeneratedModule[];
}

// =============================================================================
// Diagram Types
// =============================================================================

export interface DiagramNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    serviceType: ServiceType;
    config?: unknown;
  };
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

// =============================================================================
// Validation Types
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// =============================================================================
// Store Types
// =============================================================================

export interface ProjectStore {
  // State
  project: ProjectConfig;
  selectedTemplate: string | null;
  
  // Actions
  updateProject: (updates: Partial<ProjectConfig>) => void;
  updateProjectName: (name: string) => void;
  updateRegion: (region: string) => void;
  updateEnvironment: (environment: string) => void;
  setProvider: (provider: CloudProvider) => void;
  toggleService: (service: ServiceType, enabled: boolean) => void;
  updateServiceConfig: <T extends ServiceType>(
    service: T,
    config: Partial<NonNullable<ServiceSelection[T]>>
  ) => void;
  loadTemplate: (templateId: string) => void;
  resetProject: () => void;
  
  // Computed helpers
  isServiceEnabled: (service: ServiceType) => boolean;
  getServiceDependents: (service: ServiceType) => ServiceType[];
}
