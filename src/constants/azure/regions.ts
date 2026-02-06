// =============================================================================
// Azure Regions
// =============================================================================

export const AZURE_REGIONS = [
  { value: 'eastus', label: 'East US' },
  { value: 'eastus2', label: 'East US 2' },
  { value: 'westus', label: 'West US' },
  { value: 'westus2', label: 'West US 2' },
  { value: 'westus3', label: 'West US 3' },
  { value: 'centralus', label: 'Central US' },
  { value: 'northeurope', label: 'North Europe (Ireland)' },
  { value: 'westeurope', label: 'West Europe (Netherlands)' },
  { value: 'uksouth', label: 'UK South' },
  { value: 'ukwest', label: 'UK West' },
  { value: 'germanywestcentral', label: 'Germany West Central' },
  { value: 'francecentral', label: 'France Central' },
  { value: 'japaneast', label: 'Japan East' },
  { value: 'japanwest', label: 'Japan West' },
  { value: 'southeastasia', label: 'Southeast Asia (Singapore)' },
  { value: 'australiaeast', label: 'Australia East' },
] as const;

// =============================================================================
// Azure VM Sizes (SKUs)
// =============================================================================

export const AZURE_VM_SIZES = [
  { value: 'Standard_B1s', label: 'Standard_B1s (1 vCPU, 1 GB)' },
  { value: 'Standard_B1ms', label: 'Standard_B1ms (1 vCPU, 2 GB)' },
  { value: 'Standard_B2s', label: 'Standard_B2s (2 vCPU, 4 GB)' },
  { value: 'Standard_B2ms', label: 'Standard_B2ms (2 vCPU, 8 GB)' },
  { value: 'Standard_D2s_v5', label: 'Standard_D2s_v5 (2 vCPU, 8 GB)' },
  { value: 'Standard_D4s_v5', label: 'Standard_D4s_v5 (4 vCPU, 16 GB)' },
  { value: 'Standard_D8s_v5', label: 'Standard_D8s_v5 (8 vCPU, 32 GB)' },
  { value: 'Standard_E2s_v5', label: 'Standard_E2s_v5 (2 vCPU, 16 GB)' },
  { value: 'Standard_E4s_v5', label: 'Standard_E4s_v5 (4 vCPU, 32 GB)' },
] as const;

// =============================================================================
// Azure Database SKUs
// =============================================================================

export const AZURE_DB_SKUS = [
  { value: 'B_Standard_B1ms', label: 'Burstable B1ms (1 vCPU, 2 GB)' },
  { value: 'B_Standard_B2s', label: 'Burstable B2s (2 vCPU, 4 GB)' },
  { value: 'B_Standard_B2ms', label: 'Burstable B2ms (2 vCPU, 8 GB)' },
  { value: 'GP_Standard_D2s_v3', label: 'General Purpose D2s (2 vCPU, 8 GB)' },
  { value: 'GP_Standard_D4s_v3', label: 'General Purpose D4s (4 vCPU, 16 GB)' },
  { value: 'MO_Standard_E2s_v3', label: 'Memory Optimized E2s (2 vCPU, 16 GB)' },
] as const;

export const AZURE_DB_ENGINES = [
  { value: 'postgresql', label: 'PostgreSQL', defaultVersion: '15' },
  { value: 'mysql', label: 'MySQL', defaultVersion: '8.0.21' },
  { value: 'mariadb', label: 'MariaDB', defaultVersion: '10.6' },
] as const;

export const AZURE_DB_VERSIONS: Record<string, { value: string; label: string }[]> = {
  postgresql: [
    { value: '16', label: 'PostgreSQL 16' },
    { value: '15', label: 'PostgreSQL 15' },
    { value: '14', label: 'PostgreSQL 14' },
    { value: '13', label: 'PostgreSQL 13' },
  ],
  mysql: [
    { value: '8.0.21', label: 'MySQL 8.0.21' },
    { value: '5.7', label: 'MySQL 5.7' },
  ],
  mariadb: [
    { value: '10.6', label: 'MariaDB 10.6' },
    { value: '10.5', label: 'MariaDB 10.5' },
  ],
};

// =============================================================================
// Azure Functions Runtime
// =============================================================================

export const AZURE_FUNCTION_RUNTIMES = [
  { value: 'node', label: 'Node.js', defaultVersion: '18' },
  { value: 'python', label: 'Python', defaultVersion: '3.11' },
  { value: 'dotnet', label: '.NET', defaultVersion: '6.0' },
  { value: 'java', label: 'Java', defaultVersion: '17' },
] as const;

export const AZURE_FUNCTION_VERSIONS: Record<string, { value: string; label: string }[]> = {
  node: [
    { value: '20', label: 'Node.js 20' },
    { value: '18', label: 'Node.js 18' },
    { value: '16', label: 'Node.js 16' },
  ],
  python: [
    { value: '3.11', label: 'Python 3.11' },
    { value: '3.10', label: 'Python 3.10' },
    { value: '3.9', label: 'Python 3.9' },
  ],
  dotnet: [
    { value: '8.0', label: '.NET 8.0' },
    { value: '6.0', label: '.NET 6.0' },
  ],
  java: [
    { value: '17', label: 'Java 17' },
    { value: '11', label: 'Java 11' },
  ],
};

// =============================================================================
// Azure Function SKUs (App Service Plans)
// =============================================================================

export const AZURE_FUNCTION_SKUS = [
  { value: 'Y1', label: 'Consumption (Pay per execution)' },
  { value: 'EP1', label: 'Premium EP1 (1 vCPU, 3.5 GB)' },
  { value: 'EP2', label: 'Premium EP2 (2 vCPU, 7 GB)' },
  { value: 'EP3', label: 'Premium EP3 (4 vCPU, 14 GB)' },
] as const;

// =============================================================================
// Azure Storage Tiers
// =============================================================================

export const AZURE_STORAGE_TIERS = [
  { value: 'Standard', label: 'Standard (HDD-backed)' },
  { value: 'Premium', label: 'Premium (SSD-backed)' },
] as const;

export const AZURE_STORAGE_REPLICATION = [
  { value: 'LRS', label: 'Locally Redundant (LRS)' },
  { value: 'ZRS', label: 'Zone Redundant (ZRS)' },
  { value: 'GRS', label: 'Geo Redundant (GRS)' },
  { value: 'RAGRS', label: 'Read-Access Geo Redundant (RA-GRS)' },
] as const;

// =============================================================================
// Azure CDN SKUs
// =============================================================================

export const AZURE_CDN_SKUS = [
  { value: 'Standard_Microsoft', label: 'Standard Microsoft' },
  { value: 'Standard_Akamai', label: 'Standard Akamai' },
  { value: 'Standard_Verizon', label: 'Standard Verizon' },
  { value: 'Premium_Verizon', label: 'Premium Verizon' },
] as const;

// =============================================================================
// Azure API Management SKUs
// =============================================================================

export const AZURE_APIM_SKUS = [
  { value: 'Consumption', label: 'Consumption (Serverless)' },
  { value: 'Developer', label: 'Developer (No SLA)' },
  { value: 'Basic', label: 'Basic' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Premium', label: 'Premium' },
] as const;
