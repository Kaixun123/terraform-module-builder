import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
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
import type { ServiceType, ProjectConfig } from '../../types';

// =============================================================================
// Custom Node Components
// =============================================================================

interface AWSNodeData {
  label: string;
  serviceType: ServiceType;
  description?: string;
}

function AWSServiceNode({ data }: { data: AWSNodeData }) {
  const metadata = SERVICE_METADATA[data.serviceType];
  
  return (
    <div
      className="px-3 py-2 rounded-lg border-2 shadow-lg min-w-[120px]"
      style={{
        backgroundColor: `${metadata.color}20`,
        borderColor: metadata.color,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded flex items-center justify-center text-white font-bold text-[10px]"
          style={{ backgroundColor: metadata.color }}
        >
          {metadata.name.slice(0, 3).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-white text-xs">{data.label}</div>
          {data.description && (
            <div className="text-[10px] text-gray-400 truncate max-w-[100px]">{data.description}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function VPCContainerNode({ data }: { data: AWSNodeData }) {
  return (
    <div
      className="px-4 py-3 rounded-lg border-2 border-dashed min-w-[450px] min-h-[280px]"
      style={{
        backgroundColor: 'rgba(255, 153, 0, 0.05)',
        borderColor: '#FF9900',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs bg-orange-500">
          VPC
        </div>
        <span className="font-semibold text-white text-sm">{data.label}</span>
      </div>
    </div>
  );
}

function SubnetNode({ data }: { data: AWSNodeData & { isPublic?: boolean } }) {
  const isPublic = data.description?.includes('Public');
  
  return (
    <div
      className="px-2 py-1.5 rounded border-2 min-w-[100px]"
      style={{
        backgroundColor: isPublic ? 'rgba(63, 134, 36, 0.2)' : 'rgba(139, 92, 246, 0.2)',
        borderColor: isPublic ? '#3F8624' : '#8B5CF6',
      }}
    >
      <div className="flex items-center gap-1.5">
        <div
          className="w-4 h-4 rounded flex items-center justify-center text-white font-bold text-[8px]"
          style={{ backgroundColor: isPublic ? '#3F8624' : '#8B5CF6' }}
        >
          SN
        </div>
        <div>
          <div className="font-medium text-white text-[10px]">{data.label}</div>
          <div className="text-[8px] text-gray-400">
            {isPublic ? 'Public' : 'Private'}
          </div>
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

  const hasAnyService = hasVPC || hasSubnets || hasSecurityGroups || hasEC2 || 
    hasLambda || hasRDS || hasS3 || hasAPIGateway || hasSQS || hasSNS || 
    hasEventBridge || hasCloudWatch || hasCloudFront || hasSES || hasIAM;

  if (!hasAnyService) {
    return { nodes, edges };
  }

  const vpcY = 80;
  const externalY = hasVPC ? 420 : 50;
  let externalX = 50;

  // VPC Node (as container)
  if (hasVPC) {
    nodes.push({
      id: 'vpc',
      type: 'vpcContainer',
      position: { x: 50, y: vpcY },
      data: {
        label: `${project.name}-vpc`,
        serviceType: 'vpc',
      },
      style: { zIndex: 0 },
    });

    // Internet Gateway
    nodes.push({
      id: 'igw',
      type: 'awsService',
      position: { x: 200, y: vpcY - 60 },
      data: {
        label: 'Internet Gateway',
        serviceType: 'vpc',
        description: 'Public Access',
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
          label: 'NAT Gateway',
          serviceType: 'subnets',
          description: 'Private → Internet',
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

  // EC2 Instance
  if (hasEC2) {
    if (hasSubnets && s.subnets?.public_subnet_cidrs.length) {
      nodes.push({
        id: 'ec2',
        type: 'awsService',
        position: { x: 20, y: 110 },
        data: {
          label: 'EC2',
          serviceType: 'ec2',
          description: s.ec2?.instance_type,
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
          label: 'EC2',
          serviceType: 'ec2',
          description: s.ec2?.instance_type,
        },
      });
      externalX += 160;
    }
  }

  // RDS Database
  if (hasRDS) {
    if (hasSubnets && s.subnets?.private_subnet_cidrs.length) {
      nodes.push({
        id: 'rds',
        type: 'awsService',
        position: { x: 150, y: 110 },
        data: {
          label: 'RDS',
          serviceType: 'rds',
          description: s.rds?.engine,
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
          label: 'RDS',
          serviceType: 'rds',
          description: s.rds?.engine,
        },
      });
      externalX += 160;
    }
  }

  // External services (outside VPC)
  let serverlessX = hasVPC ? 550 : externalX;
  const serverlessY = 80;

  // API Gateway
  if (hasAPIGateway) {
    nodes.push({
      id: 'api_gateway',
      type: 'awsService',
      position: { x: serverlessX, y: serverlessY },
      data: {
        label: 'API Gateway',
        serviceType: 'api_gateway',
        description: s.api_gateway?.name,
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

  // Lambda
  if (hasLambda) {
    const funcCount = s.lambda?.functions.length || 0;
    nodes.push({
      id: 'lambda',
      type: 'awsService',
      position: { x: serverlessX, y: serverlessY },
      data: {
        label: 'Lambda',
        serviceType: 'lambda',
        description: `${funcCount} function(s)`,
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

  // EventBridge
  if (hasEventBridge) {
    nodes.push({
      id: 'eventbridge',
      type: 'awsService',
      position: { x: serverlessX, y: serverlessY },
      data: {
        label: 'EventBridge',
        serviceType: 'eventbridge',
        description: 'Event Bus',
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

  // SQS
  if (hasSQS) {
    nodes.push({
      id: 'sqs',
      type: 'awsService',
      position: { x: messagingX, y: messagingY },
      data: {
        label: 'SQS',
        serviceType: 'sqs',
        description: `${s.sqs?.queues.length || 0} queue(s)`,
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

  // SNS
  if (hasSNS) {
    nodes.push({
      id: 'sns',
      type: 'awsService',
      position: { x: messagingX, y: messagingY },
      data: {
        label: 'SNS',
        serviceType: 'sns',
        description: `${s.sns?.topics.length || 0} topic(s)`,
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

  // S3 Bucket
  if (hasS3) {
    nodes.push({
      id: 's3',
      type: 'awsService',
      position: { x: storageX, y: storageY },
      data: {
        label: 'S3',
        serviceType: 's3',
        description: s.s3?.bucket_prefix,
      },
    });
    storageX += 160;
  }

  // CloudFront
  if (hasCloudFront) {
    nodes.push({
      id: 'cloudfront',
      type: 'awsService',
      position: { x: storageX, y: storageY },
      data: {
        label: 'CloudFront',
        serviceType: 'cloudfront',
        description: 'CDN',
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

  // IAM
  if (hasIAM) {
    nodes.push({
      id: 'iam',
      type: 'awsService',
      position: { x: storageX, y: storageY },
      data: {
        label: 'IAM',
        serviceType: 'iam',
        description: s.iam?.role_name,
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

  // CloudWatch
  if (hasCloudWatch) {
    nodes.push({
      id: 'cloudwatch',
      type: 'awsService',
      position: { x: storageX, y: storageY },
      data: {
        label: 'CloudWatch',
        serviceType: 'cloudwatch',
        description: 'Monitoring',
      },
    });
    storageX += 160;
  }

  // SES
  if (hasSES) {
    nodes.push({
      id: 'ses',
      type: 'awsService',
      position: { x: storageX, y: storageY },
      data: {
        label: 'SES',
        serviceType: 'ses',
        description: 'Email',
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

  // Security Groups (note in diagram if present)
  if (hasSecurityGroups) {
    // Security groups are implicitly shown via VPC - no separate node needed
    // They are part of the VPC infrastructure
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
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">No services selected</div>
          <div className="text-gray-600 text-sm">
            Select a template or add services to see the architecture diagram
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background color="#374151" gap={20} size={1} />
        <Controls
          className="bg-gray-800 border-gray-700"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}
