// =============================================================================
// Azure-Specific Service Configuration Types
// =============================================================================
// These types mirror AWS service configs but with Azure naming conventions
// The ServiceSelection interface uses the same keys for provider-agnostic code

// =============================================================================
// VIRTUAL NETWORK (Azure VPC equivalent)
// =============================================================================

export interface AzureVNetConfig {
  address_space: string[];           // default: ["10.0.0.0/16"]
  dns_servers: string[];             // default: [] (use Azure-provided)
}

// =============================================================================
// SUBNETS
// =============================================================================

export interface AzureSubnetConfig {
  subnets: AzureSubnetDefinition[];
}

export interface AzureSubnetDefinition {
  name: string;                      // e.g., "public", "private"
  address_prefix: string;            // e.g., "10.0.1.0/24"
  is_public: boolean;                // determines NAT Gateway usage
  service_endpoints: string[];       // e.g., ["Microsoft.Storage"]
}

// =============================================================================
// NETWORK SECURITY GROUPS (Security Groups equivalent)
// =============================================================================

export interface AzureNSGConfig {
  groups: AzureNSGDefinition[];
}

export interface AzureNSGDefinition {
  name: string;
  rules: AzureNSGRule[];
}

export interface AzureNSGRule {
  name: string;
  priority: number;                  // 100-4096
  direction: 'Inbound' | 'Outbound';
  access: 'Allow' | 'Deny';
  protocol: 'Tcp' | 'Udp' | 'Icmp' | '*';
  source_port_range: string;         // e.g., "*", "80", "1024-65535"
  destination_port_range: string;
  source_address_prefix: string;     // e.g., "*", "10.0.0.0/8", "VirtualNetwork"
  destination_address_prefix: string;
}

// =============================================================================
// VIRTUAL MACHINES (EC2 equivalent)
// =============================================================================

export interface AzureVMConfig {
  vm_size: string;                   // e.g., "Standard_B1s"
  admin_username: string;            // default: "azureuser"
  os_type: 'linux' | 'windows';      // default: "linux"
  source_image: {
    publisher: string;               // e.g., "Canonical"
    offer: string;                   // e.g., "0001-com-ubuntu-server-jammy"
    sku: string;                     // e.g., "22_04-lts"
    version: string;                 // e.g., "latest"
  };
  os_disk_size_gb: number;           // default: 30
  os_disk_type: 'Standard_LRS' | 'Premium_LRS' | 'StandardSSD_LRS';
  enable_public_ip: boolean;         // default: true
  ssh_public_key?: string;           // SSH public key for Linux
}

// =============================================================================
// AZURE FUNCTIONS (Lambda equivalent)
// =============================================================================

export interface AzureFunctionsConfig {
  functions: AzureFunctionAppConfig[];
}

export interface AzureFunctionAppConfig {
  name: string;
  runtime: 'node' | 'python' | 'dotnet' | 'java';
  runtime_version: string;           // e.g., "18", "3.10", "6.0"
  os_type: 'linux' | 'windows';      // default: "linux"
  sku_name: string;                  // default: "Y1" (consumption)
  https_only: boolean;               // default: true
  app_settings: Record<string, string>;
  vnet_integration: boolean;         // default: false
  timer_triggers: AzureTimerTrigger[];
}

export interface AzureTimerTrigger {
  name: string;
  schedule: string;                  // NCRONTAB format: "0 */5 * * * *"
}

// =============================================================================
// AZURE DATABASE (RDS equivalent)
// =============================================================================

export interface AzureDatabaseConfig {
  server_name: string;
  engine: 'postgresql' | 'mysql' | 'mariadb';
  version: string;                   // e.g., "15", "8.0"
  sku_name: string;                  // e.g., "B_Standard_B1ms"
  storage_mb: number;                // default: 32768 (32GB)
  backup_retention_days: number;     // default: 7
  geo_redundant_backup: boolean;     // default: false
  high_availability: boolean;        // default: false
  administrator_login: string;       // default: "dbadmin"
  database_name: string;             // default: "app"
  public_network_access: boolean;    // default: false
}

// =============================================================================
// STORAGE ACCOUNT (S3 equivalent)
// =============================================================================

export interface AzureStorageConfig {
  account_name_prefix: string;
  account_tier: 'Standard' | 'Premium';
  account_replication_type: 'LRS' | 'GRS' | 'RAGRS' | 'ZRS';
  enable_https_traffic_only: boolean;
  min_tls_version: 'TLS1_2';
  enable_blob_versioning: boolean;
  enable_static_website: boolean;
  static_website_index: string;      // default: "index.html"
  static_website_error: string;      // default: "404.html"
  containers: AzureStorageContainer[];
}

export interface AzureStorageContainer {
  name: string;
  access_type: 'private' | 'blob' | 'container';
}

// =============================================================================
// API MANAGEMENT (API Gateway equivalent)
// =============================================================================

export interface AzureAPIManagementConfig {
  name: string;
  sku_name: 'Consumption' | 'Developer' | 'Basic' | 'Standard' | 'Premium';
  publisher_name: string;
  publisher_email: string;
  apis: AzureAPIConfig[];
}

export interface AzureAPIConfig {
  name: string;
  display_name: string;
  path: string;
  protocols: ('http' | 'https')[];
  operations: AzureAPIOperation[];
}

export interface AzureAPIOperation {
  operation_id: string;
  display_name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url_template: string;
  backend_url?: string;
}

// =============================================================================
// SERVICE BUS QUEUE (SQS equivalent)
// =============================================================================

export interface AzureServiceBusQueueConfig {
  queues: AzureQueueDefinition[];
}

export interface AzureQueueDefinition {
  name: string;
  max_size_in_megabytes: number;     // default: 1024
  default_message_ttl: string;       // ISO 8601: "P14D" (14 days)
  lock_duration: string;             // ISO 8601: "PT1M" (1 minute)
  max_delivery_count: number;        // default: 10
  enable_dead_lettering: boolean;    // default: true
  requires_session: boolean;         // default: false
  enable_partitioning: boolean;      // default: false
}

// =============================================================================
// SERVICE BUS TOPIC (SNS equivalent)
// =============================================================================

export interface AzureServiceBusTopicConfig {
  topics: AzureTopicDefinition[];
}

export interface AzureTopicDefinition {
  name: string;
  max_size_in_megabytes: number;
  default_message_ttl: string;
  enable_partitioning: boolean;
  subscriptions: AzureTopicSubscription[];
}

export interface AzureTopicSubscription {
  name: string;
  max_delivery_count: number;
  enable_dead_lettering: boolean;
  forward_to?: string;               // Forward to queue or another topic
}

// =============================================================================
// EVENT GRID (EventBridge equivalent)
// =============================================================================

export interface AzureEventGridConfig {
  topics: AzureEventGridTopic[];
  system_topics: AzureSystemTopic[];
}

export interface AzureEventGridTopic {
  name: string;
  subscriptions: AzureEventGridSubscription[];
}

export interface AzureSystemTopic {
  name: string;
  source_resource_type: string;      // e.g., "Microsoft.Storage.StorageAccounts"
  subscriptions: AzureEventGridSubscription[];
}

export interface AzureEventGridSubscription {
  name: string;
  endpoint_type: 'webhook' | 'azurefunction' | 'storagequeue' | 'servicebusqueue';
  endpoint: string;
  event_types?: string[];            // Filter by event type
}

// =============================================================================
// AZURE MONITOR (CloudWatch equivalent)
// =============================================================================

export interface AzureMonitorConfig {
  log_analytics_workspace: boolean;
  log_retention_days: number;        // default: 30
  action_groups: AzureActionGroup[];
  metric_alerts: AzureMetricAlert[];
}

export interface AzureActionGroup {
  name: string;
  short_name: string;                // max 12 chars
  email_receivers: AzureEmailReceiver[];
}

export interface AzureEmailReceiver {
  name: string;
  email_address: string;
}

export interface AzureMetricAlert {
  name: string;
  description: string;
  severity: 0 | 1 | 2 | 3 | 4;        // 0 = Critical, 4 = Verbose
  target_resource_type: string;
  metric_name: string;
  aggregation: 'Average' | 'Count' | 'Maximum' | 'Minimum' | 'Total';
  operator: 'GreaterThan' | 'GreaterThanOrEqual' | 'LessThan' | 'LessThanOrEqual';
  threshold: number;
  frequency: string;                 // ISO 8601: "PT5M"
  window_size: string;               // ISO 8601: "PT15M"
  action_group_name: string;
}

// =============================================================================
// AZURE CDN (CloudFront equivalent)
// =============================================================================

export interface AzureCDNConfig {
  profile_name: string;
  sku: 'Standard_Microsoft' | 'Standard_Akamai' | 'Standard_Verizon' | 'Premium_Verizon';
  endpoints: AzureCDNEndpoint[];
}

export interface AzureCDNEndpoint {
  name: string;
  origin_host_name: string;
  origin_type: 'storage' | 'webapp' | 'custom';
  is_http_allowed: boolean;
  is_https_allowed: boolean;
  optimization_type: 'GeneralWebDelivery' | 'DynamicSiteAcceleration';
}

// =============================================================================
// COMMUNICATION SERVICES (SES equivalent)
// =============================================================================

export interface AzureCommunicationConfig {
  name: string;
  data_location: 'United States' | 'Europe' | 'UK' | 'Australia' | 'Japan';
  email_services: AzureEmailService[];
}

export interface AzureEmailService {
  name: string;
  domain: string;                    // e.g., "AzureManagedDomain" or custom domain
  sender_addresses: string[];
}

// =============================================================================
// MANAGED IDENTITY (IAM equivalent)
// =============================================================================

export interface AzureManagedIdentityConfig {
  name: string;
  role_assignments: AzureRoleAssignment[];
}

export interface AzureRoleAssignment {
  role_definition_name: string;      // e.g., "Contributor", "Reader", "Storage Blob Data Reader"
  scope_type: 'resource_group' | 'subscription' | 'resource';
  scope_resource?: string;           // Resource ID if scope_type is 'resource'
}
