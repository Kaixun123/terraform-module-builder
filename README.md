# Terraform Builder

A web-based visual tool for rapidly scaffolding AWS infrastructure as Terraform code. Select AWS services, configure parameters, view a real-time architecture diagram, and download production-ready Terraform files with proper module structure.

## Features

- **Visual Service Selection**: Choose from VPC, Subnets, EC2, S3, and IAM with automatic dependency resolution
- **Pre-built Templates**: Start quickly with Simple Web Server, Web App with Storage, or Multi-Tier Architecture templates
- **Real-time Architecture Diagram**: See your infrastructure visualized as you configure it
- **Live Code Preview**: Monaco editor with Terraform syntax highlighting shows generated code in real-time
- **Production-Ready Output**: Download a ZIP with properly structured Terraform modules, variables, and outputs
- **Inline Documentation**: All generated Terraform includes descriptive comments explaining each resource

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/terraform-module-builder.git
cd terraform-module-builder

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## Usage

### 1. Choose a Template (Optional)

Select from pre-built templates to get started quickly:

- **Blank Project**: Start from scratch
- **Simple Web Server**: VPC + public subnet + EC2 instance
- **Web App with Storage**: Web server + S3 bucket with EC2 access
- **Multi-Tier Architecture**: VPC with public/private subnets, NAT Gateway, EC2, S3

### 2. Configure Services

Enable/disable AWS services using the checkboxes. Dependencies are automatically managed:

- Selecting EC2 auto-enables VPC, Subnets, and IAM
- Deselecting a dependency warns about affected services

### 3. Customize Configuration

Expand each service section to customize:

- **Project Settings**: Name, region, environment
- **VPC**: CIDR block, DNS settings
- **Subnets**: Public/private CIDRs, availability zones, NAT Gateway
- **EC2**: Instance type, key pair, volume size
- **S3**: Bucket prefix, versioning, encryption
- **IAM**: Role name, instance profile, S3 access

### 4. Preview Generated Code

The code preview panel shows all generated Terraform files:

- Root module files (main.tf, variables.tf, outputs.tf, versions.tf)
- Module files organized by service (networking, compute, storage, iam)

### 5. Download

Click "Download ZIP" to get a complete Terraform project ready to deploy.

## Generated File Structure

```
terraform-output/
├── main.tf              # Root module with module calls
├── variables.tf         # Root input variables
├── outputs.tf           # Root outputs
├── versions.tf          # Terraform and provider versions
├── terraform.tfvars     # Default variable values
├── locals.tf            # Common tags
├── README.md            # Usage instructions
└── modules/
    ├── networking/      # VPC, subnets, IGW, NAT
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── compute/         # EC2, security groups
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── storage/         # S3 bucket
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── iam/             # IAM roles, policies
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Deploying Generated Terraform

```bash
# Unzip the downloaded file
unzip my-project-terraform.zip
cd my-project-terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

## Technology Stack

- **React 18** + **TypeScript**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Zustand**: State management
- **React Flow**: Architecture diagram visualization
- **Monaco Editor**: Code preview with syntax highlighting
- **JSZip** + **FileSaver.js**: ZIP file generation and download

## Configuration Validation

The application validates:

- **Project name**: 3-32 lowercase alphanumeric characters or hyphens
- **CIDR blocks**: Valid CIDR notation (e.g., 10.0.0.0/16)
- **S3 bucket prefix**: 3-37 lowercase alphanumeric characters or hyphens
- **Instance types**: From a whitelist of common EC2 types
- **Availability zones**: Maximum 4, validated against selected region

## AWS Resources Created

| Service | Resources |
|---------|-----------|
| VPC | aws_vpc, aws_internet_gateway, aws_route_table |
| Subnets | aws_subnet, aws_nat_gateway, aws_eip, aws_route_table_association |
| EC2 | aws_instance, aws_security_group, data.aws_ami |
| S3 | aws_s3_bucket, aws_s3_bucket_versioning, aws_s3_bucket_server_side_encryption_configuration |
| IAM | aws_iam_role, aws_iam_policy, aws_iam_role_policy_attachment, aws_iam_instance_profile |

## Development

### Project Structure

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Main layout
├── stores/
│   └── projectStore.ts   # Zustand state management
├── components/
│   ├── Header/           # Title and download button
│   ├── Sidebar/          # Templates, services, config
│   ├── Diagram/          # React Flow visualization
│   └── CodePreview/      # Monaco editor
├── generators/
│   ├── index.ts          # Main orchestration
│   └── templates/        # Terraform template generators
├── constants/            # Defaults, templates, dependencies
└── types/                # TypeScript interfaces
```

### Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
