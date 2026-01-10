# BMad Recette

[![PR Validation](https://github.com/USERNAME/bmad-recette/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/USERNAME/bmad-recette/actions/workflows/pr-validation.yml)
[![Deploy to Staging](https://github.com/USERNAME/bmad-recette/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/USERNAME/bmad-recette/actions/workflows/deploy-staging.yml)
[![codecov](https://codecov.io/gh/USERNAME/bmad-recette/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/bmad-recette)

A modern recipe management application built with TypeScript, React, React Native, and NestJS in a monorepo structure.

## Overview

BMad Recette is a full-stack application for managing recipes across web and mobile platforms. It features:

- **Web Application**: React-based web interface built with Vite
- **Mobile Application**: React Native mobile app using Expo
- **Backend API**: NestJS REST API server
- **Shared Code**: Type-safe shared libraries for types, utilities, and UI components

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.0.0 or higher (LTS recommended)
- **npm**: v10.0.0 or higher
- **Git**: Latest version

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bmad-recette
```

### 2. Install Dependencies

```bash
npm install
```

This command installs dependencies across all workspaces in the monorepo.

### 3. Environment Setup

Create environment files for each application:

**For API (`apps/api/.env`):**
```env
PORT=3001
NODE_ENV=development
```

**For Web (`apps/web/.env`):**
```env
VITE_API_URL=http://localhost:3001
```

### 4. Run Development Servers

```bash
npm run dev
```

This starts all applications in development mode:
- **Web**: http://localhost:3000
- **API**: http://localhost:3001
- **Mobile**: Expo DevTools (follow terminal instructions)

## Development Commands

All commands should be run from the root directory:

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies for all workspaces |
| `npm run dev` | Start all applications in development mode |
| `npm run build` | Build all applications and packages |
| `npm run test` | Run all test suites |
| `npm run lint` | Lint all code across workspaces |
| `npm run format` | Format all code with Prettier |
| `npm run type-check` | Run TypeScript type checking |
| `npm run clean` | Clean all build artifacts and node_modules |

## Monorepo Structure

```
bmad-recette/
├── apps/
│   ├── api/          # NestJS backend application (Port 3001)
│   ├── web/          # React web application (Port 3000)
│   └── mobile/       # React Native (Expo) mobile application
├── packages/
│   ├── shared/       # Shared TypeScript types, utilities, constants
│   ├── ui/           # Shared UI components (React + React Native compatible)
│   └── config/       # Shared configs (ESLint, TypeScript, Prettier)
├── scripts/          # Build, deploy, and utility scripts
├── docs/             # Project documentation
├── turbo.json        # Turborepo configuration
└── package.json      # Root package.json with workspace definitions
```

### Package Dependencies

- **apps/web** → imports from `@bmad/shared`, `@bmad/ui`
- **apps/mobile** → imports from `@bmad/shared`
- **apps/api** → imports from `@bmad/shared`

All cross-package imports use TypeScript path aliases for type safety.

## Technology Stack

### Core Technologies

- **Monorepo Tool**: Turborepo 2.0+
- **Language**: TypeScript 5.3+
- **Frontend Framework**: React 18.2+
- **Mobile Framework**: React Native (Expo) 50+
- **Backend Framework**: NestJS 10.3+
- **Build Tool (Web)**: Vite 5.0+
- **State Management**: Zustand 4.5+
- **Database ORM**: Prisma 5.8+ (to be configured)
- **Testing**: Vitest (frontend), Jest (backend)

### Key Features

- **Type Safety**: Strict TypeScript configuration across all packages
- **Code Quality**: ESLint + Prettier with pre-commit hooks (Husky + lint-staged)
- **Incremental Builds**: Turborepo caching for fast builds
- **Hot Module Replacement**: Fast refresh in web and mobile development
- **Shared Types**: Type-safe API contracts shared between frontend and backend

## Architecture Overview

The application follows a modern monorepo architecture with clear separation of concerns:

1. **Frontend Applications** (`apps/web`, `apps/mobile`): User-facing applications consuming the REST API
2. **Backend API** (`apps/api`): NestJS server providing REST endpoints
3. **Shared Packages** (`packages/*`): Reusable code shared across applications
4. **Configuration Packages** (`packages/config`): Centralized tooling configuration

For detailed architecture documentation, see [docs/architecture/](docs/architecture/).

## Development Workflow

### Pre-commit Hooks

This project uses Husky and lint-staged to enforce code quality:

- **On commit**: Automatically runs ESLint and Prettier on staged files
- **Type checking**: Ensures TypeScript compilation succeeds
- **Linting**: Catches common errors and enforces code style

If pre-commit checks fail, the commit will be blocked until issues are resolved.

### Running Individual Apps

To run a specific application:

```bash
# Run only web app
cd apps/web && npm run dev

# Run only API
cd apps/api && npm run dev

# Run only mobile app
cd apps/mobile && npm run dev
```

## Testing

Run tests across all packages:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Building for Production

Build all applications:

```bash
npm run build
```

Build outputs:
- **Web**: `apps/web/dist/`
- **API**: `apps/api/dist/`
- **Mobile**: Built via Expo (see Expo documentation)

## CI/CD

This project uses GitHub Actions for continuous integration and deployment:

- **PR Validation**: Automatically runs lint, type-check, tests, and build on every pull request
- **Staging Deployment**: Automatically deploys to staging environment when code is merged to main
- **Test Coverage**: Enforces minimum 70% code coverage threshold
- **Branch Protection**: Main branch is protected and requires all checks to pass before merging

For detailed workflow documentation, see [.github/WORKFLOWS.md](.github/WORKFLOWS.md).

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass: `npm run test`
4. Ensure linting passes: `npm run lint`
5. Commit your changes (pre-commit hooks will run automatically)
6. Push and create a pull request
7. Wait for CI checks to pass before requesting review

## License

[Your License Here]

## Support

For issues and questions, please create an issue in the repository.
