import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import {
  AWS_REGIONS, ENVIRONMENTS, INSTANCE_TYPES, AVAILABILITY_ZONES,
  RDS_ENGINES, RDS_ENGINE_VERSIONS, RDS_INSTANCE_CLASSES,
  LAMBDA_RUNTIMES, LAMBDA_ARCHITECTURES, LAMBDA_MEMORY_SIZES,
  CLOUDFRONT_PRICE_CLASSES,
} from '../../constants/defaults';
import { SERVICE_METADATA } from '../../constants/dependencies';
import { AZURE_SERVICE_METADATA } from '../../constants/azure/dependencies';
import { AZURE_REGIONS } from '../../constants/azure/regions';

const isValidProjectName = (name: string) => /^[a-z0-9-]{3,32}$/.test(name);
const isValidCIDR = (cidr: string) => /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(cidr);
const isValidBucketPrefix = (prefix: string) => /^[a-z0-9-]{3,37}$/.test(prefix);

function Section({
  title, color, children, defaultOpen = true,
}: {
  title: string; color: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors duration-150"
      >
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="font-medium text-gray-800 text-sm flex-1 text-left">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="p-3 space-y-3 border-t border-gray-100">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function ConfigPanel() {
  const { project, updateProjectName, updateRegion, updateEnvironment, updateServiceConfig } = useProjectStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAzure = project.provider === 'azure';
  const serviceMetadata = isAzure ? AZURE_SERVICE_METADATA : SERVICE_METADATA;
  const regions = isAzure ? AZURE_REGIONS : AWS_REGIONS;
  const availableAZs = AVAILABILITY_ZONES[project.region] || [];
  const hasAnyService = Object.values(project.services).some(s => s !== null);

  const validateField = (field: string, value: string, validator: (v: string) => boolean, message: string) => {
    if (!validator(value)) {
      setErrors((prev) => ({ ...prev, [field]: message }));
      return false;
    }
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    return true;
  };

  const inp = 'input-field';
  const sel = 'select-field';
  const chk = 'check-field';
  const chkLabel = 'flex items-center gap-2 text-sm text-gray-700 cursor-pointer';

  return (
    <div>
      <h2 className="section-label mb-3">Configuration</h2>
      <div className="space-y-2">

        {/* Project Settings */}
        <Section title="Project Settings" color="#6366f1">
          <Field label="Project Name" error={errors.projectName}>
            <input
              type="text"
              value={project.name}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                updateProjectName(value);
                validateField('projectName', value, isValidProjectName, 'Must be 3-32 lowercase alphanumeric characters or hyphens');
              }}
              className={inp}
              placeholder="my-terraform-project"
            />
          </Field>
          <Field label={isAzure ? 'Azure Region' : 'AWS Region'}>
            <select value={project.region} onChange={(e) => updateRegion(e.target.value)} className={sel}>
              {regions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Environment">
            <select value={project.environment} onChange={(e) => updateEnvironment(e.target.value)} className={sel}>
              {ENVIRONMENTS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </Field>
        </Section>

        {/* VPC */}
        {project.services.vpc && (
          <Section title="VPC" color={serviceMetadata.vpc.color}>
            <Field label="CIDR Block" error={errors.vpcCidr}>
              <input
                type="text"
                value={project.services.vpc.cidr_block}
                onChange={(e) => {
                  updateServiceConfig('vpc', { cidr_block: e.target.value });
                  validateField('vpcCidr', e.target.value, isValidCIDR, 'Invalid CIDR notation (e.g., 10.0.0.0/16)');
                }}
                className={inp}
                placeholder="10.0.0.0/16"
              />
            </Field>
            <div className="flex gap-4">
              <label className={chkLabel}>
                <input type="checkbox" checked={project.services.vpc.enable_dns_hostnames} onChange={(e) => updateServiceConfig('vpc', { enable_dns_hostnames: e.target.checked })} className={chk} />
                DNS Hostnames
              </label>
              <label className={chkLabel}>
                <input type="checkbox" checked={project.services.vpc.enable_dns_support} onChange={(e) => updateServiceConfig('vpc', { enable_dns_support: e.target.checked })} className={chk} />
                DNS Support
              </label>
            </div>
          </Section>
        )}

        {/* Subnets */}
        {project.services.subnets && (
          <Section title="Subnets" color={serviceMetadata.subnets.color}>
            <Field label="Public Subnet CIDRs (comma-separated)">
              <input type="text" value={project.services.subnets.public_subnet_cidrs.join(', ')} onChange={(e) => { const cidrs = e.target.value.split(',').map(c => c.trim()).filter(c => c); updateServiceConfig('subnets', { public_subnet_cidrs: cidrs }); }} className={inp} placeholder="10.0.1.0/24, 10.0.2.0/24" />
            </Field>
            <Field label="Private Subnet CIDRs (comma-separated)">
              <input type="text" value={project.services.subnets.private_subnet_cidrs.join(', ')} onChange={(e) => { const cidrs = e.target.value.split(',').map(c => c.trim()).filter(c => c); updateServiceConfig('subnets', { private_subnet_cidrs: cidrs }); }} className={inp} placeholder="10.0.10.0/24, 10.0.11.0/24" />
            </Field>
            <Field label="Availability Zones">
              <div className="flex flex-wrap gap-2">
                {availableAZs.slice(0, 4).map((az) => (
                  <label key={az} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={project.services.subnets!.availability_zones.includes(az)} onChange={(e) => { const current = project.services.subnets!.availability_zones; const next = e.target.checked ? [...current, az] : current.filter(a => a !== az); if (next.length > 0) updateServiceConfig('subnets', { availability_zones: next }); }} className={chk} />
                    {az}
                  </label>
                ))}
              </div>
            </Field>
            <label className={chkLabel}>
              <input type="checkbox" checked={project.services.subnets.create_nat_gateway} onChange={(e) => updateServiceConfig('subnets', { create_nat_gateway: e.target.checked })} className={chk} />
              Create NAT Gateway
            </label>
          </Section>
        )}

        {/* Security Groups */}
        {project.services.security_groups && (
          <Section title="Security Groups" color={serviceMetadata.security_groups.color} defaultOpen={false}>
            <p className="text-xs text-gray-500">
              {project.services.security_groups.groups.length} group(s): {project.services.security_groups.groups.map(g => g.name).join(', ')}
            </p>
          </Section>
        )}

        {/* EC2 */}
        {project.services.ec2 && (
          <Section title="EC2" color={serviceMetadata.ec2.color}>
            <Field label="Instance Type">
              <select value={project.services.ec2.instance_type} onChange={(e) => updateServiceConfig('ec2', { instance_type: e.target.value })} className={sel}>
                {INSTANCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Key Pair Name (optional)">
              <input type="text" value={project.services.ec2.key_pair_name} onChange={(e) => updateServiceConfig('ec2', { key_pair_name: e.target.value })} className={inp} placeholder="my-key-pair" />
            </Field>
            <Field label="Root Volume Size (GB)">
              <input type="number" min={8} max={1000} value={project.services.ec2.root_volume_size} onChange={(e) => updateServiceConfig('ec2', { root_volume_size: parseInt(e.target.value) || 20 })} className={inp} />
            </Field>
            <label className={chkLabel}>
              <input type="checkbox" checked={project.services.ec2.associate_public_ip} onChange={(e) => updateServiceConfig('ec2', { associate_public_ip: e.target.checked })} className={chk} />
              Associate Public IP Address
            </label>
          </Section>
        )}

        {/* Lambda */}
        {project.services.lambda && (
          <Section title="Lambda" color={serviceMetadata.lambda.color} defaultOpen={false}>
            <p className="text-xs text-gray-500 mb-2">{project.services.lambda.functions.length} function(s) configured</p>
            {project.services.lambda.functions.map((func, index) => (
              <div key={index} className="rounded-lg bg-gray-50 border border-gray-200 p-2.5 space-y-2">
                <Field label="Function Name">
                  <input type="text" value={func.name} onChange={(e) => { const fns = [...project.services.lambda!.functions]; fns[index] = { ...func, name: e.target.value }; updateServiceConfig('lambda', { functions: fns }); }} className={inp} />
                </Field>
                <Field label="Runtime">
                  <select value={func.runtime} onChange={(e) => { const fns = [...project.services.lambda!.functions]; fns[index] = { ...func, runtime: e.target.value as typeof func.runtime }; updateServiceConfig('lambda', { functions: fns }); }} className={sel}>
                    {LAMBDA_RUNTIMES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Memory (MB)">
                    <select value={func.memory_size} onChange={(e) => { const fns = [...project.services.lambda!.functions]; fns[index] = { ...func, memory_size: parseInt(e.target.value) }; updateServiceConfig('lambda', { functions: fns }); }} className={sel}>
                      {LAMBDA_MEMORY_SIZES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Timeout (sec)">
                    <input type="number" min={1} max={900} value={func.timeout} onChange={(e) => { const fns = [...project.services.lambda!.functions]; fns[index] = { ...func, timeout: parseInt(e.target.value) || 30 }; updateServiceConfig('lambda', { functions: fns }); }} className={inp} />
                  </Field>
                </div>
                <Field label="Architecture">
                  <select value={func.architecture} onChange={(e) => { const fns = [...project.services.lambda!.functions]; fns[index] = { ...func, architecture: e.target.value as typeof func.architecture }; updateServiceConfig('lambda', { functions: fns }); }} className={sel}>
                    {LAMBDA_ARCHITECTURES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </Field>
                <label className={chkLabel}>
                  <input type="checkbox" checked={func.vpc_enabled} onChange={(e) => { const fns = [...project.services.lambda!.functions]; fns[index] = { ...func, vpc_enabled: e.target.checked }; updateServiceConfig('lambda', { functions: fns }); }} className={chk} />
                  Deploy in VPC
                </label>
              </div>
            ))}
          </Section>
        )}

        {/* RDS */}
        {project.services.rds && (
          <Section title="RDS" color={serviceMetadata.rds.color} defaultOpen={false}>
            <Field label="Database Engine">
              <select value={project.services.rds.engine} onChange={(e) => { const engine = e.target.value as 'postgres' | 'mysql' | 'mariadb'; const defaultVersion = RDS_ENGINES.find(eng => eng.value === engine)?.defaultVersion || '15.4'; updateServiceConfig('rds', { engine, engine_version: defaultVersion }); }} className={sel}>
                {RDS_ENGINES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </Field>
            <Field label="Engine Version">
              <select value={project.services.rds.engine_version} onChange={(e) => updateServiceConfig('rds', { engine_version: e.target.value })} className={sel}>
                {RDS_ENGINE_VERSIONS[project.services.rds.engine]?.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Instance Class">
              <select value={project.services.rds.instance_class} onChange={(e) => updateServiceConfig('rds', { instance_class: e.target.value })} className={sel}>
                {RDS_INSTANCE_CLASSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Storage (GB)">
                <input type="number" min={20} max={65536} value={project.services.rds.allocated_storage} onChange={(e) => updateServiceConfig('rds', { allocated_storage: parseInt(e.target.value) || 20 })} className={inp} />
              </Field>
              <Field label="Max Storage (GB)">
                <input type="number" min={20} max={65536} value={project.services.rds.max_allocated_storage} onChange={(e) => updateServiceConfig('rds', { max_allocated_storage: parseInt(e.target.value) || 100 })} className={inp} />
              </Field>
            </div>
            <Field label="Database Name">
              <input type="text" value={project.services.rds.database_name} onChange={(e) => updateServiceConfig('rds', { database_name: e.target.value })} className={inp} />
            </Field>
            <div className="space-y-2">
              <label className={chkLabel}><input type="checkbox" checked={project.services.rds.multi_az} onChange={(e) => updateServiceConfig('rds', { multi_az: e.target.checked })} className={chk} />Multi-AZ Deployment</label>
              <label className={chkLabel}><input type="checkbox" checked={project.services.rds.storage_encrypted} onChange={(e) => updateServiceConfig('rds', { storage_encrypted: e.target.checked })} className={chk} />Encrypt Storage</label>
            </div>
          </Section>
        )}

        {/* S3 */}
        {project.services.s3 && (
          <Section title="S3" color={serviceMetadata.s3.color}>
            <Field label="Bucket Prefix" error={errors.bucketPrefix}>
              <input type="text" value={project.services.s3.bucket_prefix} onChange={(e) => { const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''); updateServiceConfig('s3', { bucket_prefix: value }); validateField('bucketPrefix', value, isValidBucketPrefix, 'Must be 3-37 lowercase alphanumeric characters or hyphens'); }} className={inp} placeholder="my-app" />
            </Field>
            <div className="space-y-2">
              <label className={chkLabel}><input type="checkbox" checked={project.services.s3.versioning_enabled} onChange={(e) => updateServiceConfig('s3', { versioning_enabled: e.target.checked })} className={chk} />Enable Versioning</label>
              <label className={chkLabel}><input type="checkbox" checked={project.services.s3.encryption_enabled} onChange={(e) => updateServiceConfig('s3', { encryption_enabled: e.target.checked })} className={chk} />Enable Server-Side Encryption</label>
            </div>
          </Section>
        )}

        {/* API Gateway */}
        {project.services.api_gateway && (
          <Section title="API Gateway" color={serviceMetadata.api_gateway.color} defaultOpen={false}>
            <Field label="API Name">
              <input type="text" value={project.services.api_gateway.name} onChange={(e) => updateServiceConfig('api_gateway', { name: e.target.value })} className={inp} />
            </Field>
            <label className={chkLabel}><input type="checkbox" checked={project.services.api_gateway.cors_enabled} onChange={(e) => updateServiceConfig('api_gateway', { cors_enabled: e.target.checked })} className={chk} />Enable CORS</label>
            <p className="text-xs text-gray-500">{project.services.api_gateway.routes.length} route(s) configured</p>
          </Section>
        )}

        {/* SQS */}
        {project.services.sqs && (
          <Section title="SQS" color={serviceMetadata.sqs.color} defaultOpen={false}>
            <p className="text-xs text-gray-500">{project.services.sqs.queues.length} queue(s): {project.services.sqs.queues.map(q => q.name).join(', ')}</p>
          </Section>
        )}

        {/* SNS */}
        {project.services.sns && (
          <Section title="SNS" color={serviceMetadata.sns.color} defaultOpen={false}>
            <p className="text-xs text-gray-500">{project.services.sns.topics.length} topic(s): {project.services.sns.topics.map(t => t.name).join(', ')}</p>
          </Section>
        )}

        {/* EventBridge */}
        {project.services.eventbridge && (
          <Section title="EventBridge" color={serviceMetadata.eventbridge.color} defaultOpen={false}>
            <label className={chkLabel}><input type="checkbox" checked={project.services.eventbridge.use_default_bus} onChange={(e) => updateServiceConfig('eventbridge', { use_default_bus: e.target.checked })} className={chk} />Use Default Event Bus</label>
            <p className="text-xs text-gray-500 mt-1">{project.services.eventbridge.rules.length} rule(s) configured</p>
          </Section>
        )}

        {/* CloudWatch */}
        {project.services.cloudwatch && (
          <Section title="CloudWatch" color={serviceMetadata.cloudwatch.color} defaultOpen={false}>
            <p className="text-xs text-gray-500">{project.services.cloudwatch.log_groups.length} log group(s), {project.services.cloudwatch.alarms.length} alarm(s)</p>
            <label className={chkLabel}><input type="checkbox" checked={project.services.cloudwatch.dashboard_enabled} onChange={(e) => updateServiceConfig('cloudwatch', { dashboard_enabled: e.target.checked })} className={chk} />Create Dashboard</label>
          </Section>
        )}

        {/* CloudFront */}
        {project.services.cloudfront && (
          <Section title="CloudFront" color={serviceMetadata.cloudfront.color} defaultOpen={false}>
            <Field label="Default Root Object">
              <input type="text" value={project.services.cloudfront.default_root_object} onChange={(e) => updateServiceConfig('cloudfront', { default_root_object: e.target.value })} className={inp} />
            </Field>
            <Field label="Price Class">
              <select value={project.services.cloudfront.price_class} onChange={(e) => updateServiceConfig('cloudfront', { price_class: e.target.value as 'PriceClass_100' | 'PriceClass_200' | 'PriceClass_All' })} className={sel}>
                {CLOUDFRONT_PRICE_CLASSES.map((pc) => <option key={pc.value} value={pc.value}>{pc.label}</option>)}
              </select>
            </Field>
          </Section>
        )}

        {/* SES */}
        {project.services.ses && (
          <Section title="SES" color={serviceMetadata.ses.color} defaultOpen={false}>
            <Field label="Domain Identity (optional)">
              <input type="text" value={project.services.ses.domain_identity || ''} onChange={(e) => updateServiceConfig('ses', { domain_identity: e.target.value || undefined })} className={inp} placeholder="example.com" />
            </Field>
            <label className={chkLabel}><input type="checkbox" checked={project.services.ses.create_smtp_credentials} onChange={(e) => updateServiceConfig('ses', { create_smtp_credentials: e.target.checked })} className={chk} />Create SMTP Credentials</label>
          </Section>
        )}

        {/* IAM */}
        {project.services.iam && (
          <Section title="IAM" color={serviceMetadata.iam.color}>
            <Field label="Role Name">
              <input type="text" value={project.services.iam.role_name} onChange={(e) => updateServiceConfig('iam', { role_name: e.target.value })} className={inp} placeholder="my-app-role" />
            </Field>
            <div className="space-y-2">
              <label className={chkLabel}><input type="checkbox" checked={project.services.iam.create_instance_profile} onChange={(e) => updateServiceConfig('iam', { create_instance_profile: e.target.checked })} className={chk} />Create Instance Profile</label>
              {project.services.s3 && (
                <label className={chkLabel}><input type="checkbox" checked={project.services.iam.s3_access} onChange={(e) => updateServiceConfig('iam', { s3_access: e.target.checked })} className={chk} />Grant S3 Access</label>
              )}
            </div>
          </Section>
        )}

        {!hasAnyService && (
          <p className="text-sm text-gray-400 text-center py-4">
            Select a template or services to configure
          </p>
        )}
      </div>
    </div>
  );
}
