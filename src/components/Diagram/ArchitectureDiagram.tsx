import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProjectStore } from '../../stores/projectStore';
import { SERVICE_METADATA } from '../../constants/dependencies';
import { AZURE_SERVICE_METADATA } from '../../constants/azure/dependencies';
import type { ServiceType, ProjectConfig } from '../../types';

// =============================================================================
// Custom Node Components
// =============================================================================

interface AWSNodeData {
  label: string;
  serviceType: ServiceType;
  description?: string;
  isAzure?: boolean;
}

function AWSServiceNode({ data }: { data: AWSNodeData }) {
  const metadataSource = data.isAzure ? AZURE_SERVICE_METADATA : SERVICE_METADATA;
  const metadata = metadataSource[data.serviceType];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2.5 min-w-[140px] hover:shadow-md transition-shadow duration-150">
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0"
          style={{ backgroundColor: metadata.color }}
        >
          {metadata.name.slice(0, 3).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-xs leading-tight">{data.label}</div>
          {data.description && (
            <div className="text-[10px] text-gray-500 truncate max-w-[100px] mt-0.5">{data.description}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function VPCContainerNode({ data }: { data: AWSNodeData }) {
  const badge = data.isAzure ? 'VNet' : 'VPC';

  return (
    <div
      className="px-4 py-3 rounded-2xl min-w-[450px] min-h-[280px] border-2 border-dashed"
      style={{
        backgroundColor: 'rgba(255, 153, 0, 0.04)',
        borderColor: 'rgba(255, 153, 0, 0.3)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="px-2 py-0.5 rounded-md flex items-center justify-center text-white font-bold text-[10px]"
          style={{ backgroundColor: '#FF9900' }}
        >
          {badge}
        </div>
        <span className="font-semibold text-gray-700 text-sm">{data.label}</span>
      </div>
    </div>
  );
}

function SubnetNode({ data }: { data: AWSNodeData & { isPublic?: boolean } }) {
  const isPublic = data.description?.includes('Public');
  const color = isPublic ? '#3F8624' : '#8B5CF6';

  return (
    <div
      className="px-2.5 py-2 rounded-lg min-w-[100px] border"
      style={{
        backgroundColor: isPublic ? 'rgba(63, 134, 36, 0.08)' : 'rgba(139, 92, 246, 0.08)',
        borderColor: `${color}35`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <div
          className="w-4 h-4 rounded flex items-center justify-center text-white font-bold text-[8px]"
          style={{ backgroundColor: color }}
        >
          SN
        </div>
        <div>
          <div className="font-medium text-gray-800 text-[10px]">{data.label}</div>
          <div className="text-[9px] text-gray-500">{isPublic ? 'Public' : 'Private'}</div>
        </div>
      </div>
    </div>
  );
}

// Node types registry
const nodeTypes: NodeTypes = {
  awsService: AWSServiceNode,
  vpcContainer: VPCContainerNode,
  subnet: SubnetNode,
};

// =============================================================================
// Diagram Layout Logic
// =============================================================================

function generateDiagramElements(project: ProjectConfig): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const s = project.services;
  const isAzure = project.provider === 'azure';
  const hasVPC = s.vpc !== null;
  const hasSubnets = s.subnets !== null;
  const hasSecurityGroups = s.security_groups !== null;
  const hasEC2 = s.ec2 !== null;
  const hasLambda = s.lambda !== null;
  const hasRDS = s.rds !== null;
  const hasS3 = s.s3 !== null;
  const hasAPIGateway = s.api_gateway !== null;
  const hasSQS = s.sqs !== null;
  const hasSNS = s.sns !== null;
  const hasEventBridge = s.eventbridge !== null;
  const hasCloudWatch = s.cloudwatch !== null;
  const hasCloudFront = s.cloudfront !== null;
  const hasSES = s.ses !== null;
  const hasIAM = s.iam !== null;
  const hasNAT = hasSubnets && s.subnets?.create_nat_gateway;

  // Service labels based on provider
  const serviceNames = isAzure ? {
    vpc: 'Virtual Network',
    igw: 'Internet Access',
    natGateway: 'NAT Gateway',
    ec2: 'Virtual Machine',
    lambda: 'Azure Functions',
    rds: 'Azure Database',
    s3: 'Storage Account',
    apiGateway: 'API Management',
    sqs: 'Service Bus Queue',
    sns: 'Service Bus Topic',
    eventbridge: 'Event Grid',
    cloudwatch: 'Azure Monitor',
    cloudfront: 'Azure CDN',
    ses: 'Communication Svc',
    iam: 'Managed Identity',
  } : {
    vpc: 'VPC',
    igw: 'Internet Gateway',
    natGateway: 'NAT Gateway',
    ec2: 'EC2 Instance',
    lambda: 'Lambda',
    rds: 'RDS',
    s3: 'S3 Bucket',
    apiGateway: 'API Gateway',
    sqs: 'SQS Queue',
    sns: 'SNS Topic',
    eventbridge: 'EventBridge',
    cloudwatch: 'CloudWatch',
    cloudfront: 'CloudFront',
    ses: 'SES',
    iam: 'IAM Role',
  };

  const hasAnyService = hasVPC || hasSubnets || hasSecurityGroups || hasEC2 ||
    hasLambda || hasRDS || hasS3 || hasAPIGateway || hasSQS || hasSNS ||
    hasEventBridge || hasCloudWatch || hasCloudFront || hasSES || hasIAM;

  if (!hasAnyService) {
    return { nodes, edges };
  }

  const vpcY = 80;
  const externalY = hasVPC ? 420 : 50;
  let externalX = 50;

  // VPC / VNet container
  if (hasVPC) {
    nodes.push({
      id: 'vpc',
      type: 'vpcContainer',
      position: { x: 50, y: vpcY },
      data: {
        label: `${project.name}-${isAzure ? 'vnet' : 'vpc'}`,
        serviceType: 'vpc',
        isAzure,
      },
      style: { zIndex: 0 },
    });

    // Internet Gateway / Internet Access
    nodes.push({
      id: 'igw',
      type: 'awsService',
      position: { x: 200, y: vpcY - 60 },
      data: {
        label: serviceNames.igw,
        serviceType: 'vpc',
        description: 'Public Access',
        isAzure,
      },
    });

    edges.push({
      id: 'igw-vpc',
      source: 'igw',
      target: 'vpc',
      animated: true,
      style: { stroke: '#FF9900' },
    });
  }

  // Subnets
  if (hasSubnets && s.subnets) {
    const publicCidrs = s.subnets.public_subnet_cidrs;
    const privateCidrs = s.subnets.private_subnet_cidrs;

    // Public subnets
    publicCidrs.forEach((cidr: string, index: number) => {
      const nodeId = `public-subnet-${index}`;
      nodes.push({
        id: nodeId,
        type: 'subnet',
        position: { x: 20 + index * 130, y: 50 },
        data: {
          label: `Pub ${index + 1}`,
          serviceType: 'subnets',
          description: `Public - ${cidr}`,
          isAzure,
        },
        parentId: hasVPC ? 'vpc' : undefined,
        extent: hasVPC ? 'parent' : undefined,
      });
    });

    // Private subnets
    privateCidrs.forEach((cidr: string, index: number) => {
      const nodeId = `private-subnet-${index}`;
      nodes.push({
        id: nodeId,
        type: 'subnet',
        position: { x: 20 + index * 130, y: 180 },
        data: {
          label: `Priv ${index + 1}`,
          serviceType: 'subnets',
          description: `Private - ${cidr}`,
          isAzure,
        },
        parentId: hasVPC ? 'vpc' : undefined,
        extent: hasVPC ? 'parent' : undefined,
      });
    });

    // NAT Gateway
    if (hasNAT) {
      nodes.push({
        id: 'nat',
        type: 'awsService',
        position: { x: 300, y: 110 },
        data: {
          label: serviceNames.natGateway,
          serviceType: 'subnets',
          description: 'Private → Internet',
          isAzure,
        },
        parentId: hasVPC ? 'vpc' : undefined,
        extent: hasVPC ? 'parent' : undefined,
      });

      if (publicCidrs.length > 0) {
        edges.push({
          id: 'nat-public',
          source: 'nat',
          target: 'public-subnet-0',
          style: { stroke: '#8C4FFF' },
        });
      }

      privateCidrs.forEach((_: string, index: number) => {
        edges.push({
          id: `private-${index}-nat`,
          source: `private-subnet-${index}`,
          target: 'nat',
          style: { stroke: '#8C4FFF' },
        });
      });
    }
  }

  // EC2 / Virtual Machine
  if (hasEC2) {
    if (hasSubnets && s.subnets?.public_subnet_cidrs.length) {
      nodes.push({
        id: 'ec2',
        type: 'awsService',
        position: { x: 20, y: 110 },
        data: {
          label: serviceNames.ec2,
          serviceType: 'ec2',
          description: s.ec2?.instance_type,
          isAzure,
        },
        parentId: hasVPC ? 'vpc' : undefined,
        extent: hasVPC ? 'parent' : undefined,
      });
      edges.push({
        id: 'ec2-subnet',
        source: 'ec2',
        target: 'public-subnet-0',
        style: { stroke: '#FF9900' },
      });
    } else {
      nodes.push({
        id: 'ec2',
        type: 'awsService',
        position: { x: externalX, y: externalY },
        data: {
          label: serviceNames.ec2,
          serviceType: 'ec2',
          description: s.ec2?.instance_type,
          isAzure,
        },
      });
      externalX += 160;
    }
  }

  // RDS / Azure Database
  if (hasRDS) {
    if (hasSubnets && s.subnets?.private_subnet_cidrs.length) {
      nodes.push({
        id: 'rds',
        type: 'awsService',
        position: { x: 150, y: 110 },
        data: {
          label: serviceNames.rds,
          serviceType: 'rds',
          description: s.rds?.engine,
          isAzure,
        },
        parentId: hasVPC ? 'vpc' : undefined,
        extent: hasVPC ? 'parent' : undefined,
      });
      edges.push({
        id: 'rds-subnet',
        source: 'rds',
        target: 'private-subnet-0',
        style: { stroke: '#3B48CC' },
      });
    } else {
      nodes.push({
        id: 'rds',
        type: 'awsService',
        position: { x: externalX, y: externalY },
        data: {
          label: serviceNames.rds,
          serviceType: 'rds',
          description: s.rds?.engine,
          isAzure,
        },
      });
      externalX += 160;
    }
  }

  // External services (outside VPC)
  let serverlessX = hasVPC ? 550 : externalX;
  const serverlessY = 80;

  // API Gateway / API Management
  if (hasAPIGateway) {
    nodes.push({
      id: 'api_gateway',
      type: 'awsService',
      position: { x: serverlessX, y: serverlessY },
      data: {
        label: serviceNames.apiGateway,
        serviceType: 'api_gateway',
        description: s.api_gateway?.name,
        isAzure,
      },
    });
    serverlessX += 160;

    if (hasLambda) {
      edges.push({
        id: 'apigw-lambda',
        source: 'api_gateway',
        target: 'lambda',
        animated: true,
        style: { stroke: '#E7157B' },
      });
    }
  }

  // Lambda / Azure Functions
  if (hasLambda) {
    const funcCount = s.lambda?.functions.length || 0;
    nodes.push({
      id: 'lambda',
      type: 'awsService',
      position: { x: serverlessX, y: serverlessY },
      data: {
        label: serviceNames.lambda,
        serviceType: 'lambda',
        description: `${funcCount} function(s)`,
        isAzure,
      },
    });
    serverlessX += 160;

    if (hasRDS) {
      edges.push({
        id: 'lambda-rds',
        source: 'lambda',
        target: 'rds',
        animated: true,
        style: { stroke: '#3B48CC' },
      });
    }
  }

  // EventBridge / Event Grid
  if (hasEventBridge) {
    nodes.push({
      id: 'eventbridge',
      type: 'awsService',
      position: { x: serverlessX, y: serverlessY },
      data: {
        label: serviceNames.eventbridge,
        serviceType: 'eventbridge',
        description: 'Event Bus',
        isAzure,
      },
    });
    serverlessX += 160;

    if (hasLambda) {
      edges.push({
        id: 'eb-lambda',
        source: 'eventbridge',
        target: 'lambda',
        animated: true,
        style: { stroke: '#FF4F8B' },
      });
    }
  }

  // Messaging row
  let messagingX = hasVPC ? 550 : externalX;
  const messagingY = serverlessY + 100;

  // SQS / Service Bus Queue
  if (hasSQS) {
    nodes.push({
      id: 'sqs',
      type: 'awsService',
      position: { x: messagingX, y: messagingY },
      data: {
        label: serviceNames.sqs,
        serviceType: 'sqs',
        description: `${s.sqs?.queues.length || 0} queue(s)`,
        isAzure,
      },
    });
    messagingX += 160;

    if (hasLambda) {
      edges.push({
        id: 'sqs-lambda',
        source: 'sqs',
        target: 'lambda',
        animated: true,
        style: { stroke: '#FF4F8B' },
      });
    }
  }

  // SNS / Service Bus Topic
  if (hasSNS) {
    nodes.push({
      id: 'sns',
      type: 'awsService',
      position: { x: messagingX, y: messagingY },
      data: {
        label: serviceNames.sns,
        serviceType: 'sns',
        description: `${s.sns?.topics.length || 0} topic(s)`,
        isAzure,
      },
    });
    messagingX += 160;

    if (hasSQS) {
      edges.push({
        id: 'sns-sqs',
        source: 'sns',
        target: 'sqs',
        style: { stroke: '#FF4F8B' },
      });
    }
  }

  // Storage / CDN row
  let storageX = externalX;
  const storageY = externalY;

  // S3 / Storage Account
  if (hasS3) {
    nodes.push({
      id: 's3',
      type: 'awsService',
      position: { x: storageX, y: storageY },
      data: {
        label: serviceNames.s3,
        serviceType: 's3',
        description: s.s3?.bucket_prefix,
        isAzure,
      },
    });
    storageX += 160;
  }

  // CloudFront / Azure CDN
  if (hasCloudFront) {
    nodes.push({
      id: 'cloudfront',
      type: 'awsService',
      position: { x: storageX, y: storageY },
      data: {
        label: serviceNames.cloudfront,
        serviceType: 'cloudfront',
        description: 'CDN',
        isAzure,
      },
    });
    storageX += 160;

    if (hasS3) {
      edges.push({
        id: 'cf-s3',
        source: 'cloudfront',
        target: 's3',
        animated: true,
        style: { stroke: '#8C4FFF' },
      });
    }
  }

  // IAM / Managed Identity
  if (hasIAM) {
    nodes.push({
      id: 'iam',
      type: 'awsService',
      position: { x: storageX, y: storageY },
      data: {
        label: serviceNames.iam,
        serviceType: 'iam',
        description: s.iam?.role_name,
        isAzure,
      },
    });
    storageX += 160;

    if (hasEC2) {
      edges.push({
        id: 'ec2-iam',
        source: 'ec2',
        target: 'iam',
        animated: true,
        style: { stroke: '#DD344C' },
      });
    }
    if (hasLambda) {
      edges.push({
        id: 'lambda-iam',
        source: 'lambda',
        target: 'iam',
        animated: true,
        style: { stroke: '#DD344C' },
      });
    }
  }

  // CloudWatch / Azure Monitor
  if (hasCloudWatch) {
    nodes.push({
      id: 'cloudwatch',
      type: 'awsService',
      position: { x: storageX, y: storageY },
      data: {
        label: serviceNames.cloudwatch,
        serviceType: 'cloudwatch',
        description: 'Monitoring',
        isAzure,
      },
    });
    storageX += 160;
  }

  // SES / Communication Services
  if (hasSES) {
    nodes.push({
      id: 'ses',
      type: 'awsService',
      position: { x: storageX, y: storageY },
      data: {
        label: serviceNames.ses,
        serviceType: 'ses',
        description: 'Email',
        isAzure,
      },
    });
    storageX += 160;

    if (hasLambda) {
      edges.push({
        id: 'lambda-ses',
        source: 'lambda',
        target: 'ses',
        style: { stroke: '#DD344C' },
      });
    }
  }

  return { nodes, edges };
}

// =============================================================================
// Main Component
// =============================================================================

export default function ArchitectureDiagram() {
  const { project } = useProjectStore();

  // Generate nodes and edges based on project configuration
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => generateDiagramElements(project),
    [project]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when project changes
  useMemo(() => {
    const { nodes: newNodes, edges: newEdges } = generateDiagramElements(project);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [project, setNodes, setEdges]);

  const hasAnyService = Object.values(project.services).some(s => s !== null);

  if (!hasAnyService) {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center rounded-2xl bg-white border border-gray-200 shadow-sm px-8 py-10 max-w-sm">
          <div className="text-gray-500 text-base font-medium mb-2">No services selected</div>
          <div className="text-gray-400 text-sm">
            Select a template or add services to see the architecture diagram
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background color="#D1D5DB" gap={20} size={1} variant={BackgroundVariant.Dots} />
        <Controls
          className="!bg-white !rounded-xl !shadow-sm !border !border-gray-200 !p-1"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}
