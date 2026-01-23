# AGENTS.md - Cursor Agent Context

This file provides context for AI coding assistants working on this project.

## Project Overview

Terraform Builder is a React + TypeScript web application that generates AWS Terraform infrastructure code. Users visually select services, configure parameters, and download production-ready Terraform modules.

## Technology Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Flow** (@xyflow/react) for architecture diagrams
- **Monaco Editor** (@monaco-editor/react) for code preview
- **JSZip** + **FileSaver.js** for ZIP download

## Key Files and Their Purpose

### State Management

- `src/stores/projectStore.ts` - Zustand store containing all project state. Actions include toggleService, updateServiceConfig, loadTemplate. Handles dependency auto-selection when services are toggled.

### Type Definitions

- `src/types/index.ts` - All TypeScript interfaces including ProjectConfig, ServiceSelection, and individual service configs (VPCConfig, SubnetConfig, EC2Config, S3Config, IAMConfig).

### Constants

- `src/constants/defaults.ts` - Default configurations for each service
- `src/constants/templates.ts` - Pre-built infrastructure templates
- `src/constants/dependencies.ts` - Service dependency graph and resolution functions

### Code Generation

- `src/generators/index.ts` - Main orchestration that calls individual template generators
- `src/generators/templates/networking.ts` - VPC, subnets, IGW, NAT gateway
- `src/generators/templates/compute.ts` - EC2 instance, security groups
- `src/generators/templates/storage.ts` - S3 bucket configuration
- `src/generators/templates/iam.ts` - IAM roles, policies, instance profiles
- `src/generators/templates/root.ts` - Root module files (main.tf, variables.tf, outputs.tf, versions.tf)

### Components

- `src/components/Header/Header.tsx` - App header with download ZIP functionality
- `src/components/Sidebar/TemplateSelector.tsx` - Radio buttons for template selection
- `src/components/Sidebar/ServiceSelector.tsx` - Checkboxes for services with dependency indicators
- `src/components/Sidebar/ConfigPanel.tsx` - Collapsible configuration forms per service
- `src/components/Diagram/ArchitectureDiagram.tsx` - React Flow canvas with custom AWS nodes
- `src/components/CodePreview/CodePreview.tsx` - Monaco editor with file tabs

## Service Dependencies

```
vpc: []
subnets: [vpc]
ec2: [vpc, subnets, iam]
s3: []
iam: []
```

When EC2 is selected, VPC, Subnets, and IAM are automatically enabled. When VPC is deselected, Subnets and EC2 are disabled.

## Adding New AWS Services

1. Add interface to `src/types/index.ts`
2. Add default config to `src/constants/defaults.ts`
3. Update dependency graph in `src/constants/dependencies.ts`
4. Update templates in `src/constants/templates.ts` if needed
5. Create generator in `src/generators/templates/`
6. Update `src/generators/index.ts` to call new generator
7. Add config form section in `src/components/Sidebar/ConfigPanel.tsx`
8. Update diagram nodes in `src/components/Diagram/ArchitectureDiagram.tsx`

## Code Generation Pattern

Each generator function returns a string of Terraform code. Template literals are used with `${variable}` interpolation. Comments are included in generated code using the `commentBlock()` helper.

Example:
```typescript
export function generateVPCMain(vpc: VPCConfig): string {
  return `
resource "aws_vpc" "main" {
  cidr_block = "${vpc.cidr_block}"
}
`.trim();
}
```

## Validation Rules

- Project name: `/^[a-z0-9-]{3,32}$/`
- CIDR blocks: Valid CIDR notation regex
- S3 bucket prefix: `/^[a-z0-9-]{3,37}$/`
- Instance types: Whitelist in `src/constants/defaults.ts`
- Max 4 availability zones, max 8 total subnets

## Testing the Application

1. `npm run dev` - Start dev server
2. Select a template or manually enable services
3. Verify dependency auto-selection works
4. Check that config changes update the diagram and code preview
5. Download ZIP and verify with `terraform init && terraform validate`

## Common Tasks

### Modify default configurations
Edit `src/constants/defaults.ts`

### Add new template
Add to `TEMPLATES` array in `src/constants/templates.ts`

### Change Terraform output format
Modify template functions in `src/generators/templates/`

### Update diagram styling
Edit custom node components in `src/components/Diagram/ArchitectureDiagram.tsx`
