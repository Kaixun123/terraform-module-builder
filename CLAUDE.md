# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Type-check and build for production (tsc -b && vite build)
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

There are no tests in this project.

## Architecture

This is a single-page React + TypeScript app (Vite) that generates downloadable Terraform projects from a visual UI. Users select cloud services, configure them, and download a ZIP of production-ready `.tf` files.

### Layout (`src/App.tsx`)

Three-panel layout:
- **Left sidebar**: `ProviderSelector` → `TemplateSelector` → `ServiceSelector` → `ConfigPanel`
- **Top-right**: `ArchitectureDiagram` (React Flow)
- **Bottom-right**: `CodePreview` (Monaco editor)

### State Management (`src/stores/projectStore.ts`)

Single Zustand store (`useProjectStore`) holds the entire `ProjectConfig`. Key behaviors:
- `toggleService` auto-enables all transitive dependencies and auto-disables all dependents
- `setProvider` resets all services and switches to provider-appropriate defaults (`us-east-1` for AWS, `eastus` for Azure)
- `updateProjectName` cascades the name into derived fields across service configs (S3 bucket prefix, IAM role name, RDS identifier, etc.)

### Dual-Provider Design

AWS and Azure share the same `ServiceType` union and `ServiceSelection` interface — the same keys (`vpc`, `ec2`, `s3`, `lambda`, etc.) map to different config shapes depending on the active provider. The store's `getDefaultConfig()` function branches on `provider` to return the right defaults.

Service dependencies are defined in `src/constants/dependencies.ts` (`DEPENDENCY_GRAPH` / `DEPENDENTS_GRAPH`). These are provider-agnostic.

### Code Generation (`src/generators/`)

`generateTerraformProject(project)` in `src/generators/index.ts` is the single entry point. It routes to:
- `generateAWSTerraformProject` — inline in `index.ts`, calls per-service generators from `src/generators/templates/`
- `generateAzureTerraformProject` — in `src/generators/azure/index.ts`, calls generators from `src/generators/azure/`

Each generator file exports three functions: `generate<Module>Main`, `generate<Module>Variables`, `generate<Module>Outputs`. They take typed config objects and return raw `.tf` file content as strings.

The output structure is `GeneratedProject { rootFiles: GeneratedFile[], modules: GeneratedModule[] }`. `getAllFiles()` flattens this for ZIP download.

### Constants Layout

- `src/constants/index.ts` — re-exports from `defaults.ts`, `dependencies.ts`, `templates.ts` (AWS)
- `src/constants/azure/index.ts` — re-exports Azure-specific constants
- AWS and Azure templates (`src/constants/templates.ts`, `src/constants/azure/templates.ts`) define pre-built configurations that load into the store via `loadTemplate()`

### Adding a New Service

1. Add the service key to `ServiceType` in `src/types/index.ts` and add its config interface
2. Add it to `ServiceSelection` (nullable)
3. Add default config to `src/constants/defaults.ts` (and `src/constants/azure/defaults.ts` for Azure)
4. Add dependency edges in `src/constants/dependencies.ts`
5. Add generator files in `src/generators/templates/` and `src/generators/azure/`
6. Wire into `generateAWSTerraformProject` / `generateAzureTerraformProject`
7. Add `SERVICE_METADATA` entry and `SERVICE_CATEGORIES` placement in `src/constants/dependencies.ts`
8. Handle in `getDefaultConfig()` and `toggleService()` in the store
