import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import {
  AWS_REGIONS,
  ENVIRONMENTS,
  INSTANCE_TYPES,
  AVAILABILITY_ZONES,
  RDS_ENGINES,
  RDS_ENGINE_VERSIONS,
  RDS_INSTANCE_CLASSES,
  LAMBDA_RUNTIMES,
  LAMBDA_ARCHITECTURES,
  LAMBDA_MEMORY_SIZES,
  CLOUDFRONT_PRICE_CLASSES,
} from '../../constants/defaults';
import { SERVICE_METADATA } from '../../constants/dependencies';

// Validation helpers
const isValidProjectName = (name: string) => /^[a-z0-9-]{3,32}$/.test(name);
const isValidCIDR = (cidr: string) =>
  /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(cidr);
const isValidBucketPrefix = (prefix: string) =>
  /^[a-z0-9-]{3,37}$/.test(prefix);

// Collapsible Section Component
function Section({
  title,
  color,
  children,
  defaultOpen = true,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-750 hover:bg-gray-700 transition-colors"
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium text-white text-sm flex-1 text-left">
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && <div className="p-3 space-y-3 bg-gray-800/50">{children}</div>}
    </div>
  );
}

// Input Field Component
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export default function ConfigPanel() {
  const { project, updateProjectName, updateRegion, updateEnvironment, updateServiceConfig } =
    useProjectStore();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string, validator: (v: string) => boolean, message: string) => {
    if (!validator(value)) {
      setErrors((prev) => ({ ...prev, [field]: message }));
      return false;
    }
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    return true;
  };

  const inputClass =
    'w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
  const selectClass =
    'w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  const availableAZs = AVAILABILITY_ZONES[project.region] || [];

  // Check if any services are enabled
  const hasAnyService = Object.values(project.services).some(s => s !== null);

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
        Configuration
      </h2>
      <div className="space-y-3">
        {/* Project Settings */}
        <Section title="Project Settings" color="#6366f1" defaultOpen={true}>
          <Field
            label="Project Name"
            error={errors.projectName}
          >
            <input
              type="text"
              value={project.name}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                updateProjectName(value);
                validateField(
                  'projectName',
                  value,
                  isValidProjectName,
                  'Must be 3-32 lowercase alphanumeric characters or hyphens'
                );
              }}
              className={inputClass}
              placeholder="my-terraform-project"
            />
          </Field>

          <Field label="AWS Region">
            <select
              value={project.region}
              onChange={(e) => updateRegion(e.target.value)}
              className={selectClass}
            >
              {AWS_REGIONS.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Environment">
            <select
              value={project.environment}
              onChange={(e) => updateEnvironment(e.target.value)}
              className={selectClass}
            >
              {ENVIRONMENTS.map((env) => (
                <option key={env.value} value={env.value}>
                  {env.label}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        {/* VPC Configuration */}
        {project.services.vpc && (
          <Section title="VPC" color={SERVICE_METADATA.vpc.color}>
            <Field label="CIDR Block" error={errors.vpcCidr}>
              <input
                type="text"
                value={project.services.vpc.cidr_block}
                onChange={(e) => {
                  updateServiceConfig('vpc', { cidr_block: e.target.value });
                  validateField(
                    'vpcCidr',
                    e.target.value,
                    isValidCIDR,
                    'Invalid CIDR notation (e.g., 10.0.0.0/16)'
                  );
                }}
                className={inputClass}
                placeholder="10.0.0.0/16"
              />
            </Field>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={project.services.vpc.enable_dns_hostnames}
                  onChange={(e) =>
                    updateServiceConfig('vpc', {
                      enable_dns_hostnames: e.target.checked,
                    })
                  }
                  className="rounded text-blue-500 bg-gray-700 border-gray-600"
                />
                DNS Hostnames
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={project.services.vpc.enable_dns_support}
                  onChange={(e) =>
                    updateServiceConfig('vpc', {
                      enable_dns_support: e.target.checked,
                    })
                  }
                  className="rounded text-blue-500 bg-gray-700 border-gray-600"
                />
                DNS Support
              </label>
            </div>
          </Section>
        )}

        {/* Subnets Configuration */}
        {project.services.subnets && (
          <Section title="Subnets" color={SERVICE_METADATA.subnets.color}>
            <Field label="Public Subnet CIDRs (comma-separated)">
              <input
                type="text"
                value={project.services.subnets.public_subnet_cidrs.join(', ')}
                onChange={(e) => {
                  const cidrs = e.target.value
                    .split(',')
                    .map((c) => c.trim())
                    .filter((c) => c);
                  updateServiceConfig('subnets', { public_subnet_cidrs: cidrs });
                }}
                className={inputClass}
                placeholder="10.0.1.0/24, 10.0.2.0/24"
              />
            </Field>

            <Field label="Private Subnet CIDRs (comma-separated)">
              <input
                type="text"
                value={project.services.subnets.private_subnet_cidrs.join(', ')}
                onChange={(e) => {
                  const cidrs = e.target.value
                    .split(',')
                    .map((c) => c.trim())
                    .filter((c) => c);
                  updateServiceConfig('subnets', { private_subnet_cidrs: cidrs });
                }}
                className={inputClass}
                placeholder="10.0.10.0/24, 10.0.11.0/24"
              />
            </Field>

            <Field label="Availability Zones">
              <div className="flex flex-wrap gap-2">
                {availableAZs.slice(0, 4).map((az) => (
                  <label
                    key={az}
                    className="flex items-center gap-1.5 text-xs text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={project.services.subnets!.availability_zones.includes(az)}
                      onChange={(e) => {
                        const currentAZs = project.services.subnets!.availability_zones;
                        const newAZs = e.target.checked
                          ? [...currentAZs, az]
                          : currentAZs.filter((a) => a !== az);
                        if (newAZs.length > 0) {
                          updateServiceConfig('subnets', { availability_zones: newAZs });
                        }
                      }}
                      className="rounded text-blue-500 bg-gray-700 border-gray-600"
                    />
                    {az}
                  </label>
                ))}
              </div>
            </Field>

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={project.services.subnets.create_nat_gateway}
                onChange={(e) =>
                  updateServiceConfig('subnets', {
                    create_nat_gateway: e.target.checked,
                  })
                }
                className="rounded text-blue-500 bg-gray-700 border-gray-600"
              />
              Create NAT Gateway
            </label>
          </Section>
        )}

        {/* Security Groups Configuration */}
        {project.services.security_groups && (
          <Section title="Security Groups" color={SERVICE_METADATA.security_groups.color} defaultOpen={false}>
            <p className="text-xs text-gray-400">
              {project.services.security_groups.groups.length} security group(s) configured.
              Groups: {project.services.security_groups.groups.map(g => g.name).join(', ')}
            </p>
          </Section>
        )}

        {/* EC2 Configuration */}
        {project.services.ec2 && (
          <Section title="EC2" color={SERVICE_METADATA.ec2.color}>
            <Field label="Instance Type">
              <select
                value={project.services.ec2.instance_type}
                onChange={(e) =>
                  updateServiceConfig('ec2', { instance_type: e.target.value })
                }
                className={selectClass}
              >
                {INSTANCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Key Pair Name (optional)">
              <input
                type="text"
                value={project.services.ec2.key_pair_name}
                onChange={(e) =>
                  updateServiceConfig('ec2', { key_pair_name: e.target.value })
                }
                className={inputClass}
                placeholder="my-key-pair"
              />
            </Field>

            <Field label="Root Volume Size (GB)">
              <input
                type="number"
                min={8}
                max={1000}
                value={project.services.ec2.root_volume_size}
                onChange={(e) =>
                  updateServiceConfig('ec2', {
                    root_volume_size: parseInt(e.target.value) || 20,
                  })
                }
                className={inputClass}
              />
            </Field>

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={project.services.ec2.associate_public_ip}
                onChange={(e) =>
                  updateServiceConfig('ec2', {
                    associate_public_ip: e.target.checked,
                  })
                }
                className="rounded text-blue-500 bg-gray-700 border-gray-600"
              />
              Associate Public IP Address
            </label>
          </Section>
        )}

        {/* Lambda Configuration */}
        {project.services.lambda && (
          <Section title="Lambda" color={SERVICE_METADATA.lambda.color} defaultOpen={false}>
            <p className="text-xs text-gray-500 mb-2">
              {project.services.lambda.functions.length} function(s) configured
            </p>
            {project.services.lambda.functions.map((func, index) => (
              <div key={index} className="border border-gray-600 rounded p-2 space-y-2">
                <Field label="Function Name">
                  <input
                    type="text"
                    value={func.name}
                    onChange={(e) => {
                      const newFunctions = [...project.services.lambda!.functions];
                      newFunctions[index] = { ...func, name: e.target.value };
                      updateServiceConfig('lambda', { functions: newFunctions });
                    }}
                    className={inputClass}
                  />
                </Field>
                <Field label="Runtime">
                  <select
                    value={func.runtime}
                    onChange={(e) => {
                      const newFunctions = [...project.services.lambda!.functions];
                      newFunctions[index] = { ...func, runtime: e.target.value as typeof func.runtime };
                      updateServiceConfig('lambda', { functions: newFunctions });
                    }}
                    className={selectClass}
                  >
                    {LAMBDA_RUNTIMES.map((rt) => (
                      <option key={rt.value} value={rt.value}>{rt.label}</option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Memory (MB)">
                    <select
                      value={func.memory_size}
                      onChange={(e) => {
                        const newFunctions = [...project.services.lambda!.functions];
                        newFunctions[index] = { ...func, memory_size: parseInt(e.target.value) };
                        updateServiceConfig('lambda', { functions: newFunctions });
                      }}
                      className={selectClass}
                    >
                      {LAMBDA_MEMORY_SIZES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Timeout (sec)">
                    <input
                      type="number"
                      min={1}
                      max={900}
                      value={func.timeout}
                      onChange={(e) => {
                        const newFunctions = [...project.services.lambda!.functions];
                        newFunctions[index] = { ...func, timeout: parseInt(e.target.value) || 30 };
                        updateServiceConfig('lambda', { functions: newFunctions });
                      }}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label="Architecture">
                  <select
                    value={func.architecture}
                    onChange={(e) => {
                      const newFunctions = [...project.services.lambda!.functions];
                      newFunctions[index] = { ...func, architecture: e.target.value as typeof func.architecture };
                      updateServiceConfig('lambda', { functions: newFunctions });
                    }}
                    className={selectClass}
                  >
                    {LAMBDA_ARCHITECTURES.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </Field>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={func.vpc_enabled}
                    onChange={(e) => {
                      const newFunctions = [...project.services.lambda!.functions];
                      newFunctions[index] = { ...func, vpc_enabled: e.target.checked };
                      updateServiceConfig('lambda', { functions: newFunctions });
                    }}
                    className="rounded text-blue-500 bg-gray-700 border-gray-600"
                  />
                  Deploy in VPC
                </label>
              </div>
            ))}
          </Section>
        )}

        {/* RDS Configuration */}
        {project.services.rds && (
          <Section title="RDS" color={SERVICE_METADATA.rds.color} defaultOpen={false}>
            <Field label="Database Engine">
              <select
                value={project.services.rds.engine}
                onChange={(e) => {
                  const engine = e.target.value as 'postgres' | 'mysql' | 'mariadb';
                  const defaultVersion = RDS_ENGINES.find(eng => eng.value === engine)?.defaultVersion || '15.4';
                  updateServiceConfig('rds', { engine, engine_version: defaultVersion });
                }}
                className={selectClass}
              >
                {RDS_ENGINES.map((eng) => (
                  <option key={eng.value} value={eng.value}>{eng.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Engine Version">
              <select
                value={project.services.rds.engine_version}
                onChange={(e) => updateServiceConfig('rds', { engine_version: e.target.value })}
                className={selectClass}
              >
                {RDS_ENGINE_VERSIONS[project.services.rds.engine]?.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Instance Class">
              <select
                value={project.services.rds.instance_class}
                onChange={(e) => updateServiceConfig('rds', { instance_class: e.target.value })}
                className={selectClass}
              >
                {RDS_INSTANCE_CLASSES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Storage (GB)">
                <input
                  type="number"
                  min={20}
                  max={65536}
                  value={project.services.rds.allocated_storage}
                  onChange={(e) => updateServiceConfig('rds', { allocated_storage: parseInt(e.target.value) || 20 })}
                  className={inputClass}
                />
              </Field>
              <Field label="Max Storage (GB)">
                <input
                  type="number"
                  min={20}
                  max={65536}
                  value={project.services.rds.max_allocated_storage}
                  onChange={(e) => updateServiceConfig('rds', { max_allocated_storage: parseInt(e.target.value) || 100 })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Database Name">
              <input
                type="text"
                value={project.services.rds.database_name}
                onChange={(e) => updateServiceConfig('rds', { database_name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={project.services.rds.multi_az}
                  onChange={(e) => updateServiceConfig('rds', { multi_az: e.target.checked })}
                  className="rounded text-blue-500 bg-gray-700 border-gray-600"
                />
                Multi-AZ Deployment
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={project.services.rds.storage_encrypted}
                  onChange={(e) => updateServiceConfig('rds', { storage_encrypted: e.target.checked })}
                  className="rounded text-blue-500 bg-gray-700 border-gray-600"
                />
                Encrypt Storage
              </label>
            </div>
          </Section>
        )}

        {/* S3 Configuration */}
        {project.services.s3 && (
          <Section title="S3" color={SERVICE_METADATA.s3.color}>
            <Field label="Bucket Prefix" error={errors.bucketPrefix}>
              <input
                type="text"
                value={project.services.s3.bucket_prefix}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  updateServiceConfig('s3', { bucket_prefix: value });
                  validateField(
                    'bucketPrefix',
                    value,
                    isValidBucketPrefix,
                    'Must be 3-37 lowercase alphanumeric characters or hyphens'
                  );
                }}
                className={inputClass}
                placeholder="my-app"
              />
            </Field>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={project.services.s3.versioning_enabled}
                  onChange={(e) =>
                    updateServiceConfig('s3', {
                      versioning_enabled: e.target.checked,
                    })
                  }
                  className="rounded text-blue-500 bg-gray-700 border-gray-600"
                />
                Enable Versioning
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={project.services.s3.encryption_enabled}
                  onChange={(e) =>
                    updateServiceConfig('s3', {
                      encryption_enabled: e.target.checked,
                    })
                  }
                  className="rounded text-blue-500 bg-gray-700 border-gray-600"
                />
                Enable Server-Side Encryption
              </label>
            </div>
          </Section>
        )}

        {/* API Gateway Configuration */}
        {project.services.api_gateway && (
          <Section title="API Gateway" color={SERVICE_METADATA.api_gateway.color} defaultOpen={false}>
            <Field label="API Name">
              <input
                type="text"
                value={project.services.api_gateway.name}
                onChange={(e) => updateServiceConfig('api_gateway', { name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={project.services.api_gateway.cors_enabled}
                onChange={(e) => updateServiceConfig('api_gateway', { cors_enabled: e.target.checked })}
                className="rounded text-blue-500 bg-gray-700 border-gray-600"
              />
              Enable CORS
            </label>
            <p className="text-xs text-gray-500">
              {project.services.api_gateway.routes.length} route(s) configured
            </p>
          </Section>
        )}

        {/* SQS Configuration */}
        {project.services.sqs && (
          <Section title="SQS" color={SERVICE_METADATA.sqs.color} defaultOpen={false}>
            <p className="text-xs text-gray-500">
              {project.services.sqs.queues.length} queue(s) configured:
              {' '}{project.services.sqs.queues.map(q => q.name).join(', ')}
            </p>
          </Section>
        )}

        {/* SNS Configuration */}
        {project.services.sns && (
          <Section title="SNS" color={SERVICE_METADATA.sns.color} defaultOpen={false}>
            <p className="text-xs text-gray-500">
              {project.services.sns.topics.length} topic(s) configured:
              {' '}{project.services.sns.topics.map(t => t.name).join(', ')}
            </p>
          </Section>
        )}

        {/* EventBridge Configuration */}
        {project.services.eventbridge && (
          <Section title="EventBridge" color={SERVICE_METADATA.eventbridge.color} defaultOpen={false}>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={project.services.eventbridge.use_default_bus}
                onChange={(e) => updateServiceConfig('eventbridge', { use_default_bus: e.target.checked })}
                className="rounded text-blue-500 bg-gray-700 border-gray-600"
              />
              Use Default Event Bus
            </label>
            <p className="text-xs text-gray-500 mt-2">
              {project.services.eventbridge.rules.length} rule(s) configured
            </p>
          </Section>
        )}

        {/* CloudWatch Configuration */}
        {project.services.cloudwatch && (
          <Section title="CloudWatch" color={SERVICE_METADATA.cloudwatch.color} defaultOpen={false}>
            <p className="text-xs text-gray-500">
              {project.services.cloudwatch.log_groups.length} log group(s),
              {' '}{project.services.cloudwatch.alarms.length} alarm(s) configured
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-300 mt-2">
              <input
                type="checkbox"
                checked={project.services.cloudwatch.dashboard_enabled}
                onChange={(e) => updateServiceConfig('cloudwatch', { dashboard_enabled: e.target.checked })}
                className="rounded text-blue-500 bg-gray-700 border-gray-600"
              />
              Create Dashboard
            </label>
          </Section>
        )}

        {/* CloudFront Configuration */}
        {project.services.cloudfront && (
          <Section title="CloudFront" color={SERVICE_METADATA.cloudfront.color} defaultOpen={false}>
            <Field label="Default Root Object">
              <input
                type="text"
                value={project.services.cloudfront.default_root_object}
                onChange={(e) => updateServiceConfig('cloudfront', { default_root_object: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Price Class">
              <select
                value={project.services.cloudfront.price_class}
                onChange={(e) => updateServiceConfig('cloudfront', { price_class: e.target.value as 'PriceClass_100' | 'PriceClass_200' | 'PriceClass_All' })}
                className={selectClass}
              >
                {CLOUDFRONT_PRICE_CLASSES.map((pc) => (
                  <option key={pc.value} value={pc.value}>{pc.label}</option>
                ))}
              </select>
            </Field>
          </Section>
        )}

        {/* SES Configuration */}
        {project.services.ses && (
          <Section title="SES" color={SERVICE_METADATA.ses.color} defaultOpen={false}>
            <Field label="Domain Identity (optional)">
              <input
                type="text"
                value={project.services.ses.domain_identity || ''}
                onChange={(e) => updateServiceConfig('ses', { domain_identity: e.target.value || undefined })}
                className={inputClass}
                placeholder="example.com"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={project.services.ses.create_smtp_credentials}
                onChange={(e) => updateServiceConfig('ses', { create_smtp_credentials: e.target.checked })}
                className="rounded text-blue-500 bg-gray-700 border-gray-600"
              />
              Create SMTP Credentials
            </label>
          </Section>
        )}

        {/* IAM Configuration */}
        {project.services.iam && (
          <Section title="IAM" color={SERVICE_METADATA.iam.color}>
            <Field label="Role Name">
              <input
                type="text"
                value={project.services.iam.role_name}
                onChange={(e) =>
                  updateServiceConfig('iam', { role_name: e.target.value })
                }
                className={inputClass}
                placeholder="my-app-role"
              />
            </Field>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={project.services.iam.create_instance_profile}
                  onChange={(e) =>
                    updateServiceConfig('iam', {
                      create_instance_profile: e.target.checked,
                    })
                  }
                  className="rounded text-blue-500 bg-gray-700 border-gray-600"
                />
                Create Instance Profile
              </label>
              {project.services.s3 && (
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={project.services.iam.s3_access}
                    onChange={(e) =>
                      updateServiceConfig('iam', { s3_access: e.target.checked })
                    }
                    className="rounded text-blue-500 bg-gray-700 border-gray-600"
                  />
                  Grant S3 Access
                </label>
              )}
            </div>
          </Section>
        )}

        {/* No services selected message */}
        {!hasAnyService && (
          <p className="text-gray-500 text-sm text-center py-4">
            Select a template or services to configure
          </p>
        )}
      </div>
    </div>
  );
}
