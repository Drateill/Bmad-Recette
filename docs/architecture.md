# BMad Recette Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for **BMad Recette**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

**Decision: Greenfield with Turborepo monorepo tooling**

After reviewing the PRD's Technical Assumptions (Repository Structure section), the project explicitly specifies a **monorepo architecture using Turborepo or Nx**. This is not a starter template but rather monorepo tooling that we'll configure from scratch.

**Why Not Use a Fullstack Starter Template?**

Evaluated options:
- **T3 Stack (Next.js + tRPC)**: Incompatible with PRD's requirement for NestJS backend and separate mobile app
- **Create T3 Turbo**: Uses tRPC instead of REST, doesn't support NestJS backend architecture
- **Blitz.js**: Full-stack React framework, but lacks mobile support and uses different patterns

**Why This Approach?**

The PRD mandates:
1. **NestJS backend** with modular architecture (AuthModule, RecipeModule, etc.)
2. **Separate React web app** and **React Native mobile app** (not Next.js SSR)
3. **REST API** for MVP (not tRPC or GraphQL)
4. **Specific deployment targets**: Railway/Render (backend), Vercel (web), App Stores (mobile)

**Monorepo Tooling Selection: Turborepo**

Recommendation: **Turborepo** over Nx for this project.

**Rationale:**
- Simpler configuration, less opinionated (better for team unfamiliar with monorepos)
- Excellent caching and parallel execution for build/test
- Native support for mixed framework monorepos (NestJS + React + React Native)
- Vercel integration (web app deployment target)
- Lower learning curve than Nx

**Trade-off Acknowledged**: Starting from scratch means ~3-5 days of initial setup (monorepo config, shared packages, CI/CD, linting) vs. ~1 day if using a pre-configured starter. However, the architectural control and alignment with PRD requirements justify this investment.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2026-01-06 | 0.1 | Initial architecture document draft | Winston (Architect) |

---

## High Level Architecture

### Technical Summary

BMad Recette employs a **monolithic REST API architecture** with **offline-first progressive web and native mobile clients**, deployed across modern cloud infrastructure. The backend uses **NestJS** (Node.js) with **PostgreSQL** for relational data and **Redis** for session management and sync coordination, while the frontend leverages **React** (web) and **React Native with Expo** (mobile) sharing TypeScript interfaces from a common package. The system integrates **Google Cloud Vision API** for OCR recipe scanning and utilizes **S3-compatible storage** for recipe photos. Deployment follows a hybrid strategy: backend on **Railway** (containerized API + managed PostgreSQL/Redis), web app on **Vercel** (edge-optimized static hosting with serverless functions), and mobile apps distributed via **iOS App Store** and **Google Play Store**. This architecture achieves the PRD's core goals: sub-3-second TTI, real-time cross-platform sync, robust offline functionality, and cost efficiency (<€200/month for 1K users).

### Platform and Infrastructure Choice

**Platform: Hybrid Cloud (Railway + Vercel + Mobile App Stores)**

After evaluating modern fullstack deployment platforms, I recommend a **best-of-breed hybrid approach** rather than locking into a single vendor ecosystem.

**Evaluated Options:**

1. **Vercel + Supabase (Full Managed)**
   - ✅ Pros: Fastest setup, built-in auth/storage, excellent DX
   - ❌ Cons: Supabase doesn't support NestJS backend (requires their serverless functions or separate hosting), vendor lock-in risk, limited control over backend architecture

2. **AWS Full Stack (ECS + RDS + S3 + Cognito)**
   - ✅ Pros: Enterprise-grade scaling, full control, comprehensive service catalog
   - ❌ Cons: Complex setup (~2 weeks), expensive for MVP ($300+/month), steep learning curve, overkill for initial launch

3. **Railway + Vercel Hybrid (Recommended)**
   - ✅ Pros: Railway perfect for NestJS + PostgreSQL + Redis (one-click provision), Vercel ideal for React SSG/SSR, cost-effective (~€150/month), simple deployment, excellent logs/monitoring
   - ✅ Mobile: Native app store distribution (required for offline features, camera access)
   - ⚠️ Cons: Multi-platform management (not single dashboard), but acceptable trade-off

**Selected Platform: Railway + Vercel + App Stores**

**Key Services:**
- **Backend API**: Railway (NestJS container, PostgreSQL 15, Redis 7)
- **Web App**: Vercel (React SPA with edge caching, incremental static regeneration)
- **File Storage**: AWS S3 (recipe photos, OCR scans, backups)
- **OCR**: Google Cloud Vision API (primary), Tesseract.js fallback
- **Email**: SendGrid (transactional, shopping list sharing)
- **SMS**: Twilio (shopping list sharing)
- **Monitoring**: Sentry (error tracking), Railway/Vercel built-in metrics
- **CDN**: Cloudflare (free tier, fronts S3 and Vercel for global performance)

**Deployment Hosts and Regions:**
- **Railway**: EU-West-1 (Frankfurt) for GDPR compliance and low latency to European users
- **Vercel**: Auto-distributed to global edge network (primary: Frankfurt, Paris, London)
- **S3**: EU-West-1 (Frankfurt) with CloudFront CDN
- **Mobile**: Global distribution via App Store/Play Store CDNs

### Repository Structure

**Structure: Monorepo (Turborepo)**

**Monorepo Tool: Turborepo 2.x**

**Package Organization:**

```
bmad-recette/
├── apps/
│   ├── api/          # NestJS backend application
│   ├── web/          # React web application
│   └── mobile/       # React Native (Expo) mobile application
├── packages/
│   ├── shared/       # Shared TypeScript types, utilities, constants
│   ├── ui/           # Shared UI components (React + React Native compatible)
│   └── config/       # Shared configs (ESLint, TypeScript, Jest)
├── infrastructure/   # IaC definitions (if needed for advanced deployment)
├── scripts/          # Build, deploy, and seed scripts
└── docs/             # Documentation (PRD, architecture, etc.)
```

**Rationale:**
- **apps/**: Each deployable application isolated with its own package.json and build config
- **packages/shared/**: Critical for type safety—API contracts (DTOs), business logic utilities, validation schemas shared across all apps
- **packages/ui/**: React components designed for cross-platform compatibility (React + React Native via react-native-web patterns where possible)
- **packages/config/**: DRY principle for linting, TypeScript, testing configs
- **Turborepo caching**: Shared packages cached globally, only rebuild what changed
- **Workspace dependencies**: `apps/web` imports from `@bmad/shared`, `apps/api` imports from `@bmad/shared` for type-safe API contracts

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WebApp[Web App<br/>React + PWA<br/>Vercel Edge]
        MobileApp[Mobile App<br/>React Native + Expo<br/>iOS/Android]
    end

    subgraph "CDN Layer"
        Cloudflare[Cloudflare CDN<br/>Static Assets + Images]
    end

    subgraph "API Layer - Railway"
        API[NestJS API<br/>REST Endpoints]
        Auth[Auth Module<br/>JWT + OAuth]
    end

    subgraph "Data Layer - Railway"
        PostgreSQL[(PostgreSQL 15<br/>Recipes, Users, Tags)]
        Redis[(Redis 7<br/>Sessions, Sync Queue)]
    end

    subgraph "Storage Layer"
        S3[AWS S3<br/>Recipe Photos, OCR Scans]
    end

    subgraph "External Services"
        CloudVision[Google Cloud Vision<br/>OCR Processing]
        SendGrid[SendGrid<br/>Email]
        Twilio[Twilio<br/>SMS]
        OAuth[OAuth Providers<br/>Google, Apple]
    end

    WebApp -->|HTTPS/REST| API
    MobileApp -->|HTTPS/REST| API
    WebApp -.->|Cache| Cloudflare
    MobileApp -.->|Cache| Cloudflare

    API --> PostgreSQL
    API --> Redis
    API --> S3
    API --> CloudVision
    API --> SendGrid
    API --> Twilio
    Auth --> OAuth

    S3 --> Cloudflare
```

### Architectural Patterns

- **Monolithic Modular Backend (NestJS):** Single deployable backend organized into cohesive modules (AuthModule, RecipeModule, TagModule, MenuModule, OCRModule, SyncModule). Each module encapsulates related routes, services, and data access logic, enabling future microservices extraction if scaling demands it. _Rationale:_ Fastest development velocity for MVP, simpler debugging, reduced operational overhead, yet maintains clear boundaries for future decomposition.

- **Offline-First Progressive Enhancement:** Clients (web + mobile) prioritize local data storage (IndexedDB/SQLite) with background synchronization to the server. All read operations check local cache first, writes queue for sync when offline. _Rationale:_ Meets NFR5 (100% offline recipe viewing), critical for in-kitchen usage where connectivity may be unreliable, enhances perceived performance.

- **Repository Pattern (Backend):** Abstract all database access behind repository interfaces (`RecipeRepository`, `UserRepository`, etc.) that hide ORM details from business logic. _Rationale:_ Enables comprehensive unit testing with mocked repositories, provides flexibility to swap ORMs (TypeORM → Prisma) or databases without rewriting business logic, enforces single responsibility principle.

- **API Gateway Pattern (Implicit):** While we use a monolithic API, NestJS acts as a unified gateway providing centralized authentication (JWT guards), rate limiting, request validation, and error handling before reaching business logic. _Rationale:_ Simplifies client-side error handling, enables consistent security policies, provides single point for observability (logging, metrics).

- **Component-Based UI with Shared Design System:** React components follow atomic design (atoms → molecules → organisms) with shared components in `packages/ui/` designed for React + React Native dual compatibility. _Rationale:_ Maximizes code reuse between web and mobile (~40% component sharing achievable), ensures visual consistency, accelerates development of new features.

- **Optimistic UI Updates:** Client applications immediately update local state on user actions (e.g., checking off shopping list item) and asynchronously sync to server, rolling back only on failure. _Rationale:_ Achieves instant perceived responsiveness even on slow connections, aligns with offline-first philosophy, dramatically improves UX for high-frequency actions.

- **Eventual Consistency with Last-Write-Wins (MVP):** Cross-device sync uses timestamp-based conflict resolution where most recent `updatedAt` wins during concurrent edits. _Rationale:_ Simplest conflict resolution for MVP scope, acceptable for personal recipe management (low conflict probability), avoids complex CRDT or operational transformation overhead.

---

## Tech Stack

This is the **DEFINITIVE** technology selection for the entire project. All development must use these exact versions.

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| **Frontend Language** | TypeScript | 5.3+ | Type-safe web and mobile development | Industry standard for large React codebases, catches bugs at compile time, enables shared types across monorepo, excellent IDE support |
| **Frontend Framework** | React | 18.2+ | Web application UI framework | Mature ecosystem, massive component library availability, excellent performance with concurrent rendering, strong PWA support |
| **Mobile Framework** | React Native + Expo | 0.73+ / SDK 50+ | Cross-platform mobile apps | Code sharing with web (70%+ business logic reuse), managed workflow simplifies deployment, excellent offline/camera/native APIs, OTA updates |
| **UI Component Library (Web)** | Tailwind CSS + Headless UI | 3.4+ / 1.7+ | Responsive web styling | Utility-first CSS for rapid development, Headless UI provides accessible unstyled components, excellent mobile-first responsive design |
| **UI Component Library (Mobile)** | React Native Paper | 5.12+ | Material Design mobile components | Follows Material Design 3, excellent accessibility, consistent theming, works seamlessly with Expo |
| **State Management** | Zustand | 4.5+ | Lightweight client state | Simpler than Redux (less boilerplate), excellent TypeScript support, tiny bundle (1KB), perfect for MVP scope |
| **Backend Language** | TypeScript (Node.js) | 5.3+ / 20 LTS | Type-safe backend development | Same language as frontend enables full-stack type safety, Node.js 20 LTS provides long-term stability |
| **Backend Framework** | NestJS | 10.3+ | Enterprise Node.js framework | Modular architecture (modules/controllers/services), built-in dependency injection, excellent testing support, TypeScript-first, scalable patterns |
| **API Style** | REST | OpenAPI 3.0 | HTTP API communication | Simpler than GraphQL for MVP, universally understood, excellent tooling (Swagger), easy caching, meets PRD requirement |
| **Database** | PostgreSQL | 15+ | Primary relational database | JSONB for flexible tag metadata, full-text search built-in (tsvector), excellent performance, ACID guarantees, proven at scale |
| **ORM** | Prisma | 5.8+ | Database access and migrations | Superior DX over TypeORM, type-safe queries auto-generated, excellent migration tooling, visual schema editor, faster queries |
| **Cache/Session** | Redis | 7+ | Session store and sync coordination | In-memory speed for sessions, pub/sub for real-time features, excellent for rate limiting, distributed locking for sync |
| **File Storage** | AWS S3 | - | Recipe photos and OCR scans | Industry standard, 99.999999999% durability, CDN integration, versioning support, cost-effective (€0.023/GB) |
| **Authentication** | Passport.js + JWT | 0.7+ / 9.0+ | Auth with JWT + OAuth | De facto standard for Node.js auth, 500+ strategies available (Google, Apple), JWT for stateless auth, refresh token rotation |
| **Frontend Testing** | Vitest + React Testing Library | 1.2+ / 14.2+ | Component and unit tests | Vitest faster than Jest (Vite-powered), RTL enforces accessibility-focused testing, aligns with user behavior testing |
| **Backend Testing** | Jest + Supertest | 29.7+ / 6.3+ | API and unit tests | NestJS default (excellent integration), Supertest for HTTP endpoint testing, comprehensive mocking capabilities |
| **E2E Testing** | Playwright (web) + Detox (mobile) | 1.41+ / 20.18+ | End-to-end critical paths | Playwright fastest E2E for web (parallel execution), Detox industry standard for React Native, both support CI/CD |
| **Build Tool** | Turborepo | 2.0+ | Monorepo task orchestration | Incremental builds, intelligent caching, parallel execution, simple configuration, Vercel-native integration |
| **Bundler (Web)** | Vite | 5.0+ | Web app bundling and dev server | Lightning-fast HMR, optimized production builds, native ESM, excellent React plugin ecosystem |
| **Bundler (Mobile)** | Metro (Expo default) | 0.80+ | React Native bundling | Required for React Native, optimized for mobile bundles, excellent dev experience with Expo |
| **IaC Tool** | Railway CLI + Vercel CLI | - | Deployment automation | Railway/Vercel both provide CLI for infra-as-code, sufficient for MVP (no Terraform complexity needed yet) |
| **CI/CD** | GitHub Actions | - | Automated testing and deployment | Free for private repos, excellent ecosystem, native GitHub integration, parallel job execution |
| **Monitoring** | Sentry | Latest | Error tracking and performance | Real-time error alerts, source maps support, performance monitoring, user session replay, generous free tier |
| **Logging** | Pino (backend) + Console (frontend) | 8.18+ | Structured application logging | Fastest Node.js logger, structured JSON output, log levels, integrates with log aggregators (Axiom, Logtail) |
| **OCR Service** | Google Cloud Vision API | v1 | Text extraction from images | Industry-leading accuracy (95%+ for printed recipes), handles multiple languages, reasonable pricing (1000 free/month) |
| **Email Service** | SendGrid | v3 API | Transactional emails | Reliable delivery, 100 emails/day free tier, excellent templates, detailed analytics |
| **SMS Service** | Twilio | Latest | Shopping list SMS sharing | Industry standard, pay-per-use pricing, global coverage, programmable messaging API |
| **CSS Framework** | Tailwind CSS | 3.4+ | Utility-first styling system | Rapid UI development, design system consistency, tiny production builds (unused CSS purged), mobile-first responsive |

**Key Technology Decisions Explained:**

1. **Prisma over TypeORM**: While PRD mentioned TypeORM, I recommend Prisma for dramatically better developer experience—type-safe queries, visual schema management, and faster query generation. Migration is straightforward if needed.

2. **Vitest over Jest (Frontend)**: Vitest is Jest-compatible but 10-20x faster due to Vite integration, reducing CI/CD times significantly.

3. **Expo Managed Workflow**: Simplifies mobile deployment (OTA updates, no Xcode/Android Studio required for most development), critical for hitting MVP timeline.

4. **No GraphQL (MVP)**: REST is simpler, has better caching (HTTP), and meets all PRD requirements. GraphQL could be V2 if query flexibility becomes critical.

5. **Zustand over Redux**: For MVP scope (personal recipe management), Zustand's simplicity wins. If multi-user real-time collaboration becomes critical in V2, could evaluate Redux Toolkit + RTK Query.

**Version Strategy:**
- All versions locked in package.json using exact versions (no `^` or `~`)
- Major version upgrades require architecture review
- Security patches applied automatically via Dependabot

---

## Data Models

Based on the PRD's functional requirements and Epic structure, these are the core business entities shared between frontend and backend via TypeScript interfaces in `packages/shared/`.

### User

**Purpose:** Represents authenticated users of the BMad Recette platform with profile information and authentication credentials.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `email`: string (unique, indexed) - User's email address for login and communication
- `firstName`: string - User's first name for personalization
- `passwordHash`: string (nullable) - Bcrypt hash for email/password auth (null for OAuth-only users)
- `oauthProviders`: OAuthProvider[] - Array of linked OAuth accounts (Google, Apple)
- `createdAt`: DateTime - Account creation timestamp
- `updatedAt`: DateTime - Last profile modification timestamp
- `lastSyncedAt`: DateTime - Last successful sync timestamp for conflict detection

**TypeScript Interface:**
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  passwordHash?: string | null;
  oauthProviders: OAuthProvider[];
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

interface OAuthProvider {
  provider: 'google' | 'apple';
  providerId: string;
  linkedAt: Date;
}
```

**Relationships:**
- One-to-Many: User → Recipes (a user owns many recipes)
- One-to-Many: User → ShoppingLists (a user creates many shopping lists)
- One-to-Many: User → Menus (a user generates many menus)
- One-to-Many: User → Inventory (a user maintains ingredient inventory)
- One-to-Many: User → CustomTags (a user creates custom tags)

### Recipe

**Purpose:** Core entity representing a recipe with metadata, nutritional timing, and ownership information.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `userId`: UUID (foreign key) - Recipe owner
- `title`: string - Recipe name (indexed for search)
- `description`: string (nullable) - Optional recipe overview
- `prepTime`: number - Preparation time in minutes
- `cookTime`: number - Cooking time in minutes
- `servings`: number - Default serving size
- `rating`: number (1-5, nullable) - User's personal rating
- `source`: string (nullable) - Original source (OCR scan, manual entry, website)
- `createdAt`: DateTime - Recipe creation timestamp
- `updatedAt`: DateTime - Last modification timestamp
- `version`: number - Optimistic locking version for sync conflicts

**TypeScript Interface:**
```typescript
interface Recipe {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  rating?: number | null; // 1-5
  source?: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  // Computed fields (not stored, calculated on fetch)
  totalTime: number; // prepTime + cookTime

  // Relations (populated via joins)
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  photos?: RecipePhoto[];
  tags?: Tag[];
}
```

**Relationships:**
- Many-to-One: Recipe → User (many recipes belong to one user)
- One-to-Many: Recipe → RecipeIngredients (a recipe has many ingredients)
- One-to-Many: Recipe → RecipeSteps (a recipe has many ordered steps)
- One-to-Many: Recipe → RecipePhotos (a recipe has many photos)
- Many-to-Many: Recipe ↔ Tags (via RecipeTags junction table)

### Ingredient

**Purpose:** Global catalog of ingredients used for auto-completion, aggregation, and inventory management.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `name`: string (unique, indexed) - Ingredient name (e.g., "chicken breast")
- `category`: string - Grocery aisle category (Produce, Meat, Dairy, etc.)
- `commonUnits`: string[] - Typical units for this ingredient (["cups", "g", "oz"])
- `averagePrice`: number (nullable) - Average price per unit for cost estimation
- `priceUnit`: string (nullable) - Unit for price (e.g., "per kg")
- `createdAt`: DateTime - When ingredient was added to catalog

**TypeScript Interface:**
```typescript
interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  commonUnits: string[];
  averagePrice?: number | null;
  priceUnit?: string | null;
  createdAt: Date;
}

type IngredientCategory =
  | 'Produce'
  | 'Meat/Seafood'
  | 'Dairy'
  | 'Bakery'
  | 'Canned Goods'
  | 'Frozen'
  | 'Spices'
  | 'Pantry'
  | 'Other';
```

**Relationships:**
- One-to-Many: Ingredient → RecipeIngredients (an ingredient appears in many recipe ingredients)
- One-to-Many: Ingredient → InventoryItems (an ingredient appears in many user inventories)

### RecipeIngredient

**Purpose:** Junction entity linking recipes to ingredients with quantity/unit information.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `recipeId`: UUID (foreign key) - Associated recipe
- `ingredientId`: UUID (foreign key) - Associated ingredient from catalog
- `ingredientName`: string - Denormalized name for display (handles custom ingredients not in catalog)
- `quantity`: number - Numeric amount (e.g., 2, 0.5, 1.25)
- `unit`: string - Measurement unit (cups, tbsp, g, oz, "to taste")
- `notes`: string (nullable) - Additional context (e.g., "diced", "room temperature")
- `sortOrder`: number - Display order within recipe

**TypeScript Interface:**
```typescript
interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId?: string | null; // null if custom ingredient not in catalog
  ingredientName: string; // always present for display
  quantity: number;
  unit: string;
  notes?: string | null;
  sortOrder: number;
}
```

**Relationships:**
- Many-to-One: RecipeIngredient → Recipe
- Many-to-One: RecipeIngredient → Ingredient (nullable for custom ingredients)

### RecipeStep

**Purpose:** Individual instruction step within a recipe's preparation process.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `recipeId`: UUID (foreign key) - Associated recipe
- `stepNumber`: number - Sequential order (1, 2, 3...)
- `instruction`: string - Step description/action
- `duration`: number (nullable) - Optional time for this specific step in minutes
- `createdAt`: DateTime - When step was added

**TypeScript Interface:**
```typescript
interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number;
  instruction: string;
  duration?: number | null; // minutes
  createdAt: Date;
}
```

**Relationships:**
- Many-to-One: RecipeStep → Recipe (many steps belong to one recipe)

### RecipePhoto

**Purpose:** Photo attachments for recipes stored in S3 with metadata.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `recipeId`: UUID (foreign key) - Associated recipe
- `s3Url`: string - Full S3 URL to original image
- `thumbnailUrl`: string - S3 URL to 400x400 thumbnail
- `isPrimary`: boolean - Whether this is the main recipe photo
- `fileSize`: number - Size in bytes
- `width`: number - Image width in pixels
- `height`: number - Image height in pixels
- `uploadedAt`: DateTime - Upload timestamp

**TypeScript Interface:**
```typescript
interface RecipePhoto {
  id: string;
  recipeId: string;
  s3Url: string;
  thumbnailUrl: string;
  isPrimary: boolean;
  fileSize: number;
  width: number;
  height: number;
  uploadedAt: Date;
}
```

**Relationships:**
- Many-to-One: RecipePhoto → Recipe (many photos belong to one recipe)

### Tag

**Purpose:** Categorization system for recipes (both system-defined and user-created custom tags).

**Key Attributes:**
- `id`: UUID - Primary identifier
- `categoryId`: UUID (foreign key) - Tag category
- `name`: string - Tag display name (e.g., "Vegetarian", "Quick")
- `slug`: string - URL-safe identifier (e.g., "vegetarian", "quick")
- `isSystem`: boolean - True for predefined tags, false for user-created
- `userId`: UUID (foreign key, nullable) - Owner of custom tag (null for system tags)
- `color`: string (nullable) - Hex color for UI display
- `createdAt`: DateTime - Tag creation timestamp

**TypeScript Interface:**
```typescript
interface Tag {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isSystem: boolean;
  userId?: string | null; // null for system tags
  color?: string | null; // hex color like "#FF5733"
  createdAt: Date;

  // Populated via join
  category?: TagCategory;
}

interface TagCategory {
  id: string;
  name: string; // "Time/Effort", "Diet/Health", etc.
  slug: string;
  sortOrder: number;
}
```

**Relationships:**
- Many-to-One: Tag → TagCategory (many tags belong to one category)
- Many-to-One: Tag → User (for custom tags only)
- Many-to-Many: Tag ↔ Recipe (via RecipeTags junction table)

### ShoppingList

**Purpose:** Generated shopping lists from selected recipes with aggregated ingredients.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `userId`: UUID (foreign key) - List owner
- `name`: string - List name (e.g., "Shopping List - Jan 6")
- `recipeIds`: UUID[] - Array of recipe IDs included in this list
- `shareToken`: string (nullable) - Secure token for shareable links
- `sharedVia`: string[] (nullable) - Tracking of share methods used (email, sms, link)
- `createdAt`: DateTime - List creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**TypeScript Interface:**
```typescript
interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  recipeIds: string[];
  shareToken?: string | null;
  sharedVia?: ('email' | 'sms' | 'link')[] | null;
  createdAt: Date;
  updatedAt: Date;

  // Populated via join
  items?: ShoppingListItem[];
}

interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  checked: boolean;
  recipeNames: string[]; // Which recipes need this ingredient
  estimatedCost?: number | null;
}
```

**Relationships:**
- Many-to-One: ShoppingList → User (many lists belong to one user)
- One-to-Many: ShoppingList → ShoppingListItems (a list has many items)

### Menu

**Purpose:** Generated meal plans with recipes assigned to specific days and meal types.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `userId`: UUID (foreign key) - Menu owner
- `name`: string - Menu name (e.g., "Vegetarian Week Jan 6-12")
- `startDate`: Date - First day of menu
- `days`: number - Number of days in menu (1-14)
- `isFavorite`: boolean - Whether user favorited this menu for reuse
- `templateId`: string (nullable) - If generated from template, template identifier
- `createdAt`: DateTime - Menu creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**TypeScript Interface:**
```typescript
interface Menu {
  id: string;
  userId: string;
  name: string;
  startDate: Date;
  days: number;
  isFavorite: boolean;
  templateId?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Populated via join
  meals?: MenuMeal[];
}

interface MenuMeal {
  id: string;
  menuId: string;
  dayNumber: number; // 1-14
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId: string;

  // Populated via join
  recipe?: Recipe;
}
```

**Relationships:**
- Many-to-One: Menu → User (many menus belong to one user)
- One-to-Many: Menu → MenuMeals (a menu has many meals)
- Many-to-One (indirect): MenuMeal → Recipe (each meal references a recipe)

### Inventory

**Purpose:** User's current ingredient inventory for recipe matching.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `userId`: UUID (foreign key) - Inventory owner
- `ingredientId`: UUID (foreign key) - Ingredient in inventory
- `quantity`: number - Current quantity available
- `unit`: string - Unit of measurement
- `expiresAt`: DateTime (nullable) - Optional expiration date (V2 feature)
- `addedAt`: DateTime - When ingredient was added to inventory
- `updatedAt`: DateTime - Last quantity update

**TypeScript Interface:**
```typescript
interface InventoryItem {
  id: string;
  userId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  expiresAt?: Date | null;
  addedAt: Date;
  updatedAt: Date;

  // Populated via join
  ingredient?: Ingredient;
}
```

**Relationships:**
- Many-to-One: InventoryItem → User (many inventory items belong to one user)
- Many-to-One: InventoryItem → Ingredient (each inventory item references an ingredient)

**Data Model Design Decisions:**

1. **UUIDs over Auto-increment IDs**: Enables offline creation without ID conflicts during sync
2. **Denormalized ingredientName in RecipeIngredient**: Handles custom ingredients not in global catalog without breaking foreign keys
3. **Version field on Recipe**: Enables optimistic locking for conflict detection during sync
4. **Arrays in PostgreSQL** (recipeIds, sharedVia): Leverages PostgreSQL's native array support for simple one-to-many without junction tables
5. **Separate Photo entity**: Allows multiple photos per recipe with granular metadata (primary photo, thumbnails)

---

## API Specification

Based on REST API selection from Tech Stack, the following OpenAPI 3.0 specification covers the critical endpoints from PRD Epics 1-7.

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: BMad Recette API
  version: 1.0.0
  description: |
    RESTful API for BMad Recette recipe management platform.

    **Authentication:** All endpoints except /auth/* require JWT Bearer token in Authorization header.

    **Base URL (Production):** https://api.bmadrecette.com
    **Base URL (Staging):** https://api-staging.bmadrecette.com

    **Rate Limits:**
    - Auth endpoints: 10 requests/minute
    - General API: 100 requests/minute
    - OCR endpoints: 5 requests/minute

servers:
  - url: https://api.bmadrecette.com
    description: Production server
  - url: https://api-staging.bmadrecette.com
    description: Staging server
  - url: http://localhost:3000
    description: Local development server

paths:
  # Authentication Endpoints
  /api/auth/register:
    post:
      summary: Register new user
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, firstName]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                firstName:
                  type: string
      responses:
        '201':
          description: User created successfully
        '409':
          description: Email already exists

  /api/auth/login:
    post:
      summary: Login with email/password
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Login successful
        '401':
          description: Invalid credentials

  # Recipe Endpoints
  /api/recipes:
    get:
      summary: Get user's recipes with filtering
      tags: [Recipes]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: tagIds
          in: query
          schema:
            type: string
          description: Comma-separated tag IDs
        - name: q
          in: query
          schema:
            type: string
          description: Search query
      responses:
        '200':
          description: Recipes retrieved successfully

    post:
      summary: Create new recipe
      tags: [Recipes]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [title, prepTime, cookTime, servings]
      responses:
        '201':
          description: Recipe created successfully

  /api/recipes/{id}:
    get:
      summary: Get recipe by ID
      tags: [Recipes]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Recipe details
        '404':
          description: Recipe not found

    put:
      summary: Update recipe
      tags: [Recipes]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Recipe updated

    delete:
      summary: Delete recipe
      tags: [Recipes]
      security:
        - bearerAuth: []
      responses:
        '204':
          description: Recipe deleted successfully

  # Shopping List Endpoints
  /api/shopping-lists/generate:
    post:
      summary: Generate shopping list from recipes
      tags: [Shopping Lists]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [recipeIds]
      responses:
        '201':
          description: Shopping list generated

  # Menu Endpoints
  /api/menus/generate:
    post:
      summary: Generate meal menu
      tags: [Menus]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [days, mealTypes]
      responses:
        '201':
          description: Menu generated

  # Sync Endpoints
  /api/sync/changes:
    get:
      summary: Get entities modified since timestamp
      tags: [Sync]
      security:
        - bearerAuth: []
      parameters:
        - name: since
          in: query
          required: true
          schema:
            type: string
            format: date-time
      responses:
        '200':
          description: Modified entities

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

**API Design Decisions:**

1. **RESTful Resource Naming**: Plural nouns (`/recipes`, `/shopping-lists`) following REST conventions
2. **Nested Routes for Relationships**: `/recipes/{id}/photos` clearly indicates photos belong to recipes
3. **Query Parameters for Filtering**: All list endpoints support filtering via query params (standard REST pattern)
4. **JWT Bearer Authentication**: Stateless auth, access tokens in Authorization header, refresh tokens for rotation
5. **OpenAPI 3.0 Spec**: Enables auto-generated client SDKs (TypeScript, Swift, Kotlin), Swagger UI documentation, request/response validation

---

## Components

Based on the architectural patterns, tech stack, and data models, these are the major logical components across both frontend and backend with clear boundaries and interfaces.

### Backend Components

#### AuthService (Backend)

**Responsibility:** Handles all authentication and authorization logic including user registration, login, OAuth integration, JWT token generation/validation, and session management.

**Key Interfaces:**
- `register(email, password, firstName): Promise<{ user, tokens }>`
- `login(email, password): Promise<{ user, tokens }>`
- `loginWithOAuth(provider, oauthCode): Promise<{ user, tokens }>`
- `refreshAccessToken(refreshToken): Promise<{ accessToken }>`
- `validateToken(token): Promise<User>`

**Dependencies:** PostgreSQL (User table), Redis (refresh token storage), Passport.js (OAuth strategies), bcrypt (password hashing)

**Technology Stack:** NestJS AuthModule with Passport.js guards, JWT strategy, bcrypt for hashing

#### RecipeService (Backend)

**Responsibility:** Core business logic for recipe CRUD operations, search/filtering, portion adjustment calculations, and recipe aggregation queries. Enforces ownership rules and manages recipe lifecycle.

**Key Interfaces:**
- `createRecipe(userId, recipeData): Promise<Recipe>`
- `getRecipe(recipeId, userId): Promise<Recipe>`
- `updateRecipe(recipeId, userId, updates): Promise<Recipe>`
- `deleteRecipe(recipeId, userId): Promise<void>`
- `searchRecipes(userId, filters): Promise<RecipeList>`
- `adjustPortions(recipeId, multiplier): Promise<Recipe>`

**Dependencies:** PostgreSQL, RecipeRepository, TagService, S3Service

**Technology Stack:** NestJS RecipeModule with RecipeService, RecipeRepository (Prisma), class-validator for DTOs

#### OCRService (Backend)

**Responsibility:** Handles OCR text extraction from recipe images, intelligent parsing of ingredients/steps, and temporary image storage. Manages Google Cloud Vision API integration with Tesseract.js fallback.

**Key Interfaces:**
- `scanRecipeImage(imageBuffer): Promise<OcrResult>`
- `parseRecipeText(extractedText): Promise<{ title, ingredients, steps }>`
- `uploadTemporaryImage(imageBuffer): Promise<{ tempUrl, expiresAt }>`

**Dependencies:** Google Cloud Vision API, Tesseract.js, S3Service

**Technology Stack:** NestJS OCRModule with Google Cloud Vision client library, Sharp for image optimization

#### ShoppingListService (Backend)

**Responsibility:** Generates shopping lists from recipes with intelligent ingredient aggregation, unit conversion, inventory deduction, and manages shopping list sharing/collaboration.

**Key Interfaces:**
- `generateShoppingList(userId, recipeIds, portionAdjustments): Promise<ShoppingList>`
- `aggregateIngredients(ingredients[]): Promise<AggregatedIngredient[]>`
- `convertUnits(quantity, fromUnit, toUnit): number`
- `shareShoppingList(listId, method, recipient): Promise<{ shareUrl }>`

**Dependencies:** PostgreSQL, InventoryService, RecipeService, SendGrid, Twilio

**Technology Stack:** NestJS ShoppingListModule with custom aggregation algorithms, SendGrid client, Twilio client

#### MenuGenerationService (Backend)

**Responsibility:** Implements intelligent menu generation algorithm with constraint satisfaction (variety balancing, tag constraints, time distribution) and partial regeneration logic.

**Key Interfaces:**
- `generateMenu(userId, config): Promise<Menu>`
- `balanceProteinVariety(recipes, days): Recipe[]`
- `applyTagConstraints(recipes, tagConstraints): Recipe[]`
- `regenerateMeal(menuId, dayNumber, mealType): Promise<Menu>`

**Dependencies:** PostgreSQL, RecipeService, TagService

**Technology Stack:** NestJS MenuModule with custom algorithm logic, Prisma for menu persistence

#### SyncService (Backend)

**Responsibility:** Manages cross-device synchronization with delta sync, conflict detection/resolution (last-write-wins), and sync queue coordination.

**Key Interfaces:**
- `getChangesSince(userId, timestamp): Promise<SyncChanges>`
- `detectConflict(entity, clientVersion, serverVersion): boolean`
- `resolveConflict(entity, strategy): Promise<Entity>`

**Dependencies:** PostgreSQL, Redis, All service modules

**Technology Stack:** NestJS SyncModule with Prisma for timestamp-based queries, Redis for distributed locking

### Frontend Components

#### RecipeLibrary (Frontend - Web & Mobile)

**Responsibility:** Displays user's recipe collection with filtering, sorting, search, and navigation to recipe details. Implements infinite scroll or pagination.

**Key Interfaces:**
- `loadRecipes(filters, page): Promise<RecipeListItem[]>`
- `searchRecipes(query): Promise<RecipeListItem[]>`
- `filterByTags(tagIds): void`
- `navigateToRecipe(recipeId): void`

**Dependencies:** RecipeAPIClient, RecipeStore, UI components

**Technology Stack:** React component (web), React Native component (mobile), Zustand for state, React Query for data fetching

#### RecipeDetail (Frontend - Web & Mobile)

**Responsibility:** Displays full recipe information including photos, ingredients, steps, tags, and actions (edit, delete, adjust portions, share).

**Key Interfaces:**
- `fetchRecipe(recipeId): Promise<Recipe>`
- `adjustPortions(multiplier): void`
- `rateRecipe(rating): Promise<void>`
- `deleteRecipe(): Promise<void>`

**Dependencies:** RecipeAPIClient, RecipeStore, UI components

**Technology Stack:** React component (web), React Native component (mobile), React Hook Form for edit mode

#### ShoppingListView (Frontend - Web & Mobile)

**Responsibility:** Displays shopping list items with check-off capability, organization mode switching (aisle/recipe/alphabetical), sharing, and offline support.

**Key Interfaces:**
- `loadShoppingList(listId): Promise<ShoppingList>`
- `toggleItemChecked(itemId): Promise<void>`
- `changeOrganization(mode): void`
- `shareList(method, recipient): Promise<void>`

**Dependencies:** ShoppingListAPIClient, ShoppingListStore, ShareService

**Technology Stack:** React component with checkbox lists, native share API (mobile), offline-first with IndexedDB/AsyncStorage

#### MenuGenerator (Frontend - Web & Mobile)

**Responsibility:** Configuration interface for menu generation with template selection, constraint setting, and calendar view display.

**Key Interfaces:**
- `generateMenu(config): Promise<Menu>`
- `selectTemplate(templateId): void`
- `setTagConstraints(constraints): void`
- `regenerateMeal(dayNumber, mealType): Promise<Menu>`

**Dependencies:** MenuAPIClient, RecipeAPIClient, MenuStore

**Technology Stack:** React component with calendar grid view, drag-and-drop (web), swipe actions (mobile)

#### APIClient (Frontend - Shared)

**Responsibility:** Centralized HTTP client for all API communication with authentication token injection, request/response interceptors, error handling, and offline queue management.

**Key Interfaces:**
- `get(endpoint, params): Promise<Response>`
- `post(endpoint, body): Promise<Response>`
- `put(endpoint, body): Promise<Response>`
- `delete(endpoint): Promise<Response>`
- `queueOfflineRequest(request): void`

**Dependencies:** axios, AuthStore, SyncQueue

**Technology Stack:** Axios with interceptors, retry logic, TypeScript interfaces from `packages/shared/`

### Component Interaction Diagram

```mermaid
graph TB
    subgraph "Frontend - Web/Mobile"
        RecipeLibrary[RecipeLibrary Component]
        RecipeDetail[RecipeDetail Component]
        ShoppingListView[ShoppingListView Component]
        MenuGenerator[MenuGenerator Component]
        APIClient[APIClient Service]
        OfflineStorage[OfflineStorage Service]
    end

    subgraph "Backend - NestJS Modules"
        APIGateway[API Gateway / Controllers]
        AuthService[AuthService]
        RecipeService[RecipeService]
        OCRService[OCRService]
        ShoppingListService[ShoppingListService]
        MenuGenerationService[MenuGenerationService]
        SyncService[SyncService]
    end

    subgraph "Data Layer"
        RecipeRepo[RecipeRepository]
        S3Service[S3Service]
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis)]
        S3[(AWS S3)]
    end

    RecipeLibrary --> APIClient
    RecipeDetail --> APIClient
    ShoppingListView --> APIClient
    MenuGenerator --> APIClient

    APIClient --> OfflineStorage
    APIClient --> APIGateway

    APIGateway --> AuthService
    APIGateway --> RecipeService
    APIGateway --> OCRService
    APIGateway --> ShoppingListService
    APIGateway --> MenuGenerationService
    APIGateway --> SyncService

    RecipeService --> RecipeRepo
    OCRService --> S3Service

    RecipeRepo --> PostgreSQL
    AuthService --> PostgreSQL
    AuthService --> Redis
    SyncService --> Redis
    S3Service --> S3
```

---

## External APIs

Based on PRD requirements, the system integrates with several third-party services for OCR, authentication, and communication.

### Google Cloud Vision API

- **Purpose:** OCR text extraction from scanned recipe images (cookbooks, magazines, printed recipes)
- **Documentation:** https://cloud.google.com/vision/docs/ocr
- **Base URL(s):** https://vision.googleapis.com/v1
- **Authentication:** API Key (server-side only, never exposed to clients)
- **Rate Limits:** 1,000 requests/month free tier, then $1.50 per 1,000 images

**Key Endpoints Used:**
- `POST /images:annotate` - Text detection with bounding boxes and confidence scores

**Integration Notes:** Fallback to Tesseract.js (open-source OCR) if quota exceeded. Implement exponential backoff for rate limit errors. Log confidence scores to track OCR accuracy.

### Google OAuth 2.0

- **Purpose:** User authentication via Google accounts
- **Documentation:** https://developers.google.com/identity/protocols/oauth2
- **Base URL(s):** https://accounts.google.com/o/oauth2/v2/auth
- **Authentication:** OAuth 2.0 authorization code flow
- **Rate Limits:** 10,000 requests/day

**Key Endpoints Used:**
- `GET /o/oauth2/v2/auth` - Initiate OAuth flow
- `POST /token` - Exchange authorization code for tokens

**Integration Notes:** Store only OAuth provider ID and email. Implement PKCE for mobile apps. Handle account linking scenarios.

### SendGrid Email API

- **Purpose:** Transactional emails for shopping list sharing and account notifications
- **Documentation:** https://docs.sendgrid.com/api-reference/
- **Base URL(s):** https://api.sendgrid.com/v3
- **Authentication:** API Key in Authorization header
- **Rate Limits:** 100 emails/day free tier

**Key Endpoints Used:**
- `POST /mail/send` - Send transactional email with template support

**Integration Notes:** Use dynamic templates for consistent branding. Track email opens/clicks via SendGrid analytics.

### Twilio Programmable Messaging API

- **Purpose:** SMS sharing for shopping lists
- **Documentation:** https://www.twilio.com/docs/sms/api
- **Base URL(s):** https://api.twilio.com/2010-04-01
- **Authentication:** HTTP Basic Auth with Account SID and Auth Token
- **Rate Limits:** Pay-per-message (~$0.0075/SMS)

**Key Endpoints Used:**
- `POST /Accounts/{AccountSid}/Messages.json` - Send SMS message with link to shopping list

**Integration Notes:** Generate short URLs for SMS. Validate phone numbers before sending. Rate limit per user (max 10/day) to prevent abuse.

### AWS S3 (Storage API)

- **Purpose:** Recipe photo storage, OCR scan storage, data export files
- **Documentation:** https://docs.aws.amazon.com/s3/
- **Authentication:** AWS Signature V4
- **Rate Limits:** 3,500 PUT/sec, 5,500 GET/sec

**Key Endpoints Used:**
- `PUT /{key}` - Upload object
- `GET /{key}` - Retrieve object
- `DELETE /{key}` - Remove object

**Integration Notes:** Front S3 with Cloudflare CDN. Use lifecycle policies to auto-delete temp OCR images after 24 hours. Generate presigned URLs for client uploads.

---

## Core Workflows

Illustrating critical user journeys with sequence diagrams showing component interactions.

### User Registration & First Login

```mermaid
sequenceDiagram
    actor User
    participant WebApp
    participant APIGateway
    participant AuthService
    participant PostgreSQL
    participant Redis

    User->>WebApp: Enter email, password, firstName
    WebApp->>WebApp: Validate form (client-side)
    WebApp->>APIGateway: POST /api/auth/register
    APIGateway->>AuthService: register(email, password, firstName)
    AuthService->>PostgreSQL: Check email uniqueness

    alt Email exists
        PostgreSQL-->>AuthService: Duplicate found
        AuthService-->>APIGateway: 409 Conflict
        APIGateway-->>WebApp: Error: Email exists
        WebApp->>User: Display error message
    else Email available
        AuthService->>AuthService: Hash password (bcrypt)
        AuthService->>PostgreSQL: INSERT user record
        PostgreSQL-->>AuthService: User created
        AuthService->>AuthService: Generate JWT tokens
        AuthService->>Redis: Store refresh token
        AuthService-->>APIGateway: {user, accessToken, refreshToken}
        APIGateway-->>WebApp: 201 Created
        WebApp->>User: Redirect to recipe library
    end
```

### Shopping List Generation & Sharing

```mermaid
sequenceDiagram
    actor User
    participant WebApp
    participant APIGateway
    participant ShoppingListService
    participant RecipeService
    participant PostgreSQL
    participant SendGrid

    User->>WebApp: Select 3 recipes + adjust portions
    WebApp->>APIGateway: POST /api/shopping-lists/generate
    APIGateway->>ShoppingListService: generateShoppingList(recipeIds, portions)

    ShoppingListService->>RecipeService: fetchRecipes(recipeIds)
    RecipeService->>PostgreSQL: SELECT recipes with ingredients
    PostgreSQL-->>RecipeService: Recipe data
    RecipeService-->>ShoppingListService: Recipes with ingredients

    ShoppingListService->>ShoppingListService: Aggregate ingredients
    ShoppingListService->>PostgreSQL: INSERT shopping_list
    ShoppingListService-->>APIGateway: ShoppingList object
    APIGateway-->>WebApp: 201 Created
    WebApp->>User: Display shopping list

    User->>WebApp: Click "Share via Email"
    WebApp->>APIGateway: POST /api/shopping-lists/{id}/share
    ShoppingListService->>PostgreSQL: Generate secure token
    ShoppingListService->>SendGrid: Send email
    SendGrid-->>ShoppingListService: Email sent
    ShoppingListService-->>WebApp: Success
```

---

## Database Schema

Transforming the conceptual data models into a concrete PostgreSQL schema with Prisma.

```prisma
// Prisma Schema for BMad Recette
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User & Authentication
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  firstName       String
  passwordHash    String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastSyncedAt    DateTime  @default(now())

  oauthProviders  OAuthProvider[]
  recipes         Recipe[]
  shoppingLists   ShoppingList[]
  menus           Menu[]
  inventory       InventoryItem[]
  customTags      Tag[]

  @@index([email])
  @@map("users")
}

model Recipe {
  id          String   @id @default(uuid())
  userId      String
  title       String
  description String?
  prepTime    Int
  cookTime    Int
  servings    Int
  rating      Int?
  source      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  version     Int      @default(1)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ingredients RecipeIngredient[]
  steps       RecipeStep[]
  photos      RecipePhoto[]
  tags        RecipeTag[]

  @@index([userId])
  @@index([title])
  @@map("recipes")
}

model Ingredient {
  id           String   @id @default(uuid())
  name         String   @unique
  category     String
  commonUnits  String[]
  averagePrice Float?
  priceUnit    String?
  createdAt    DateTime @default(now())

  recipeIngredients RecipeIngredient[]
  inventoryItems    InventoryItem[]

  @@index([name])
  @@map("ingredients")
}

model ShoppingList {
  id         String   @id @default(uuid())
  userId     String
  name       String
  recipeIds  String[]
  shareToken String?  @unique
  sharedVia  String[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items      ShoppingListItem[]

  @@index([userId])
  @@map("shopping_lists")
}

model Menu {
  id         String   @id @default(uuid())
  userId     String
  name       String
  startDate  DateTime @db.Date
  days       Int
  isFavorite Boolean  @default(false)
  templateId String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  meals      MenuMeal[]

  @@index([userId])
  @@map("menus")
}
```

---

## Frontend Architecture

### Component Organization

```
apps/web/src/
├── components/
│   ├── atoms/              # Basic building blocks
│   ├── molecules/          # Simple combinations
│   ├── organisms/          # Complex components
│   └── templates/          # Page layouts
├── pages/                  # React Router pages
├── hooks/                  # Custom React hooks
├── services/               # API clients
├── stores/                 # Zustand state
└── utils/                  # Helper functions
```

### State Management Architecture

Using Zustand for lightweight, performant state management with persistence for offline support.

```typescript
// State structure example
interface RecipeState {
  recipes: Recipe[];
  selectedRecipe: Recipe | null;
  isLoading: boolean;
  error: string | null;

  fetchRecipes: (filters?: RecipeFilters) => Promise<void>;
  createRecipe: (data: CreateRecipeDto) => Promise<Recipe>;
  updateRecipe: (id: string, data: UpdateRecipeDto) => Promise<Recipe>;
}
```

### Routing Architecture

Using React Router v6 with protected routes and layout components.

**Route Organization:**
- `/login`, `/register` - Public auth routes
- `/recipes` - Recipe library (protected)
- `/recipes/:id` - Recipe detail (protected)
- `/recipes/new` - Create recipe (protected)
- `/shopping-lists` - Shopping lists (protected)
- `/menus` - Menu generator (protected)

### Frontend Services Layer (API Client)

Centralized API client with interceptors for authentication, error handling, and offline queue management.

```typescript
class APIClient {
  private client: AxiosInstance;

  // Request interceptor: Add auth token
  // Response interceptor: Handle token refresh
  // Offline detection and queue management

  get<T>(url: string, params?: any): Promise<T>
  post<T>(url: string, data?: any): Promise<T>
  put<T>(url: string, data?: any): Promise<T>
  delete<T>(url: string): Promise<T>
}
```

---

## Backend Architecture

### Service Organization (NestJS Modules)

```
apps/api/src/
├── modules/
│   ├── auth/               # Authentication module
│   ├── recipes/            # Recipe management
│   ├── ocr/                # OCR processing
│   ├── shopping-lists/     # Shopping list generation
│   ├── menus/              # Menu generation
│   ├── sync/               # Cross-device sync
│   └── storage/            # S3 storage service
├── common/                 # Shared backend code
│   ├── filters/            # Exception filters
│   ├── interceptors/       # Logging
│   └── guards/             # Auth guards
└── prisma/                 # Prisma service
```

### Repository Pattern

All database access abstracted through repository interfaces to isolate ORM from business logic.

```typescript
@Injectable()
export class RecipesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Recipe | null>
  async findByUser(userId: string, filters: any): Promise<RecipeList>
  async create(data: RecipeCreateInput): Promise<Recipe>
  async update(id: string, data: RecipeUpdateInput): Promise<Recipe>
  async delete(id: string): Promise<void>
}
```

---

## Unified Project Structure

```
bmad-recette/
├── .github/                # CI/CD workflows
├── apps/
│   ├── web/                # React web application
│   ├── mobile/             # React Native (Expo) mobile app
│   └── api/                # NestJS backend application
├── packages/
│   ├── shared/             # Shared types/utilities
│   ├── ui/                 # Shared UI components
│   └── config/             # Shared configuration
├── scripts/                # Build/deploy/seed scripts
├── docs/                   # Documentation
├── turbo.json              # Turborepo configuration
└── package.json            # Root package.json
```

---

## Development Workflow

### Prerequisites

```bash
node --version    # v20.x LTS
npm --version     # v10.x
docker --version  # v24.x
```

### Initial Setup

```bash
git clone https://github.com/bmad/bmad-recette.git
cd bmad-recette
npm install
cp .env.example .env
docker-compose up -d
npm run db:migrate
npm run db:seed
```

### Development Commands

```bash
npm run dev              # Start all services
npm run build            # Build all apps
npm run test             # Run all tests
npm run lint             # ESLint
npm run type-check       # TypeScript
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
```

### Environment Configuration

**Backend (.env):**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/bmad_recette
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-aws-key
GOOGLE_CLOUD_VISION_API_KEY=your-api-key
```

**Frontend (.env.local):**
```bash
VITE_API_URL=http://localhost:3000/api
```

---

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment (Vercel):**
- Platform: Vercel
- Build Command: `cd apps/web && npm run build`
- Output Directory: `apps/web/dist`
- CDN/Edge: Vercel Edge Network

**Backend Deployment (Railway):**
- Platform: Railway
- Build Command: `cd apps/api && npm run build`
- Deployment Method: Docker container
- Database: Railway PostgreSQL (managed)
- Redis: Railway Redis (managed)

**Mobile Deployment:**
- iOS: TestFlight (staging), App Store (production)
- Android: Internal Testing (staging), Production Track
- OTA Updates: Expo Updates for JS changes

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yaml
name: CI Pipeline

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test -- --coverage
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|-------------|-------------|---------|
| Development | http://localhost:5173 | http://localhost:3000 | Local development |
| Staging | https://staging.bmadrecette.com | https://api-staging.bmadrecette.com | Pre-production testing |
| Production | https://app.bmadrecette.com | https://api.bmadrecette.com | Live environment |

---

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; img-src 'self' https://bmad-recette.s3.amazonaws.com`
- XSS Prevention: React's built-in escaping, DOMPurify for user content
- Secure Storage: JWT in memory, refresh tokens in httpOnly cookies

**Backend Security:**
- Input Validation: class-validator on all DTOs
- Rate Limiting: 100 req/min (general), 10 req/min (auth), 5 req/min (OCR)
- CORS Policy: Allow only app.bmadrecette.com, staging.bmadrecette.com

**Authentication Security:**
- Token Storage: Access tokens 15 min, refresh tokens 7 days
- Session Management: Refresh tokens in Redis with auto-expiration
- Password Policy: Min 8 chars, 1 uppercase, 1 number

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: <300KB initial bundle (gzipped)
- Loading Strategy: Code splitting by route, lazy loading
- Caching Strategy: Service Worker caches recipes for 7 days

**Backend Performance:**
- Response Time Target: P95 <500ms
- Database Optimization: Indexed foreign keys, covering indexes
- Caching Strategy: Redis caches ingredient catalog (1h), system tags (24h)

---

## Testing Strategy

### Testing Pyramid

```
        E2E Tests (5-7 paths)
       /                    \
      Integration Tests
     /                      \
    Frontend Unit    Backend Unit
```

### Test Organization

**Frontend Tests:**
- Component tests with React Testing Library
- Hook tests with testing utilities
- API service tests with mocked responses

**Backend Tests:**
- Unit tests for services and repositories
- Integration tests for API endpoints
- E2E tests for critical user journeys

**E2E Tests:**
- Login/register flow
- Create/edit recipe
- Generate shopping list
- Generate menu

---

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define types in `packages/shared/types` and import from `@bmad/shared/types`
- **API Calls:** Use centralized `apiClient` service, never direct fetch
- **Environment Variables:** Access through typed config objects, never `process.env` directly
- **Error Handling:** All API routes use standard `HttpExceptionFilter`
- **State Updates:** Never mutate Zustand state directly
- **Database Access:** All queries through Repository pattern
- **Authentication:** Never store sensitive data in frontend state
- **File Uploads:** Always validate type and size on backend

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `UserProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/user-profile` |
| Database Tables | - | snake_case | `user_profiles` |

---

## Error Handling Strategy

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Error Flow

Client makes request → API validates → Service processes → Catches errors → HttpExceptionFilter formats → Client receives standardized error → Displays user-friendly message → Logs to Sentry

---

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Sentry (React SDK) - error tracking, performance monitoring
- **Backend Monitoring:** Sentry (Node SDK) + Railway metrics
- **Error Tracking:** Sentry for unified error grouping
- **Performance Monitoring:** Sentry Performance + Railway APM

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- JavaScript errors
- API response times
- User interactions

**Backend Metrics:**
- Request rate (requests/second)
- Error rate (5xx errors/total)
- Response time (P50, P95, P99)
- Database query performance
- OCR API usage

---

## Next Steps

### For Development Team

1. Review and validate architecture decisions
2. Set up development environment following Development Workflow
3. Initialize monorepo structure with Turborepo
4. Implement database schema with Prisma
5. Begin Epic 1: Foundation & Core Authentication

### For Product Owner

Hand off to UX Expert for detailed UI/UX architecture and wireframes, referencing this document for technical constraints and component boundaries.

---

**Document Status:** Complete v0.1
**Date:** 2026-01-06
**Author:** Winston (Architect Agent)
**Next Action:** Development team review and environment setup
