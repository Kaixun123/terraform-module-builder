import type { ServiceType, ServiceMetadata, ServiceCategory } from '../types';

// =============================================================================
// Service Dependency Graph
// =============================================================================
// Maps each service to its required dependencies
// e.g., EC2 requires VPC, Subnets, and IAM

export const DEPENDENCY_GRAPH: Record<ServiceType, ServiceType[]> = {
  // Networking
  vpc: [],
  subnets: ['vpc'],
  security_groups: ['vpc'],
  
  // Compute
  ec2: ['vpc', 'subnets', 'iam', 'security_groups'],
  lambda: ['iam'],  // VPC optional via config
  
  // Database
  rds: ['vpc', 'subnets', 'security_groups'],
  
  // Storage
  s3: [],
  
  // API
  api_gateway: ['lambda', 'iam'],
  
  // Messaging
  sqs: ['iam'],
  sns: ['iam'],
  
  // Events
  eventbridge: [],  // Targets are optional
  
  // Delivery
  cloudfront: ['s3'],  // For S3 origin
  ses: ['iam'],
  
  // Observability
  cloudwatch: [],  // Standalone, references others
  
  // Identity
  iam: [],
};

// =============================================================================
// Reverse Dependency Graph (Dependents)
// =============================================================================
// Maps each service to services that depend on it

export const DEPENDENTS_GRAPH: Record<ServiceType, ServiceType[]> = {
  // Networking
  vpc: ['subnets', 'security_groups', 'ec2', 'rds'],
  subnets: ['ec2', 'rds'],
  security_groups: ['ec2', 'rds'],
  
  // Compute
  ec2: [],
  lambda: ['api_gateway'],
  
  // Database
  rds: [],
  
  // Storage
  s3: ['cloudfront'],
  
  // API
  api_gateway: [],
  
  // Messaging
  sqs: [],
  sns: [],
  
  // Events
  eventbridge: [],
  
  // Delivery
  cloudfront: [],
  ses: [],
  
  // Observability
  cloudwatch: [],
  
  // Identity
  iam: ['ec2', 'lambda', 'api_gateway', 'sqs', 'sns', 'ses'],
};

// =============================================================================
// Service Metadata
// =============================================================================

export const SERVICE_METADATA: Record<ServiceType, ServiceMetadata> = {
  // Networking
  vpc: {
    id: 'vpc',
    name: 'VPC',
    description: 'Virtual Private Cloud - Isolated network environment',
    color: '#FF9900',
    icon: 'vpc',
    dependencies: [],
  },
  subnets: {
    id: 'subnets',
    name: 'Subnets',
    description: 'Public and private network segments within VPC',
    color: '#3F8624',
    icon: 'subnet',
    dependencies: ['vpc'],
  },
  security_groups: {
    id: 'security_groups',
    name: 'Security Groups',
    description: 'Virtual firewalls for network traffic control',
    color: '#DD344C',
    icon: 'security',
    dependencies: ['vpc'],
  },
  
  // Compute
  ec2: {
    id: 'ec2',
    name: 'EC2',
    description: 'Elastic Compute Cloud - Virtual server instances',
    color: '#FF9900',
    icon: 'ec2',
    dependencies: ['vpc', 'subnets', 'iam', 'security_groups'],
  },
  lambda: {
    id: 'lambda',
    name: 'Lambda',
    description: 'Serverless compute - Run code without servers',
    color: '#FF9900',
    icon: 'lambda',
    dependencies: ['iam'],
  },
  
  // Database
  rds: {
    id: 'rds',
    name: 'RDS',
    description: 'Relational Database Service - Managed databases',
    color: '#3B48CC',
    icon: 'rds',
    dependencies: ['vpc', 'subnets', 'security_groups'],
  },
  
  // Storage
  s3: {
    id: 's3',
    name: 'S3',
    description: 'Simple Storage Service - Object storage',
    color: '#569A31',
    icon: 's3',
    dependencies: [],
  },
  
  // API
  api_gateway: {
    id: 'api_gateway',
    name: 'API Gateway',
    description: 'HTTP API - RESTful API endpoint management',
    color: '#E7157B',
    icon: 'api',
    dependencies: ['lambda', 'iam'],
  },
  
  // Messaging
  sqs: {
    id: 'sqs',
    name: 'SQS',
    description: 'Simple Queue Service - Message queuing',
    color: '#FF4F8B',
    icon: 'sqs',
    dependencies: ['iam'],
  },
  sns: {
    id: 'sns',
    name: 'SNS',
    description: 'Simple Notification Service - Pub/sub messaging',
    color: '#FF4F8B',
    icon: 'sns',
    dependencies: ['iam'],
  },
  
  // Events
  eventbridge: {
    id: 'eventbridge',
    name: 'EventBridge',
    description: 'Serverless event bus for application integration',
    color: '#FF4F8B',
    icon: 'eventbridge',
    dependencies: [],
  },
  
  // Delivery
  cloudfront: {
    id: 'cloudfront',
    name: 'CloudFront',
    description: 'Content Delivery Network - Global edge caching',
    color: '#8C4FFF',
    icon: 'cloudfront',
    dependencies: ['s3'],
  },
  ses: {
    id: 'ses',
    name: 'SES',
    description: 'Simple Email Service - Transactional email',
    color: '#DD344C',
    icon: 'ses',
    dependencies: ['iam'],
  },
  
  // Observability
  cloudwatch: {
    id: 'cloudwatch',
    name: 'CloudWatch',
    description: 'Monitoring, logging, and alerting',
    color: '#FF4F8B',
    icon: 'cloudwatch',
    dependencies: [],
  },
  
  // Identity
  iam: {
    id: 'iam',
    name: 'IAM',
    description: 'Identity and Access Management - Roles and policies',
    color: '#DD344C',
    icon: 'iam',
    dependencies: [],
  },
};

// =============================================================================
// Service Categories for UI
// =============================================================================

export const SERVICE_CATEGORIES: ServiceCategory[] = [
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
    services: ['sqs', 'sns'],
  },
  {
    name: 'Events',
    services: ['eventbridge'],
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

// =============================================================================
// Dependency Resolution Functions
// =============================================================================

/**
 * Get all dependencies for a service (recursive)
 */
export function getAllDependencies(service: ServiceType): ServiceType[] {
  const deps = new Set<ServiceType>();
  const queue = [...DEPENDENCY_GRAPH[service]];
  
  while (queue.length > 0) {
    const dep = queue.shift()!;
    if (!deps.has(dep)) {
      deps.add(dep);
      queue.push(...DEPENDENCY_GRAPH[dep]);
    }
  }
  
  return Array.from(deps);
}

/**
 * Get all services that depend on a given service (recursive)
 */
export function getAllDependents(service: ServiceType): ServiceType[] {
  const dependents = new Set<ServiceType>();
  const queue = [...DEPENDENTS_GRAPH[service]];
  
  while (queue.length > 0) {
    const dep = queue.shift()!;
    if (!dependents.has(dep)) {
      dependents.add(dep);
      queue.push(...DEPENDENTS_GRAPH[dep]);
    }
  }
  
  return Array.from(dependents);
}

/**
 * Check if all dependencies for a service are enabled
 */
export function areDependenciesMet(
  service: ServiceType,
  enabledServices: Set<ServiceType>
): boolean {
  const deps = DEPENDENCY_GRAPH[service];
  return deps.every((dep) => enabledServices.has(dep));
}

/**
 * Get missing dependencies for a service
 */
export function getMissingDependencies(
  service: ServiceType,
  enabledServices: Set<ServiceType>
): ServiceType[] {
  const deps = getAllDependencies(service);
  return deps.filter((dep) => !enabledServices.has(dep));
}

/**
 * Get services that would be affected if a service is disabled
 */
export function getAffectedServices(
  service: ServiceType,
  enabledServices: Set<ServiceType>
): ServiceType[] {
  const dependents = getAllDependents(service);
  return dependents.filter((dep) => enabledServices.has(dep));
}

// =============================================================================
// Service Order (for proper generation order)
// =============================================================================

export const SERVICE_ORDER: ServiceType[] = [
  'vpc',
  'subnets',
  'security_groups',
  'iam',
  's3',
  'rds',
  'lambda',
  'api_gateway',
  'sqs',
  'sns',
  'eventbridge',
  'cloudwatch',
  'cloudfront',
  'ses',
  'ec2',
];

export const ALL_SERVICES: ServiceType[] = [
  'vpc',
  'subnets',
  'security_groups',
  'ec2',
  'lambda',
  'rds',
  's3',
  'api_gateway',
  'sqs',
  'sns',
  'eventbridge',
  'cloudfront',
  'ses',
  'cloudwatch',
  'iam',
];
