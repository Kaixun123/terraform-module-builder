import type { ServiceType, ServiceMetadata, ServiceCategory } from '../../types';

// =============================================================================
// Azure Service Dependency Graph
// Uses same keys as AWS for provider-agnostic code
// =============================================================================

export const AZURE_DEPENDENCY_GRAPH: Record<ServiceType, ServiceType[]> = {
  // Networking
  vpc: [],                              // VNet - no dependencies
  subnets: ['vpc'],                     // Subnets require VNet
  security_groups: ['vpc'],             // NSG requires VNet
  
  // Compute
  ec2: ['vpc', 'subnets', 'security_groups'],  // VMs require networking
  lambda: ['iam'],                      // Azure Functions require managed identity for best practice
  
  // Database
  rds: ['vpc', 'subnets', 'security_groups'],  // Azure Database requires networking
  
  // Storage
  s3: [],                               // Storage Account has no dependencies
  
  // API
  api_gateway: ['iam'],                 // API Management may need identity
  
  // Messaging
  sqs: [],                              // Service Bus Queue has no dependencies
  sns: [],                              // Service Bus Topic has no dependencies
  
  // Events
  eventbridge: [],                      // Event Grid has no dependencies
  
  // Delivery
  cloudfront: ['s3'],                   // CDN typically needs Storage
  ses: [],                              // Communication Services has no dependencies
  
  // Observability
  cloudwatch: [],                       // Azure Monitor has no dependencies
  
  // Identity
  iam: [],                              // Managed Identity has no dependencies
};

// =============================================================================
// Azure Service Metadata
// Azure-specific names and colors
// =============================================================================

export const AZURE_SERVICE_METADATA: Record<ServiceType, ServiceMetadata> = {
  vpc: {
    id: 'vpc',
    name: 'Virtual Network',
    description: 'Azure Virtual Network for network isolation',
    color: '#0078D4',    // Azure Blue
    icon: 'network',
    dependencies: [],
  },
  subnets: {
    id: 'subnets',
    name: 'Subnets',
    description: 'Subnet segmentation within VNet',
    color: '#50E6FF',
    icon: 'subnet',
    dependencies: ['vpc'],
  },
  security_groups: {
    id: 'security_groups',
    name: 'Network Security Groups',
    description: 'NSG rules for traffic filtering',
    color: '#E74856',    // Red
    icon: 'security',
    dependencies: ['vpc'],
  },
  ec2: {
    id: 'ec2',
    name: 'Virtual Machines',
    description: 'Azure VMs for compute workloads',
    color: '#008272',    // Teal
    icon: 'compute',
    dependencies: ['vpc', 'subnets', 'security_groups'],
  },
  lambda: {
    id: 'lambda',
    name: 'Azure Functions',
    description: 'Serverless compute service',
    color: '#FFCC00',    // Yellow
    icon: 'function',
    dependencies: ['iam'],
  },
  rds: {
    id: 'rds',
    name: 'Azure Database',
    description: 'Managed PostgreSQL, MySQL, MariaDB',
    color: '#0063B1',    // Blue
    icon: 'database',
    dependencies: ['vpc', 'subnets', 'security_groups'],
  },
  s3: {
    id: 's3',
    name: 'Storage Account',
    description: 'Blob, File, Queue, Table storage',
    color: '#FF8C00',    // Orange
    icon: 'storage',
    dependencies: [],
  },
  api_gateway: {
    id: 'api_gateway',
    name: 'API Management',
    description: 'API gateway and management',
    color: '#68217A',    // Purple
    icon: 'api',
    dependencies: ['iam'],
  },
  sqs: {
    id: 'sqs',
    name: 'Service Bus Queue',
    description: 'Message queuing service',
    color: '#C239B3',    // Pink
    icon: 'queue',
    dependencies: [],
  },
  sns: {
    id: 'sns',
    name: 'Service Bus Topic',
    description: 'Pub/sub messaging with topics',
    color: '#E81123',    // Red
    icon: 'topic',
    dependencies: [],
  },
  eventbridge: {
    id: 'eventbridge',
    name: 'Event Grid',
    description: 'Event-driven architecture',
    color: '#00BCF2',    // Light Blue
    icon: 'event',
    dependencies: [],
  },
  cloudfront: {
    id: 'cloudfront',
    name: 'Azure CDN',
    description: 'Content delivery network',
    color: '#773ADC',    // Purple
    icon: 'cdn',
    dependencies: ['s3'],
  },
  ses: {
    id: 'ses',
    name: 'Communication Services',
    description: 'Email and SMS services',
    color: '#00A4EF',    // Azure Blue
    icon: 'email',
    dependencies: [],
  },
  cloudwatch: {
    id: 'cloudwatch',
    name: 'Azure Monitor',
    description: 'Monitoring and alerting',
    color: '#107C10',    // Green
    icon: 'monitor',
    dependencies: [],
  },
  iam: {
    id: 'iam',
    name: 'Managed Identity',
    description: 'Identity and access management',
    color: '#FFB900',    // Gold
    icon: 'identity',
    dependencies: [],
  },
};

// =============================================================================
// Azure Service Categories
// Same categories as AWS for consistent UI
// =============================================================================

export const AZURE_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    name: 'Networking',
    services: ['vpc', 'subnets', 'security_groups'],
  },
  {
    name: 'Compute',
    services: ['ec2', 'lambda'],
  },
  {
    name: 'Database',
    services: ['rds'],
  },
  {
    name: 'Storage',
    services: ['s3'],
  },
  {
    name: 'API',
    services: ['api_gateway'],
  },
  {
    name: 'Messaging',
    services: ['sqs', 'sns', 'eventbridge'],
  },
  {
    name: 'Delivery',
    services: ['cloudfront', 'ses'],
  },
  {
    name: 'Observability',
    services: ['cloudwatch'],
  },
  {
    name: 'Identity',
    services: ['iam'],
  },
];
