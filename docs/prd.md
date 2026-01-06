# BMad Recette Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Enable users to centralize all recipe sources (physical books, magazines, websites, personal creations) into a single accessible platform
- Reduce meal planning time from 2-3 hours to under 15 minutes per week through intelligent menu generation
- Minimize food waste by 50%+ through ingredient-based recipe suggestions and inventory tracking
- Streamline grocery shopping with automated, aggregated shopping lists that respect user preferences
- Provide seamless cross-platform experience (web + mobile) with offline access

### Background Context

BMad Recette addresses a critical pain point in modern cooking: **fragmentation**. Home cooks today manage recipes across dozens of sources—physical cookbooks, magazine clippings, bookmarked websites, and handwritten notes—creating friction at every step of the culinary journey. This fragmentation leads to wasted time searching for recipes, wasted money on redundant purchases, and wasted food from poor inventory management.

While competitors offer isolated solutions (recipe databases, shopping list apps, or meal planners), BMad Recette is the first platform to unify the entire culinary workflow. Our OCR scanning technology allows users to digitize recipes from any physical source, our intelligent tagging system enables precise filtering and suggestions, and our automated shopping list generation eliminates manual aggregation. The application serves three primary user segments: busy young professionals seeking efficiency, budget-conscious parents minimizing waste, and culinary enthusiasts organizing extensive collections.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2026-01-06 | 0.1 | Initial PRD draft from Project Brief | John (PM Agent) |

## Requirements

### Functional

**Recipe Management**

- FR1: Users shall be able to manually create recipes with structured fields: title, ingredients (quantity + unit + name), numbered preparation steps, prep/cook time, and servings
- FR2: The system shall provide auto-completion from a database of 500-1000 common ingredients during recipe creation
- FR3: Users shall be able to upload one or more photos for each recipe
- FR4: Users shall be able to scan recipes from physical sources (books, magazines) using OCR with post-scan editing capabilities
- FR5: The system shall provide 5-10 recipe templates (dessert, main course, appetizer, etc.) for rapid creation
- FR6: Users shall be able to adjust recipe portions using a multiplier (x0.5, x2, x4, custom) with automatic quantity recalculation

**Tagging & Organization**

- FR7: The system shall support 6 default tag categories: Time/Effort, Diet/Health, Dish Type, Occasion, World Cuisine, and Budget
- FR8: The system shall provide 100+ predefined tags spanning all categories
- FR9: Users shall be able to assign multiple tags to a single recipe simultaneously
- FR10: Users shall be able to create custom tags that persist in their personal tag library
- FR11: Users shall be able to rate recipes using a 1-5 star system without comments
- FR12: Users shall be able to search recipes by name, ingredients, or any combination of tags

**Shopping Lists**

- FR13: Users shall be able to select multiple recipes via checkbox interface to generate a combined shopping list
- FR14: The system shall automatically aggregate duplicate ingredients across selected recipes with intelligent unit conversion
- FR15: Users shall be able to adjust portions for each recipe before generating the shopping list
- FR16: Users shall be able to organize shopping lists by aisle/category, by recipe, or alphabetically, changeable in real-time
- FR17: Users shall be able to mark ingredients as "already in stock" to exclude them from the generated list
- FR18: Users shall be able to check off items as purchased during shopping with persistent state
- FR19: Users shall be able to share shopping lists via SMS, email, or shareable link with real-time collaboration
- FR20: The system shall provide estimated cost for shopping lists based on average ingredient prices

**Ingredient-Based Suggestions**

- FR21: Users shall be able to manually enter available ingredients via checklist or free-form search
- FR22: The system shall maintain a simple inventory of saved ingredients with quick update capability
- FR23: The system shall display recipes with 100% ingredient match (exact) and partial match (with missing ingredients listed)
- FR24: The system shall prioritize recipe results by percentage of available ingredients matched
- FR25: Users shall be able to apply filters (prep time, difficulty, diet tags) to ingredient-based suggestions
- FR26: For partial-match recipes, the system shall clearly display which ingredients need to be purchased

**Menu Generation**

- FR27: Users shall be able to generate menus for 1-14 days with 1-3 meals per day (breakfast, lunch, dinner, snack)
- FR28: The system shall automatically balance menu variety by avoiding repetition of main ingredients and alternating protein types
- FR29: Users shall be able to filter menu generation by tag constraints (e.g., "only quick recipes" or "vegetarian 3 days/week")
- FR30: Users shall be able to regenerate specific meals within a menu while keeping others fixed
- FR31: The system shall provide pre-configured menu templates (vegetarian week, batch cooking, quick meals, etc.)
- FR32: Users shall be able to save complete menus as favorites for reuse
- FR33: Users shall be able to generate a shopping list for an entire menu with one action

**User Management & Sync**

- FR34: Users shall be able to create accounts using email/password or OAuth (Google, Apple)
- FR35: The system shall provide guided onboarding in 3 steps or fewer
- FR36: The system shall synchronize all user data in real-time across web and mobile platforms
- FR37: Users shall be able to access their recipes and data offline with automatic sync upon reconnection
- FR38: Users shall be able to export their complete data as JSON for backup
- FR39: Users shall be able to import data from a backup file

### Non Functional

- NFR1: The web application shall achieve Time to Interactive (TTI) under 3 seconds on 4G connections
- NFR2: Cross-device synchronization shall complete within 2 seconds of data modification
- NFR3: OCR processing shall complete within 10 seconds for a standard A4 page
- NFR4: Menu generation shall complete within 5 seconds for a 7-day meal plan
- NFR5: The system shall support 100% offline functionality for viewing and using saved recipes
- NFR6: The mobile application shall be compatible with iOS 14+ and Android 10+
- NFR7: The web application shall be compatible with Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+
- NFR8: The system shall encrypt all data at rest and in transit using industry-standard protocols (TLS/SSL)
- NFR9: The system shall comply with RGPD/GDPR requirements including right to deletion and data export
- NFR10: The system shall provide a conflict resolution strategy ("last-write-wins") for offline sync conflicts in MVP
- NFR11: Infrastructure costs shall remain under €200/month for up to 1,000 active users
- NFR12: The system shall maintain 99.5% uptime during peak usage hours (6 PM - 9 PM local time)

## User Interface Design Goals

### Overall UX Vision

BMad Recette's UX embodies **effortless efficiency**—a clean, intuitive interface that eliminates friction at every interaction. The design philosophy prioritizes speed and clarity: users should be able to create a recipe in under 2 minutes, generate a weekly menu in 3 clicks, and navigate their entire collection with zero cognitive load. We embrace a "progressive disclosure" approach where power features remain accessible but don't overwhelm novice users. Visual hierarchy guides users naturally from recipe discovery → selection → action (cook, shop, share), with contextual actions surfacing exactly when needed.

### Key Interaction Paradigms

- **Gesture-first on mobile**: Swipe to mark shopping items complete, long-press for quick actions, pull-to-refresh recipe feed
- **Keyboard shortcuts on web**: Quick recipe creation (Cmd+N), global search (Cmd+K), instant tag filtering
- **Smart defaults with easy overrides**: Menu generator pre-fills sensible options but allows full customization in one tap
- **Real-time feedback**: Live search results as you type, instant tag filters, immediate portion recalculation
- **Contextual intelligence**: When viewing a recipe, surface related actions (add to menu, generate shopping list, find similar)
- **Forgiving UX**: Undo/redo for major actions, auto-save drafts, graceful offline degradation with clear sync status

### Core Screens and Views

From a product perspective, these are the critical screens necessary to deliver the PRD's value:

- **Onboarding Flow** (3 screens max: Welcome → Auth → Quick Setup)
- **Recipe Library** (Grid/list view with filtering, sorting, search)
- **Recipe Detail View** (Full recipe display with photo, ingredients, steps, tags)
- **Recipe Create/Edit** (Structured form or OCR scan flow)
- **Tag Management** (Browse/filter by tag categories)
- **Shopping List Generator** (Recipe selection → portion adjustment → list output)
- **Shopping List View** (Organized list with check-off capability and share options)
- **Available Ingredients Input** (Checklist or search-based ingredient selector)
- **Recipe Suggestions by Ingredients** (Match results with percentage, missing items)
- **Menu Generator** (Configuration screen → generated menu display → edit/regenerate)
- **Saved Menus** (Library of favorite menus for reuse)
- **Settings/Profile** (Account management, preferences, data export/import)

### Accessibility: WCAG AA

The application will target **WCAG 2.1 Level AA compliance** to ensure usability for users with disabilities. This includes:

- Proper color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation for all interactive elements
- Screen reader compatibility with semantic HTML and ARIA labels
- Focus indicators for keyboard users
- Resizable text up to 200% without loss of functionality
- Alternative text for all images (recipe photos)

**Rationale**: AA is the standard for most commercial applications and legally required in many jurisdictions. AAA would be excessive for MVP given resource constraints, but AA demonstrates commitment to inclusivity without over-engineering.

### Branding

**Visual Style**: Modern, clean, and appetizing. The design should feel professional yet warm—inspiring confidence in organization while maintaining the joy of cooking.

**Color Palette**:
- Primary: Warm, inviting tones that evoke food (terracotta, warm greens, natural browns)
- Accent: Fresh, energetic colors for CTAs (vibrant orange or green for "Generate Menu," "Create Recipe")
- Neutral: Clean whites and light grays for backgrounds, ensuring recipe photos pop

**Typography**: Sans-serif for clarity and modern feel. Readable at small sizes for ingredient lists, elegant at large sizes for recipe titles.

**Imagery**: High-quality food photography is central—users' uploaded photos should be showcased prominently. Empty states should use appetizing illustrations (not generic stock photos).

**Tone**: Friendly, encouraging, practical. Copy should be concise and action-oriented ("Let's cook!" not "Please proceed to recipe preparation").

**Assumption**: No existing brand guidelines provided, so I've proposed a warm, food-centric aesthetic that differentiates from clinical competitor apps (like meal-tracking apps) while maintaining professionalism.

### Target Device and Platforms: Web Responsive + All Mobile Platforms

- **Web**: Fully responsive design supporting desktop (1920px+), tablet (768px-1024px), and mobile web (320px-767px)
- **Mobile Native**: iOS app (iPhone and iPad) + Android app (phones and tablets)
- **Progressive Web App (PWA)**: Web version installable as PWA for offline capability and home screen access
- **Cross-platform parity**: Feature parity across all platforms—users should have identical capabilities whether on web or native mobile
- **Offline-first architecture**: All platforms must support offline viewing of saved recipes and sync when reconnected

**Design Implications**:
- Mobile-first design approach (design for smallest screen, scale up)
- Touch targets minimum 44x44px for mobile usability
- Simplified navigation for mobile (bottom tab bar), expanded for desktop (sidebar)
- Responsive layouts that reflow gracefully across breakpoints

## Technical Assumptions

### Repository Structure: Monorepo

**Decision**: Use a **monorepo architecture** managed with Turborepo or Nx.

**Structure**:
```
/packages
  /web           (React web application)
  /mobile        (React Native mobile application)
  /backend       (NestJS API server)
  /shared        (Shared TypeScript types, utilities, business logic)
  /database      (PostgreSQL schema, migrations, seeds)
```

**Rationale**:
- **Code sharing**: Common types (Recipe, Tag, User models), validation logic, and utilities can be shared across web, mobile, and backend
- **Atomic changes**: A single PR can update API contract, backend implementation, and frontend consumers simultaneously
- **Simplified dependency management**: Single package.json for shared dependencies reduces version conflicts
- **Developer experience**: Single `npm install`, unified build/test commands
- **Trade-off**: Monorepo tooling has learning curve, but Turborepo/Nx provide excellent DX for TypeScript projects

### Service Architecture

**Decision**: **Monolithic API architecture** for MVP with modular internal structure to enable future microservices extraction.

**Architecture**:
- Single NestJS backend application deployed as one unit
- Internally organized into modules: AuthModule, RecipeModule, TagModule, ShoppingListModule, MenuModule, OCRModule, SyncModule
- Single PostgreSQL database with normalized schema
- Redis for session management and real-time sync coordination

**Rationale**:
- **Development speed**: Monolith is faster to build for MVP (no distributed systems complexity)
- **Lower operational overhead**: Single deployment, simpler debugging, no inter-service communication
- **Cost efficiency**: One server instance vs. multiple microservices (critical for €200/month budget)
- **Future-proofing**: Modular code structure allows extracting OCRModule or MenuModule into separate services if scaling requires it
- **Trade-off**: Monolith can become unwieldy at scale, but MVP targets <10K users where this is not a concern

**Future Considerations for V2**:
- OCRModule → Separate OCR microservice (CPU-intensive, independently scalable)
- MenuGenerationModule → Separate service if AI/ML features added
- Real-time sync could use WebSocket gateway service

### Testing Requirements

**Decision**: **Comprehensive testing pyramid** with unit tests, integration tests, and E2E tests for critical paths.

**Testing Strategy**:

**Unit Tests** (Target: 80%+ coverage for business logic):
- Jest for backend (NestJS modules, services, utilities)
- Jest + React Testing Library for frontend components
- Focus on: Tag filtering logic, ingredient aggregation algorithm, menu generation balancing, portion calculation

**Integration Tests** (API Contract Testing):
- Supertest for API endpoint testing
- Test database interactions with test PostgreSQL instance
- Focus on: Recipe CRUD, shopping list generation, menu generation, OCR workflow

**End-to-End Tests** (Critical User Journeys):
- Playwright for web, Detox for React Native
- Focus on: Onboarding flow, recipe creation → menu generation → shopping list, OCR scan workflow
- **Scope**: E2E for 5-7 critical paths only (expensive to maintain)

**Manual Testing Convenience**:
- Seed scripts for development database (50+ sample recipes with realistic tags)
- Postman/Insomnia collection for API testing
- Storybook for UI component development and visual testing

**CI/CD Integration**:
- Unit tests run on every commit (fast feedback)
- Integration tests run on PR creation
- E2E tests run nightly and before production deployment

**Rationale**:
- **Balanced approach**: Full pyramid prevents over-reliance on slow E2E tests while ensuring quality
- **ROI focus**: Unit test business logic (cheap, fast), E2E test user value (expensive, slower)
- **Manual testing support**: Seed data and API collections accelerate developer testing cycles
- **Trade-off**: Comprehensive testing increases initial development time by ~20%, but reduces post-launch bug fixes significantly

### Additional Technical Assumptions and Requests

**Frontend Technology Stack**:

- **Web Framework**: React 18+ with TypeScript
- **Mobile Framework**: React Native with Expo (managed workflow for MVP)
- **State Management**: Zustand (lightweight, simpler than Redux for MVP scope)
- **UI Component Library**: Tailwind CSS + Headless UI (web), React Native Paper (mobile)
- **Forms**: React Hook Form with Zod validation (type-safe, performant)
- **Routing**: React Router v6 (web), React Navigation (mobile)
- **PWA**: Workbox for service worker management and offline caching

**Backend Technology Stack**:

- **Runtime**: Node.js 20 LTS with TypeScript
- **Framework**: NestJS (enterprise structure, dependency injection, modular)
- **API Style**: REST for MVP (GraphQL considered for V2 if query flexibility needed)
- **Authentication**: Passport.js with JWT strategy + OAuth (Google, Apple via passport-google-oauth20, passport-apple)
- **OCR Service**: Google Cloud Vision API (primary), AWS Textract (fallback option if cost/accuracy concerns arise)
- **File Upload**: Multer for image uploads, image optimization with Sharp
- **Validation**: class-validator and class-transformer (NestJS ecosystem)

**Database & Storage**:

- **Primary Database**: PostgreSQL 15+ (JSONB for flexible tag metadata, full-text search built-in)
- **Cache/Session Store**: Redis 7+ (session management, rate limiting, real-time sync coordination)
- **Full-Text Search**: PostgreSQL native tsvector (MVP), consider Elasticsearch if performance inadequate at scale
- **File Storage**: AWS S3 (recipe photos, OCR scans, export files)
- **Migrations**: TypeORM (integrated with NestJS) or Prisma (better DX, modern)

**DevOps & Infrastructure**:

- **Backend Hosting**: Railway (MVP - simple, affordable) OR Render OR AWS Elastic Beanstalk
- **Frontend Hosting**: Vercel (web app - automatic deployments, edge caching), App Store + Google Play (mobile)
- **CDN**: Cloudflare (free tier adequate for MVP, caches images and static assets)
- **CI/CD**: GitHub Actions (free for public/small private repos, excellent TypeScript ecosystem)
- **Monitoring**: Sentry (error tracking, performance monitoring), Mixpanel or Amplitude (product analytics)
- **Logging**: Structured JSON logging with Pino (NestJS compatible), centralized with Logtail or Axiom

**Security & Compliance**:

- **HTTPS Everywhere**: TLS 1.3 mandatory for all API communication
- **Data Encryption**: AES-256 for data at rest (database encryption), TLS for in-transit
- **Authentication**: JWT access tokens (15 min expiry) + refresh tokens (7 day expiry, stored in httpOnly cookies)
- **Rate Limiting**: Express rate limiter (100 req/min per IP for auth endpoints, 500 req/min for general API)
- **CORS**: Strict origin validation (web app domains only)
- **Input Sanitization**: Helmet.js for HTTP headers, validation pipes for all API inputs
- **RGPD Compliance**: Data retention policies, user data export endpoint, account deletion workflow, cookie consent

**Real-Time Sync & Offline**:

- **Sync Strategy**: Optimistic UI updates with server reconciliation
- **Conflict Resolution**: Last-write-wins (timestamp-based) for MVP, versioned resolution for V2
- **Offline Storage**: IndexedDB (web via Dexie.js), AsyncStorage (React Native)
- **Sync Protocol**: Polling (every 30 seconds when active) for MVP, WebSocket upgrade for V2
- **Partial Sync**: Only sync changed entities (delta sync) to minimize bandwidth

**Third-Party Integrations**:

- **Email Service**: SendGrid (transactional emails, sharing shopping lists via email)
- **SMS Service**: Twilio (shopping list sharing via SMS)
- **OAuth Providers**: Google OAuth 2.0, Apple Sign-In
- **OCR**: Google Cloud Vision API (preferred for accuracy), fallback to Tesseract.js (open-source, lower cost)
- **Analytics**: Mixpanel (user behavior), Google Analytics 4 (web traffic)

**Development Workflow**:

- **Version Control**: Git with GitHub (branch protection, PR reviews required)
- **Branching Strategy**: Trunk-based development (main branch + short-lived feature branches)
- **Code Quality**: ESLint + Prettier (enforced in pre-commit hooks with Husky), TypeScript strict mode
- **Pre-commit Hooks**: Lint-staged for formatting, type-checking on staged files
- **Environment Management**: dotenv for local development, platform-specific env vars for deployment
- **Database Seeding**: Faker.js for generating realistic seed data (recipes, tags, users)

**Cost Constraints & Optimization**:

- **Target**: €200/month for first 1,000 users
- **Free Tier Usage**: Maximize free tiers (Vercel, Railway, Cloudflare, Google Cloud Vision API)
- **Image Optimization**: Compress uploads with Sharp (reduce S3 storage costs)
- **CDN Caching**: Aggressive caching policies for recipe images (immutable URLs)
- **Database Connection Pooling**: Limit connections to stay within free tier (e.g., Railway: 100 connections)
- **OCR Cost Management**: Batch OCR requests, cache results aggressively, consider Tesseract.js for non-critical accuracy scenarios

## Epic List

### Epic 1: Foundation & Core Authentication
Establish project infrastructure, authentication system, and basic user management to create a deployable foundation with initial health-check capability.

### Epic 2: Recipe Management Core
Enable users to create, view, edit, and organize recipes with manual entry, photo uploads, templates, and the intelligent tagging system that serves as the application's nervous system.

### Epic 3: OCR Scanning & Recipe Import
Implement OCR scanning capability to digitize recipes from physical sources (books, magazines), enabling users to centralize their existing recipe collections.

### Epic 4: Shopping List Intelligence
Build the complete shopping list generation system with recipe selection, intelligent ingredient aggregation, multiple organization modes, and sharing capabilities.

### Epic 5: Ingredient-Based Recipe Suggestions
Develop the ingredient inventory system and matching algorithm that suggests recipes based on available ingredients, reducing food waste and inspiring cooking decisions.

### Epic 6: Smart Menu Generation
Implement the intelligent menu generator with balancing algorithms, customizable templates, and seamless integration with shopping list generation.

### Epic 7: Cross-Platform Sync & Offline Support
Enable real-time synchronization across web and mobile platforms with robust offline functionality and conflict resolution.

## Epic Details

### Epic 1: Foundation & Core Authentication

**Goal**: Establish a production-ready foundation including project infrastructure (monorepo, CI/CD), basic deployment pipeline, authentication system (email/password + OAuth), and user management. Upon completion, the system will be deployable with functional health-check endpoints and user registration/login capability.

#### Story 1.1: Project Setup & Monorepo Infrastructure

As a **developer**,
I want **a properly configured monorepo with all packages scaffolded and build tools configured**,
so that **I can develop web, mobile, and backend applications with shared code and unified workflows**.

**Acceptance Criteria:**

1. Monorepo structure created using Turborepo or Nx with `/packages` directory containing: web, mobile, backend, shared, database folders
2. TypeScript configured in strict mode across all packages with shared tsconfig base
3. ESLint and Prettier configured with pre-commit hooks (Husky + lint-staged) enforcing code quality
4. Package.json scripts created for: install, build, dev, test, lint across all workspaces
5. Git repository initialized with .gitignore covering node_modules, build artifacts, env files, and IDE configs
6. README.md created with setup instructions, architecture overview, and development commands

#### Story 1.2: Backend API Foundation & Database Setup

As a **developer**,
I want **a NestJS backend API with PostgreSQL database, basic middleware, and health-check endpoint**,
so that **I have a deployable backend foundation with database connectivity verified**.

**Acceptance Criteria:**

1. NestJS application scaffolded with modular architecture (AppModule structure)
2. PostgreSQL database connection configured using TypeORM or Prisma with environment-based config
3. Redis connection configured for session management (connection verified on startup)
4. Database migrations framework set up with initial schema migration (users table placeholder)
5. Helmet.js configured for security headers, CORS middleware enabled with configurable origins
6. Health-check endpoint implemented at GET /api/health returning {status: "ok", timestamp, version}
7. Structured logging configured using Pino with JSON output format
8. Environment variable management implemented using dotenv with .env.example template

#### Story 1.3: CI/CD Pipeline & Automated Testing

As a **developer**,
I want **GitHub Actions CI/CD pipelines configured for automated testing and deployment**,
so that **code quality is verified on every commit and deployments are automated**.

**Acceptance Criteria:**

1. GitHub Actions workflow created for PR validation (lint, type-check, unit tests) running on every push
2. Test coverage reporting configured to fail PR if coverage drops below 70% for new code
3. Separate workflow created for deployment to staging environment (triggered on merge to main)
4. Environment secrets management configured in GitHub (database URLs, API keys placeholders)
5. Build caching implemented to optimize CI run times (npm cache, TypeScript incremental builds)
6. Status checks configured as required for PR merging (tests must pass, linting must pass)

#### Story 1.4: User Registration with Email/Password

As a **new user**,
I want **to create an account using my email and password**,
so that **I can access the BMad Recette platform and save my data**.

**Acceptance Criteria:**

1. POST /api/auth/register endpoint created accepting {email, password, firstName} with validation
2. Email validation enforces valid format; password validation enforces minimum 8 characters, 1 uppercase, 1 number
3. Password hashing implemented using bcrypt before storage (never store plaintext)
4. User record created in PostgreSQL users table with unique email constraint
5. Registration returns 201 Created with user object (excluding password) and JWT access + refresh tokens
6. Duplicate email registration returns 409 Conflict with clear error message
7. Rate limiting applied: max 5 registration attempts per IP per hour

#### Story 1.5: User Login with Email/Password

As a **registered user**,
I want **to log in using my email and password**,
so that **I can access my recipes and personalized data**.

**Acceptance Criteria:**

1. POST /api/auth/login endpoint created accepting {email, password} with validation
2. Email lookup case-insensitive, password verified using bcrypt compare
3. Successful login returns 200 OK with user object and JWT access token (15 min expiry) + refresh token (7 days expiry)
4. Failed login returns 401 Unauthorized without revealing whether email or password was incorrect
5. Refresh token stored in httpOnly cookie (secure, sameSite: strict) for security
6. Rate limiting applied: max 10 login attempts per IP per hour to prevent brute force
7. Failed login attempts logged for security monitoring

#### Story 1.6: OAuth Authentication (Google & Apple)

As a **new or existing user**,
I want **to sign in using my Google or Apple account**,
so that **I can access the app quickly without managing another password**.

**Acceptance Criteria:**

1. Passport.js configured with passport-google-oauth20 and passport-apple strategies
2. GET /api/auth/google endpoint initiates OAuth flow, callback at /api/auth/google/callback
3. GET /api/auth/apple endpoint initiates OAuth flow, callback at /api/auth/apple/callback
4. On successful OAuth callback, user created or retrieved from database using OAuth provider ID
5. New OAuth users have auto-generated profile with email from OAuth provider (if available)
6. OAuth login returns same JWT token structure as email/password login (access + refresh tokens)
7. Users can link multiple OAuth providers to same account (email as unique key)
8. OAuth configuration uses environment variables for client IDs and secrets

#### Story 1.7: JWT Token Refresh & Session Management

As a **logged-in user**,
I want **my session to be automatically renewed when my access token expires**,
so that **I don't have to log in repeatedly during active use**.

**Acceptance Criteria:**

1. POST /api/auth/refresh endpoint created accepting refresh token from httpOnly cookie
2. Refresh token validated (signature, expiration) and checked against Redis session store
3. Valid refresh returns new access token (15 min expiry) and optionally rotates refresh token
4. Expired or invalid refresh token returns 401 Unauthorized, requiring new login
5. POST /api/auth/logout endpoint created, invalidating refresh token in Redis and clearing cookie
6. Redis stores refresh tokens with TTL matching expiration (7 days), auto-cleanup on expiry
7. Concurrent refresh requests handled gracefully (idempotent within 5-second window)

#### Story 1.8: Web App Foundation & Authentication UI

As a **user**,
I want **a functional web application with login/register pages**,
so that **I can create an account and log in from my browser**.

**Acceptance Criteria:**

1. React 18+ application scaffolded with TypeScript, React Router v6, and Tailwind CSS
2. Login page created at /login with email and password inputs, "Sign in" button, and OAuth buttons (Google, Apple)
3. Registration page created at /register with email, password, firstName inputs and "Create account" button
4. Form validation implemented using React Hook Form + Zod (client-side validation mirrors backend rules)
5. Authentication state managed using Zustand store (token storage, user profile)
6. Protected route wrapper created, redirecting unauthenticated users to /login
7. JWT tokens stored in memory (access) and httpOnly cookie (refresh), automatic refresh on 401 responses
8. Loading states and error messages displayed for all auth actions (login, register, OAuth)

#### Story 1.9: Mobile App Foundation & Authentication UI

As a **mobile user**,
I want **a functional mobile app with login/register screens**,
so that **I can create an account and log in from my iOS or Android device**.

**Acceptance Criteria:**

1. React Native with Expo scaffolded in /packages/mobile with TypeScript
2. React Navigation configured with authentication flow (Auth stack vs. App stack)
3. Login screen created with email and password inputs, "Sign in" button, and OAuth buttons
4. Registration screen created with email, password, firstName inputs and "Create account" button
5. Form validation implemented using React Hook Form + Zod (matching web validation)
6. Authentication state managed using Zustand (shared store from /packages/shared)
7. JWT tokens stored in AsyncStorage with secure encryption (expo-secure-store)
8. OAuth flow implemented using expo-auth-session for Google and Apple
9. Loading states, error messages, and keyboard-aware scroll views implemented for good UX

#### Story 1.10: Deployment to Staging Environment

As a **developer**,
I want **the application deployed to a staging environment accessible via URL**,
so that **stakeholders can test the authentication flow and verify the foundation is production-ready**.

**Acceptance Criteria:**

1. Backend API deployed to Railway (or Render) with PostgreSQL and Redis provisioned
2. Web app deployed to Vercel with environment variables configured (API base URL)
3. Mobile app builds successfully for iOS (TestFlight) and Android (internal test track) - manual deployment for MVP
4. Staging environment accessible at predictable URLs (e.g., api-staging.bmadrecette.com, app-staging.bmadrecette.com)
5. Database migrations run automatically on deployment via CI/CD pipeline
6. Health-check endpoint verified returning 200 OK on staging
7. Staging environment uses separate database from production (staging data isolated)
8. Basic monitoring configured: Sentry for error tracking, uptime monitoring via health-check endpoint

### Epic 2: Recipe Management Core

**Goal**: Enable users to create, view, edit, and organize recipes through a complete CRUD system. Implement the foundational tag system architecture that powers all intelligent features (filtering, suggestions, menu generation). Upon completion, users can build their personal recipe library with rich metadata and powerful organization capabilities.

#### Story 2.1: Recipe Database Schema & Core Models

As a **developer**,
I want **a normalized database schema for recipes with all required relationships**,
so that **recipes can be stored with ingredients, steps, tags, and metadata efficiently**.

**Acceptance Criteria:**

1. Recipes table created with fields: id, userId, title, description, prepTime, cookTime, servings, createdAt, updatedAt
2. Ingredients table created with fields: id, name, category, commonUnits (for auto-completion database)
3. RecipeIngredients junction table with fields: recipeId, ingredientId, quantity, unit, notes
4. Steps table with fields: id, recipeId, stepNumber, instruction, duration
5. Photos table with fields: id, recipeId, s3Url, thumbnailUrl, isPrimary, uploadedAt
6. Foreign key constraints and indexes configured for optimal query performance
7. Database migration scripts created and tested with rollback capability
8. Seed script created populating 500-1000 common ingredients with categories

#### Story 2.2: Tag System Foundation & Database

As a **developer**,
I want **a flexible, extensible tag system that supports predefined and custom user tags**,
so that **the system can power filtering, search, suggestions, and menu generation**.

**Acceptance Criteria:**

1. TagCategories table created with 6 default categories: Time/Effort, Diet/Health, Dish Type, Occasion, World Cuisine, Budget
2. Tags table with fields: id, categoryId, name, slug, isSystem (true for predefined, false for user-created), userId (null for system tags)
3. RecipeTags junction table linking recipes to tags (many-to-many relationship)
4. 100+ predefined system tags seeded across all 6 categories (e.g., "Quick", "Vegetarian", "Dessert", "Budget-Friendly")
5. Unique constraint on (categoryId, slug) for system tags, (categoryId, slug, userId) for user tags
6. Tag assignment endpoint supports multiple tags in single operation (bulk insert)
7. Efficient indexing for tag-based queries (covering indexes on RecipeTags)

#### Story 2.3: Create Recipe API & Business Logic

As a **user**,
I want **to create a new recipe with all details via API**,
so that **I can store my recipes in the system**.

**Acceptance Criteria:**

1. POST /api/recipes endpoint created accepting structured recipe payload with validation
2. Request body includes: title (required), description, prepTime, cookTime, servings, ingredients array, steps array, tagIds array
3. Ingredients array validated: each item has quantity (number), unit (string), ingredientId or ingredientName
4. Steps array validated: instructions (required), stepNumber (auto-assigned if omitted), duration (optional)
5. Transaction-based creation: recipe + ingredients + steps + tags created atomically (rollback on failure)
6. Response returns 201 Created with complete recipe object including nested ingredients, steps, tags
7. Authorization enforced: recipes belong to authenticated user (userId from JWT)
8. Input sanitization prevents XSS and SQL injection attacks

#### Story 2.4: Recipe Photo Upload & Management

As a **user**,
I want **to upload one or more photos for my recipes**,
so that **I can visually identify and showcase my dishes**.

**Acceptance Criteria:**

1. POST /api/recipes/:id/photos endpoint accepts multipart/form-data with image file
2. Image validation: file size max 10MB, formats allowed: JPEG, PNG, WebP
3. Sharp library used to generate thumbnail (400x400) and optimize original image (compression, max 1920px width)
4. Images uploaded to S3 with unique filenames (userId/recipeId/uuid.ext), public-read ACL
5. Photo record created in database with s3Url, thumbnailUrl, fileSize, dimensions
6. First uploaded photo automatically marked as isPrimary (displayed in recipe cards)
7. PUT /api/recipes/:id/photos/:photoId/primary endpoint allows changing primary photo
8. DELETE /api/recipes/:id/photos/:photoId removes photo from S3 and database

#### Story 2.5: Get Recipe Details API

As a **user**,
I want **to retrieve full recipe details by ID**,
so that **I can view a recipe with all ingredients, steps, tags, and photos**.

**Acceptance Criteria:**

1. GET /api/recipes/:id endpoint returns complete recipe object
2. Response includes nested relationships: ingredients (with quantity, unit, name), steps (ordered by stepNumber), tags (with category), photos (with thumbnailUrl)
3. Authorization check: users can only access their own recipes (userId match)
4. 404 Not Found returned if recipe doesn't exist or belongs to another user
5. Response includes computed fields: totalTime (prepTime + cookTime), ingredientCount, stepCount
6. Efficient database query using joins (single query, not N+1)
7. Response format consistent with recipe list endpoint for frontend reusability

#### Story 2.6: Update Recipe API

As a **user**,
I want **to edit my existing recipes**,
so that **I can fix errors, add details, or adjust quantities**.

**Acceptance Criteria:**

1. PUT /api/recipes/:id endpoint accepts partial updates to recipe fields
2. Supports updating: title, description, prepTime, cookTime, servings, ingredients, steps, tags
3. Ingredients update replaces entire array (delete existing + insert new) within transaction
4. Steps update replaces entire array (delete existing + insert new) within transaction
5. Tags update uses upsert logic (add missing, remove extras) for efficiency
6. updatedAt timestamp automatically set to current time
7. Authorization enforced: only recipe owner can update
8. Optimistic locking prevents concurrent update conflicts (version field or updatedAt check)
9. Returns 200 OK with updated recipe object, or 409 Conflict if concurrent modification detected

#### Story 2.7: Delete Recipe API

As a **user**,
I want **to permanently delete recipes I no longer need**,
so that **I can keep my library organized and remove mistakes**.

**Acceptance Criteria:**

1. DELETE /api/recipes/:id endpoint soft-deletes or hard-deletes recipe
2. Cascade deletion removes: recipe ingredients, steps, tags associations, photo records from database
3. Photos deleted from S3 asynchronously (queued job to avoid blocking response)
4. Authorization enforced: only recipe owner can delete
5. Returns 204 No Content on successful deletion
6. Returns 404 Not Found if recipe doesn't exist or unauthorized
7. Deletion logged for audit trail (userId, recipeId, deletedAt timestamp)

#### Story 2.8: Recipe List & Filtering API

As a **user**,
I want **to view my recipe library with filtering and sorting options**,
so that **I can find recipes quickly based on various criteria**.

**Acceptance Criteria:**

1. GET /api/recipes endpoint returns paginated list of user's recipes
2. Query parameters supported: page, limit (default 20, max 100), sortBy (title, createdAt, prepTime), sortOrder (asc, desc)
3. Filtering by tags: ?tagIds=1,2,3 returns recipes matching ANY of the specified tags
4. Filtering by search query: ?q=chicken searches recipe title, description, and ingredient names (full-text search)
5. Filtering by time: ?maxTotalTime=30 returns recipes with totalTime ≤ 30 minutes
6. Each recipe in list includes: id, title, description, prepTime, cookTime, servings, primaryPhoto (thumbnail), tagIds, rating
7. Response includes pagination metadata: total, page, pageSize, totalPages
8. Efficient queries with proper indexing (avoid table scans on large datasets)

#### Story 2.9: Recipe Templates Implementation

As a **user**,
I want **to create recipes from predefined templates**,
so that **I can quickly add common recipe types without starting from scratch**.

**Acceptance Criteria:**

1. GET /api/recipe-templates endpoint returns list of 5-10 predefined templates
2. Templates include: Dessert, Main Course, Appetizer, Beverage, Salad, Soup, Breakfast, Snack
3. Each template has: name, icon, defaultTags (pre-selected tags), defaultFields (e.g., servings: 4), placeholderIngredients, placeholderSteps
4. POST /api/recipes/from-template endpoint accepts templateId and creates recipe pre-filled with template defaults
5. User can immediately edit the template-created recipe (it's a normal recipe, not linked to template)
6. Templates stored as JSON configuration (no database table needed for MVP)
7. Frontend displays templates as visual cards during recipe creation flow

#### Story 2.10: Portion Adjustment Algorithm

As a **user**,
I want **to adjust recipe portions using a multiplier**,
so that **I can scale ingredients for different serving sizes**.

**Acceptance Criteria:**

1. GET /api/recipes/:id/adjust-portions?multiplier=2 returns recipe with recalculated ingredient quantities
2. Multiplier validation: must be positive number, typically 0.25 to 10 (warn if outside range)
3. Quantity multiplication handles decimals correctly (e.g., 1.5 cups × 2 = 3 cups)
4. Unit conversion logic: 2 tbsp × 8 = 1 cup (smart conversion for common units)
5. Fractional display: 0.33 cups displayed as "1/3 cup" for readability (common fractions)
6. Non-scalable ingredients flagged: "to taste", "pinch", "dash" not multiplied
7. Response includes original servings and adjusted servings for reference
8. Adjustment is real-time calculation only (not saved to database unless user explicitly updates recipe)

#### Story 2.11: Recipe Rating System

As a **user**,
I want **to rate my recipes with 1-5 stars**,
so that **I can remember which recipes I loved and prioritize favorites**.

**Acceptance Criteria:**

1. PUT /api/recipes/:id/rating endpoint accepts {rating: 1-5}
2. Rating stored in recipes table (rating column, nullable, default null)
3. Rating validation: integer between 1 and 5, or null to remove rating
4. Only recipe owner can rate their own recipes (no social/public ratings in MVP)
5. Recipe list API includes rating field for filtering/sorting
6. GET /api/recipes?minRating=4 filters recipes with rating ≥ 4
7. Star rating UI component displays half-stars for future decimal ratings (even if MVP uses integers)

#### Story 2.12: Web Recipe Library UI

As a **user**,
I want **a web interface to view, create, and manage my recipes**,
so that **I can interact with my recipe collection from my browser**.

**Acceptance Criteria:**

1. Recipe Library page at /recipes displays grid/list view of recipes with toggle
2. Each recipe card shows: primary photo (or placeholder), title, rating stars, total time, tag badges (max 3 visible)
3. Search bar with real-time filtering (debounced API calls)
4. Tag filter sidebar with checkboxes for each category (collapsible categories)
5. Sort dropdown: Most Recent, Alphabetical, Shortest Time, Highest Rated
6. "Create Recipe" button opens recipe form modal or navigates to /recipes/new
7. Empty state for new users: "Get started by creating your first recipe" with illustration
8. Pagination controls at bottom (Previous, Page 1-N, Next)
9. Recipe cards clickable, navigate to /recipes/:id for detail view

#### Story 2.13: Web Recipe Detail & Edit UI

As a **user**,
I want **to view full recipe details and edit recipes from the web app**,
so that **I can see all information and make changes easily**.

**Acceptance Criteria:**

1. Recipe Detail page at /recipes/:id displays: large photo, title, description, prep/cook/total time, servings, rating
2. Ingredients section lists each ingredient with quantity, unit, name (with checkboxes for cooking mode)
3. Steps section displays numbered instructions with optional duration per step
4. Tags displayed as colored badges grouped by category
5. Action buttons: Edit Recipe, Delete Recipe, Adjust Portions (dropdown), Share (future)
6. Edit Recipe opens form in edit mode (inline or modal) with all fields populated
7. Form validation displays errors inline (required fields, format validation)
8. Portion adjustment shows real-time preview with slider/input (×0.5 to ×10 range)
9. Delete confirmation modal: "Are you sure? This cannot be undone."
10. Mobile-responsive layout: stacked on mobile, two-column on desktop

#### Story 2.14: Mobile Recipe Library & Detail UI

As a **mobile user**,
I want **to browse and view my recipes on my phone**,
so that **I can access recipes while shopping or cooking**.

**Acceptance Criteria:**

1. Recipe Library screen displays recipes in vertical scrollable list (infinite scroll or pagination)
2. Recipe cards optimized for mobile: large touch targets (min 44x44px), card height ~120px
3. Pull-to-refresh gesture reloads recipe list
4. Search bar at top with filter icon (opens filter bottom sheet)
5. Filter bottom sheet: tag checkboxes, time slider, rating filter, Apply/Clear buttons
6. Recipe Detail screen: full-screen photo at top, scrollable content below
7. Floating action buttons: Edit (pencil icon), Share, Adjust Portions (expand bottom sheet)
8. Ingredients and steps rendered in large, readable font (18px min for cooking readability)
9. Keep screen awake mode when viewing recipe (prevent auto-lock during cooking)
10. Swipe gesture to go back to library (native mobile pattern)


### Epic 3: OCR Scanning & Recipe Import

**Goal**: Enable users to digitize recipes from physical sources (cookbooks, magazines, printed recipes) using OCR technology. This differentiating feature allows users to centralize their entire recipe collection, including treasured family recipes and cookbook favorites that aren't available online.

#### Story 3.1: Google Cloud Vision API Integration

As a **developer**,
I want **Google Cloud Vision API integrated for OCR text extraction**,
so that **we can accurately extract text from recipe photos**.

**Acceptance Criteria:**

1. Google Cloud Vision API credentials configured via environment variables
2. OCR service module created in backend with methods: extractText(imageBuffer), processRecipeScan(imageUrl)
3. API calls include error handling for rate limits, network failures, invalid images
4. Response text extraction includes bounding boxes and confidence scores for future enhancements
5. Cost tracking implemented: log API calls to monitor free tier usage (1000 images/month)
6. Fallback to Tesseract.js if Cloud Vision quota exceeded (with quality warning to user)
7. Unit tests mock Cloud Vision responses for offline development

#### Story 3.2: OCR Scan API Endpoint

As a **user**,
I want **to upload a photo of a recipe and receive OCR-extracted text**,
so that **I can quickly digitize physical recipes**.

**Acceptance Criteria:**

1. POST /api/recipes/ocr-scan endpoint accepts multipart/form-data image file
2. Image validation: max 10MB, formats JPEG/PNG/WebP, resolution warning if <600px width
3. Image uploaded to S3 temporarily (deleted after 24 hours or successful recipe creation)
4. OCR processing returns extracted text with sections detected (title, ingredients, steps) as best-effort
5. Response includes: extractedText (raw), suggestedTitle, suggestedIngredients array, suggestedSteps array, confidence score
6. Processing completes within 10 seconds per NFR3, returns 202 Accepted if queued
7. Failed OCR returns 422 Unprocessable Entity with clear error message (e.g., "Text not detected")

#### Story 3.3: OCR Text Parsing & Structuring

As a **user**,
I want **OCR results intelligently parsed into recipe structure**,
so that **I spend less time manually editing the extracted text**.

**Acceptance Criteria:**

1. Natural language processing identifies recipe sections: title (first line/largest text), ingredients (lists with quantities), steps (numbered or bulleted instructions)
2. Ingredient parsing extracts: quantity (number), unit (cups, tbsp, g), name (chicken breast, flour) using regex patterns
3. Common recipe keywords detected: "Ingredients:", "Directions:", "Instructions:", "Serves", "Prep time"
4. Quantities normalized: "1/2" → 0.5, "two" → 2, "a pinch" → handled as non-numeric
5. Units standardized: "tablespoons" → "tbsp", "ounces" → "oz", handles plurals
6. Steps numbered automatically if original text uses bullets or lacks numbers
7. Parser handles multiple formats: magazine recipes, handwritten notes, cookbook pages

#### Story 3.4: Post-OCR Recipe Editor

As a **user**,
I want **an intuitive editor to review and correct OCR results before saving**,
so that **I can quickly fix any errors and finalize the recipe**.

**Acceptance Criteria:**

1. POST /api/recipes/from-ocr endpoint accepts: extractedText, suggestedTitle, suggestedIngredients, suggestedSteps, originalImageUrl
2. Editor UI displays side-by-side: original scanned image (left) and editable recipe form (right) on desktop
3. Form pre-populated with OCR suggestions: title, ingredients (editable table), steps (numbered textarea)
4. Inline corrections: click ingredient to edit quantity/unit/name, drag to reorder steps
5. "Add missing ingredient" and "Add missing step" buttons for incomplete OCR results
6. Original image remains visible during editing for reference (pinch-to-zoom on mobile)
7. Save button creates recipe with edited content, links to original scanned image as photo
8. "Discard" button deletes temporary S3 image and cancels creation

#### Story 3.5: OCR Scan Mobile UI

As a **mobile user**,
I want **to scan recipes using my phone camera**,
so that **I can digitize recipes from cookbooks while browsing at home or in stores**.

**Acceptance Criteria:**

1. "Scan Recipe" button in mobile app opens camera with overlay guide (recipe card frame)
2. Camera captures photo, shows preview with "Retake" or "Use Photo" options
3. Image cropping tool allows user to trim edges before uploading (improves OCR accuracy)
4. Upload progress indicator shows: "Uploading..." → "Processing with OCR..." → "Ready to edit"
5. Post-scan editor optimized for mobile: full-screen form with "View Original" toggle
6. Ingredients table scrollable horizontally on small screens
7. Save button creates recipe and navigates to Recipe Detail screen
8. Error handling: "Camera permission denied" prompt, "OCR failed, try manual entry" fallback

#### Story 3.6: OCR Scan Web UI

As a **web user**,
I want **to upload recipe photos from my computer for OCR scanning**,
so that **I can digitize recipes I've photographed or scanned**.

**Acceptance Criteria:**

1. "Scan Recipe" button in web app opens file picker (accept: image/jpeg, image/png, image/webp)
2. Drag-and-drop zone for image uploads with visual feedback
3. Image preview modal shows: thumbnail, file size, dimensions before upload
4. Upload button triggers OCR processing with animated progress bar
5. Post-scan editor displays: original image (left sidebar, zoomable), form (center), AI suggestions panel (right - optional)
6. Real-time validation: highlight unparsed ingredients (missing quantity or unit) in yellow
7. Keyboard shortcuts: Cmd+S to save, Cmd+Z to undo, Tab to navigate form fields
8. Batch upload future consideration: note in UI "Scan one recipe at a time in MVP"

#### Story 3.7: OCR Quality Feedback & Improvement

As a **product team**,
I want **to collect OCR accuracy data**,
so that **we can improve parsing algorithms and justify investment in better OCR**.

**Acceptance Criteria:**

1. OCR results logged to database: scanId, userId, confidence score, manualEditsCount, timeToEdit
2. manualEditsCount tracks: number of ingredient edits, step edits, title changes after OCR
3. Optional user feedback prompt: "How accurate was the scan? 👍 Good / 👎 Needs work"
4. Failed OCR attempts logged with image metadata for debugging (resolution, format, file size)
5. Weekly report generated: average confidence score, edit rate, failure rate
6. Dashboard shows OCR cost: API calls used, cost per scan, monthly burn rate vs. budget
7. A/B testing infrastructure: allow switching between Cloud Vision and Tesseract.js for comparison


### Epic 4: Shopping List Intelligence

**Goal**: Deliver the complete shopping list generation system with intelligent ingredient aggregation, multiple organization modes, and seamless sharing. This killer feature transforms selected recipes into optimized, actionable shopping lists that reduce time spent planning and shopping.

#### Story 4.1: Shopping List Generation API

As a **user**,
I want **to generate a shopping list from selected recipes**,
so that **I have a consolidated list of ingredients to buy**.

**Acceptance Criteria:**

1. POST /api/shopping-lists/generate endpoint accepts: recipeIds array, portionAdjustments object {recipeId: multiplier}
2. Algorithm fetches all ingredients from selected recipes, applies portion multipliers
3. Shopping list record created in database with: id, userId, name (auto: "Shopping List - Jan 6"), recipeIds, createdAt
4. ShoppingListItems table stores: listId, ingredientName, totalQuantity, unit, recipeIds (which recipes need this ingredient)
5. Response returns: listId, items array (ingredientName, quantity, unit, checked: false, recipeNames array)
6. Empty recipe selection returns 400 Bad Request with message
7. Generated list persists in database for later editing and sharing

#### Story 4.2: Intelligent Ingredient Aggregation

As a **user**,
I want **duplicate ingredients automatically combined with unit conversion**,
so that **I don't buy the same item multiple times**.

**Acceptance Criteria:**

1. Aggregation algorithm identifies duplicates: "chicken breast" matches "chicken breasts" (pluralization)
2. Unit conversion: 2 cups + 4 tbsp = 2.25 cups (standard conversions: tbsp→cups, tsp→tbsp, oz→lb, g→kg)
3. Mixed units preserved when conversion unclear: "1 cup flour" + "200g flour" → shows both with note
4. Ingredient synonym detection: "scallions" and "green onions" flagged as potential duplicates (warning, not auto-merge)
5. Small quantities optimized: 0.25 cups displayed as "1/4 cup", 0.5 lb as "8 oz" for readability
6. Aggregation handles edge cases: "to taste", "pinch", "dash" items not aggregated
7. Grouped total shows source recipes: "Tomatoes (2 cups) - from Pasta Sauce, Salad"

#### Story 4.3: Shopping List Organization Modes

As a **user**,
I want **to reorganize my shopping list by aisle, recipe, or alphabetically**,
so that **I can shop efficiently based on my preferred store layout**.

**Acceptance Criteria:**

1. GET /api/shopping-lists/:id?organize=aisle returns items grouped by store section
2. Aisle categories: Produce, Meat/Seafood, Dairy, Bakery, Canned Goods, Frozen, Spices, Other
3. Ingredient-to-aisle mapping stored in database (Ingredients table has aisleCategory field)
4. GET /api/shopping-lists/:id?organize=recipe groups items by which recipe(s) need them
5. GET /api/shopping-lists/:id?organize=alphabetical returns items sorted A-Z
6. Organization mode saved per user preference (default: aisle)
7. Real-time re-organization on frontend (client-side sorting, no API call) after initial load

#### Story 4.4: Inventory Deduction from Shopping List

As a **user**,
I want **to mark ingredients I already have and exclude them from the shopping list**,
so that **I only buy what I'm missing**.

**Acceptance Criteria:**

1. Inventory table created: userId, ingredientId, quantity, unit, addedAt, expiresAt (optional)
2. GET /api/inventory returns user's saved inventory items
3. POST /api/inventory adds ingredient to inventory with quantity
4. Shopping list generation checks inventory: if user has "2 cups flour" and list needs "3 cups", show "1 cup flour (need more)"
5. UI shows inventory status per item: "✓ Have enough", "⚠️ Need 1 more cup", "✗ Don't have"
6. "Remove from list" button for items user already has (soft delete, item marked checked=true)
7. Inventory management basic: add/remove items, no expiration tracking in MVP (V2 feature)

#### Story 4.5: Shopping List Item Check-Off

As a **user**,
I want **to check off items as I shop**,
so that **I can track what I've purchased and what's remaining**.

**Acceptance Criteria:**

1. PUT /api/shopping-lists/:listId/items/:itemId endpoint updates checked status
2. Checked items visually struck-through or moved to "Completed" section
3. Check-off persists across sessions (saved in database)
4. Undo check-off: tap checked item to uncheck
5. "Mark all as purchased" button completes entire list
6. Progress indicator shows: "5 of 12 items purchased"
7. Checked items optionally hidden with "Show completed" toggle

#### Story 4.6: Shopping List Sharing

As a **user**,
I want **to share my shopping list with family or household members**,
so that **anyone can pick up groceries using the same list**.

**Acceptance Criteria:**

1. POST /api/shopping-lists/:id/share endpoint accepts: method (email, sms, link)
2. Email sharing: send via SendGrid with link to view/edit list (requires recipient account or guest access)
3. SMS sharing: send via Twilio with short link (bit.ly or custom short URL)
4. Shareable link generation: public URL with secure token (read-only or edit permissions)
5. Real-time collaboration: multiple users can check off items, changes sync via polling (WebSocket upgrade in V2)
6. Shared list permissions: owner can revoke access, delete list
7. Guest access: non-users can view list via link without account (limited to 7 days expiry)

#### Story 4.7: Shopping List Cost Estimation

As a **user**,
I want **to see an estimated total cost for my shopping list**,
so that **I can budget appropriately before shopping**.

**Acceptance Criteria:**

1. IngredientPrices table stores: ingredientId, averagePrice (in euros), unit, region, updatedAt
2. Prices populated from public datasets or manual entry (500 common ingredients)
3. Cost calculation: sum(quantity × unitPrice) for all items
4. Total displayed with disclaimer: "Estimated cost: €42.50 (prices may vary by store)"
5. Per-item cost shown in list: "Chicken breast (500g) - ~€8.00"
6. Cost estimation accuracy tracked for future improvement
7. No real-time price API integration in MVP (too expensive, V2 feature)

#### Story 4.8: Web Shopping List UI

As a **user**,
I want **a web interface to generate, view, and manage shopping lists**,
so that **I can plan my shopping from my computer**.

**Acceptance Criteria:**

1. "Generate Shopping List" button on Recipe Library page (multi-select recipes with checkboxes)
2. Generation modal: select recipes, adjust portions per recipe, "Generate" button
3. Shopping List View page at /shopping-lists/:id displays items with checkboxes
4. Organization mode selector: dropdown (By Aisle / By Recipe / Alphabetical)
5. Each item shows: checkbox, name, quantity/unit, recipe names (tooltip), inventory status icon
6. Action buttons: Share (opens share modal), Print, Edit, Delete List
7. Share modal: tabs for Email, SMS, Copy Link with respective input fields
8. Print view: printer-friendly layout without navigation (CSS @media print)

#### Story 4.9: Mobile Shopping List UI

As a **mobile user**,
I want **a mobile shopping list optimized for in-store shopping**,
so that **I can efficiently check off items while grocery shopping**.

**Acceptance Criteria:**

1. Shopping List screen with large, thumb-friendly checkboxes (min 44x44px touch target)
2. Swipe gesture to check/uncheck items (alternative to tap)
3. Large, readable font (18px min) for easy reading while walking
4. Sticky header shows: progress "5/12 items", organization mode selector
5. Checked items fade out or move to bottom section (user preference)
6. Share button opens native share sheet (iOS/Android)
7. Keep screen awake mode enabled on shopping list screen
8. Offline mode: list cached locally, check-offs sync when connection restored
9. "Add item" button for manual additions during shopping (quick text input)


### Epic 5: Ingredient-Based Recipe Suggestions

**Goal**: Build the ingredient matching system that suggests recipes based on what users already have at home. This anti-waste feature helps users discover cooking possibilities with available ingredients, reducing trips to the store and food waste.

#### Story 5.1: Ingredient Inventory Management API

As a **user**,
I want **to maintain an inventory of ingredients I have at home**,
so that **the system can suggest recipes I can make right now**.

**Acceptance Criteria:**

1. GET /api/inventory returns user's current ingredient inventory
2. POST /api/inventory/bulk-add accepts array of ingredientIds or names for quick entry
3. PUT /api/inventory/:id updates quantity for existing inventory item
4. DELETE /api/inventory/:id removes ingredient from inventory
5. Inventory items have optional expirationDate field for future smart suggestions
6. Quick-add from common ingredients: GET /api/inventory/suggestions returns frequently used ingredients
7. Inventory persists across sessions, no automatic expiration/removal in MVP

#### Story 5.2: Recipe Matching Algorithm

As a **user**,
I want **to see which recipes I can make with my available ingredients**,
so that **I can cook without going shopping**.

**Acceptance Criteria:**

1. GET /api/recipes/match-ingredients?inventoryIds=1,2,3 returns recipes ordered by match percentage
2. Match calculation: (availableIngredients / totalIngredients) × 100
3. 100% match recipes displayed first ("You can make these now!")
4. 70-99% match recipes shown with missing ingredients list
5. <70% match recipes excluded from results (too many missing items)
6. Missing ingredients highlighted: "You need: 2 eggs, 1 cup milk"
7. Filter options: show only 100% matches, include partial matches, min match percentage slider

#### Story 5.3: Ingredient Suggestion Filters

As a **user**,
I want **to filter ingredient-based suggestions by tags and constraints**,
so that **I find recipes matching my current needs (time, diet, difficulty)**.

**Acceptance Criteria:**

1. Query parameters added: ?tagIds=1,2&maxPrepTime=30&minRating=4
2. Tag filtering works on top of ingredient matching (intersection of both filters)
3. Time filter: only show recipes completable in specified time
4. Rating filter: only show recipes above specified rating
5. Filters applied server-side for performance (indexed queries)
6. Filter UI shows count: "12 recipes match your filters"
7. "Clear filters" button resets to ingredient-only matching

#### Story 5.4: Missing Ingredient Shopping List Quick-Add

As a **user**,
I want **to quickly add missing ingredients to a shopping list**,
so that **I can shop for what I need to complete a partially-matched recipe**.

**Acceptance Criteria:**

1. Recipe match results show "Add missing items to cart" button for partial matches
2. Button creates new shopping list or adds to existing active list
3. Only missing ingredients added (available ingredients excluded)
4. Quantities adjusted to recipe requirements
5. Confirmation toast: "Added 3 items to shopping list"
6. Link to shopping list: "View list" button in toast
7. Supports bulk add: select multiple partial-match recipes, add all missing ingredients at once

#### Story 5.5: Inventory Quick-Entry from Shopping List

As a **user**,
I want **to automatically update my inventory after shopping**,
so that **I don't manually re-enter purchased items**.

**Acceptance Criteria:**

1. Completed shopping list shows "Add purchased items to inventory" button
2. All checked items from list added to inventory with purchased quantities
3. Duplicate handling: if ingredient exists in inventory, add quantities together
4. Confirmation modal: "Add 12 items to inventory?" with item preview
5. Inventory updated in bulk transaction (atomic operation)
6. Success message: "Inventory updated with 12 new items"
7. Optional: auto-update inventory on list completion (user preference)

#### Story 5.6: Web Ingredient Matching UI

As a **user**,
I want **a web interface to input available ingredients and see recipe suggestions**,
so that **I can discover what to cook based on what I have**.

**Acceptance Criteria:**

1. "What Can I Cook?" page at /suggestions displays ingredient input interface
2. Ingredient selector: searchable multi-select dropdown OR quick checkboxes of common items
3. Selected ingredients displayed as removable chips/tags
4. "Find Recipes" button triggers matching algorithm
5. Results display: 100% matches section (green header), Partial matches section (yellow header)
6. Each result shows: recipe card, match percentage badge, missing ingredients list
7. Filter sidebar: tags, time, rating with live result count
8. Empty state: "Select ingredients to see recipe suggestions"

#### Story 5.7: Mobile Ingredient Matching UI

As a **mobile user**,
I want **to quickly input ingredients and find recipes on my phone**,
so that **I can check what to cook while in my kitchen**.

**Acceptance Criteria:**

1. "What Can I Cook?" screen in mobile app with large ingredient input
2. Quick-add grid: visual buttons for top 20 common ingredients (eggs, chicken, rice, etc.)
3. Search bar for additional ingredients (autocomplete dropdown)
4. Selected ingredients shown as chips with X to remove
5. "Find Recipes" button (sticky at bottom) shows count: "Find Recipes (12)"
6. Results screen: tabs for "Perfect Matches" and "Close Matches"
7. Recipe cards show prominent match percentage: large "100%" or "85%" badge
8. Pull-to-refresh reloads suggestions if inventory changed

### Epic 6: Smart Menu Generation

**Goal**: Implement the intelligent menu generator that creates balanced, varied meal plans for 1-14 days. The algorithm prevents ingredient repetition, balances protein variety, respects user constraints (tags, time), and seamlessly integrates with shopping list generation for the complete meal planning workflow.

#### Story 6.1: Menu Generation Algorithm Foundation

As a **user**,
I want **an intelligent algorithm to generate balanced menus**,
so that **I get varied meals without repetitive ingredients**.

**Acceptance Criteria:**

1. POST /api/menus/generate endpoint accepts: days (1-14), mealsPerDay (1-3), mealTypes array (breakfast, lunch, dinner, snack), tagConstraints object
2. Algorithm selects recipes randomly with constraints: no recipe repetition, no main ingredient repetition in consecutive meals
3. Protein variety enforced: beef/pork/chicken/fish/vegetarian rotated across days
4. Tag constraints applied: if {vegetarian: 3} specified, 3 days have vegetarian recipes
5. Total time balanced: mix of quick (<30min) and longer recipes throughout week
6. Difficulty balanced: not all complex recipes in one day
7. Generated menu saved to database with id, userId, startDate, meals array, createdAt

#### Story 6.2: Menu Templates System

As a **user**,
I want **pre-configured menu templates for common scenarios**,
so that **I can quickly generate specialized menus without custom configuration**.

**Acceptance Criteria:**

1. GET /api/menu-templates returns 5-10 predefined templates
2. Templates include: "Vegetarian Week", "Quick Meals Week", "Batch Cooking Weekend", "Family Friendly", "Budget Meals"
3. Each template has: name, icon, defaultDays, defaultMealsPerDay, tagConstraints, description
4. POST /api/menus/from-template/:templateId generates menu using template config
5. User can override template settings before generation
6. Templates stored as JSON configuration (no database needed)
7. Template selection UI shows benefits: "Vegetarian Week: 7 days of plant-based meals"

#### Story 6.3: Partial Menu Regeneration

As a **user**,
I want **to regenerate specific meals without losing the entire menu**,
so that **I can replace meals I don't like while keeping the rest**.

**Acceptance Criteria:**

1. PUT /api/menus/:id/regenerate-meal accepts: day, mealType (breakfast/lunch/dinner)
2. Algorithm selects new recipe for specified meal respecting original constraints
3. New recipe doesn't conflict with other meals (no ingredient repetition check)
4. Updated menu returned with single meal changed
5. Regeneration history tracked (optional): meal regenerated count for analytics
6. UI shows "↻ Regenerate" button on each meal card
7. Regeneration instant (no full menu recalculation, just one slot)

#### Story 6.4: Menu Favorites & Reuse

As a **user**,
I want **to save favorite menus for reuse**,
so that **I can quickly generate the same weekly plan again**.

**Acceptance Criteria:**

1. PUT /api/menus/:id/favorite marks menu as favorite (isFavorite boolean)
2. GET /api/menus?favorites=true returns only favorited menus
3. POST /api/menus/:id/duplicate creates new menu with same recipes (new startDate)
4. Favorite menus shown in "My Favorites" section of menu list
5. Duplicate button creates copy: "Copy of Vegetarian Week Jan 2026"
6. User can edit duplicated menu before finalizing
7. Max 20 saved menus per user (soft limit, can increase in V2)

#### Story 6.5: Menu to Shopping List Integration

As a **user**,
I want **to generate a shopping list for an entire menu with one click**,
so that **I can shop for a full week of meals efficiently**.

**Acceptance Criteria:**

1. POST /api/menus/:id/shopping-list generates shopping list from all menu recipes
2. All recipes in menu included with default portions (adjustable before generation)
3. Shopping list named: "Shopping for [Menu Name]" or "Shopping for Jan 6-12"
4. Generated list includes all unique ingredients across all meals with aggregation
5. "Generate Shopping List" button prominent on menu detail page
6. Option to exclude specific meals from shopping list (checkboxes)
7. Shopping list linked back to menu (menuId field) for context

#### Story 6.6: Menu Calendar View

As a **user**,
I want **to view my menu in a calendar format**,
so that **I can see what I'm cooking each day at a glance**.

**Acceptance Criteria:**

1. GET /api/menus/:id returns menu with meals structured by day and mealType
2. Calendar view displays: days as columns, meal types as rows
3. Each cell shows: recipe name, photo thumbnail, prep time, tags (3 max visible)
4. Click recipe card opens recipe detail modal or navigates to recipe page
5. Drag-and-drop to swap meals between days (updates menu via API)
6. Today's meals highlighted with distinct border/background color
7. Print-friendly calendar view (CSS @media print)

#### Story 6.7: Web Menu Generator UI

As a **user**,
I want **a web interface to generate and manage menus**,
so that **I can plan my meals from my computer**.

**Acceptance Criteria:**

1. "Generate Menu" page at /menus/generate with configuration form
2. Form inputs: days slider (1-14), meals per day checkboxes (breakfast/lunch/dinner/snack), tag filters
3. Template selection: visual cards "Start from template" or "Custom configuration"
4. Generate button shows loading state: "Generating your menu..."
5. Generated menu displays in calendar grid view with meal cards
6. Action buttons: Save to Favorites, Edit Menu, Generate Shopping List, Print, Delete
7. Menu list page at /menus shows saved menus as cards (name, date range, meal count)

#### Story 6.8: Mobile Menu Generator UI

As a **mobile user**,
I want **to generate and view menus on my phone**,
so that **I can plan meals and reference them while shopping or cooking**.

**Acceptance Criteria:**

1. "Generate Menu" screen with mobile-optimized form (large touch inputs)
2. Quick-start templates: swipeable cards "Tap to generate from template"
3. Generated menu displays as vertical scrollable day list (not grid)
4. Each day card shows: date, meal cards (breakfast/lunch/dinner), total time
5. Swipe meal card left to reveal "Regenerate" and "Remove" actions
6. "Generate Shopping List" button sticky at bottom of menu view
7. Calendar view toggle: switch between list and calendar grid layouts
8. Offline access: recently viewed menus cached for offline reference

### Epic 7: Cross-Platform Sync & Offline Support

**Goal**: Enable seamless real-time synchronization across web and mobile platforms with robust offline functionality. Users can access their recipes anywhere, continue working without internet, and have changes automatically synced when reconnected.

#### Story 7.1: Sync Infrastructure & Conflict Resolution

As a **developer**,
I want **a synchronization system with last-write-wins conflict resolution**,
so that **user data stays consistent across devices**.

**Acceptance Criteria:**

1. All data models include: updatedAt timestamp, lastSyncedAt timestamp, version number
2. PUT /api/sync endpoint accepts: entity type, entity ID, updatedAt, data payload
3. Conflict detection: if server updatedAt > client updatedAt, conflict exists
4. Last-write-wins resolution: most recent updatedAt wins, older update rejected with 409 Conflict
5. Delta sync: GET /api/sync?since=<timestamp> returns only entities modified after timestamp
6. Sync queue on client: failed sync attempts queued and retried
7. Sync status tracking: lastSyncedAt per device stored in user_devices table

#### Story 7.2: Offline Data Storage - Web

As a **web user**,
I want **my recipes and data cached offline**,
so that **I can access them without internet connection**.

**Acceptance Criteria:**

1. IndexedDB configured via Dexie.js with tables: recipes, shoppingLists, menus, inventory, syncQueue
2. Service worker (Workbox) caches: API responses, recipe photos, app shell (HTML/CSS/JS)
3. Offline-first architecture: read from IndexedDB first, fetch from API if miss or stale
4. Write operations queued in syncQueue when offline, synced when connection restored
5. Offline indicator in UI: banner "You're offline - changes will sync when connected"
6. Conflict warning: if sync fails due to conflict, show modal "This recipe was updated elsewhere"
7. Cache invalidation: clear stale data after 7 days or on user logout

#### Story 7.3: Offline Data Storage - Mobile

As a **mobile user**,
I want **my recipes available offline**,
so that **I can cook and shop without cellular data or WiFi**.

**Acceptance Criteria:**

1. AsyncStorage (with expo-secure-store encryption) stores: auth tokens, user profile
2. Local SQLite database (expo-sqlite) stores: recipes, ingredients, tags, shopping lists, menus
3. Image caching via expo-file-system: recipe photos downloaded and cached locally
4. Offline mode auto-detected via NetInfo (no connection = offline mode)
5. Sync queue persists pending changes: creates, updates, deletes queued with retry logic
6. Background sync: when app reopens with connection, auto-sync queued changes
7. Storage management: limit offline cache to 200 recipes or 500MB, user can clear cache

#### Story 7.4: Real-Time Sync Polling

As a **user**,
I want **changes made on one device to appear on my other devices quickly**,
so that **I have a seamless multi-device experience**.

**Acceptance Criteria:**

1. Polling interval: every 30 seconds when app active, every 5 minutes when app backgrounded
2. GET /api/sync/changes?since=<lastSyncTimestamp> returns modified entities
3. Client merges server changes into local database (update if updatedAt newer)
4. Push notifications on mobile when critical sync occurs (optional, basic in MVP)
5. Sync triggered manually: "Sync Now" button in settings
6. Sync status indicator: last synced timestamp shown in UI ("Last synced: 2 min ago")
7. Exponential backoff on sync failures: retry after 1s, 2s, 4s, 8s, max 60s

#### Story 7.5: Data Export & Backup

As a **user**,
I want **to export my complete data as a backup file**,
so that **I can restore it if I lose access or switch to another device**.

**Acceptance Criteria:**

1. GET /api/users/export generates complete data export as JSON file
2. Export includes: all recipes (with ingredients, steps, tags, photos as URLs), shopping lists, menus, inventory
3. Export excludes: sensitive data (password hash, OAuth tokens)
4. File download triggered: bmad-recette-backup-2026-01-06.json
5. Export runs asynchronously for large datasets: 202 Accepted, poll for completion
6. Export file encrypted with user password (optional security enhancement)
7. RGPD compliance: export fulfills "right to data portability" requirement

#### Story 7.6: Data Import & Restore

As a **user**,
I want **to import data from a backup file**,
so that **I can restore my recipes after data loss or on a new device**.

**Acceptance Criteria:**

1. POST /api/users/import accepts JSON file upload (max 50MB)
2. Import validates file format: checks schema version, required fields
3. Duplicate handling: merge strategy (skip existing, overwrite, or create duplicates) user-selectable
4. Import runs asynchronously: 202 Accepted, progress updates via polling endpoint
5. Import summary returned: "Imported: 45 recipes, 3 shopping lists, 2 menus"
6. Failed imports logged: invalid entries reported to user with line numbers
7. Import creates audit log entry for security tracking

#### Story 7.7: Sync Settings & Preferences

As a **user**,
I want **to configure sync preferences**,
so that **I can control bandwidth usage and sync behavior**.

**Acceptance Criteria:**

1. Settings page includes "Sync & Offline" section
2. Toggle: Auto-sync enabled/disabled (default: enabled)
3. Option: Sync only on WiFi (mobile data-saving mode)
4. Option: Download recipe photos for offline (default: enabled)
5. Cache size limit: slider 100MB - 1GB (default: 500MB)
6. "Clear offline cache" button with confirmation
7. Sync status dashboard: last sync time, pending changes count, cache size used

#### Story 7.8: Multi-Device Management

As a **user**,
I want **to see which devices are synced to my account**,
so that **I can manage access and revoke devices I no longer use**.

**Acceptance Criteria:**

1. GET /api/users/devices returns list of devices with: deviceId, name (iPhone, Chrome), lastSyncedAt, createdAt
2. Device registration on login: device fingerprint generated and stored
3. Device list shown in settings: "Your Devices" section
4. Revoke device button: DELETE /api/users/devices/:id removes device, invalidates its refresh tokens
5. Current device highlighted: "This device (Web - Chrome)"
6. Device limit: max 5 devices per user (soft limit, can increase in V2)
7. Security: email notification when new device logs in (optional enhancement)

## Next Steps

### Checklist Results Report

_(This section will be populated after executing the PM Checklist to validate PRD completeness and quality)_

### UX Expert Prompt

To proceed with design and user experience architecture, hand off to the UX Expert with this prompt:

"Review the BMad Recette PRD ([docs/prd.md](docs/prd.md)) and create a comprehensive UX/UI architecture document. Focus on: 1) Information architecture and navigation flows, 2) Detailed wireframes for the 12 core screens identified in UI Design Goals, 3) Component design system (buttons, forms, cards, modals), 4) Mobile-specific interaction patterns (gestures, bottom sheets), 5) Accessibility implementation guidelines (WCAG AA compliance), and 6) Design tokens for the warm, food-centric branding. Reference the Project Brief ([docs/brief.md](docs/brief.md)) for persona insights and use cases."

### Architect Prompt

To proceed with technical architecture and implementation planning, hand off to the Architect with this prompt:

"Review the BMad Recette PRD ([docs/prd.md](docs/prd.md)) and Technical Assumptions section. Create a comprehensive Technical Architecture Document covering: 1) Detailed database schema with all tables, relationships, and indexes, 2) API specification (REST endpoints with request/response schemas), 3) Monorepo structure with package organization, 4) State management architecture for web and mobile, 5) OCR integration architecture (Cloud Vision API flow), 6) Sync and offline strategy implementation details, 7) Deployment architecture (Railway backend, Vercel frontend, mobile app stores), and 8) Testing strategy implementation. Reference the Project Brief ([docs/brief.md](docs/brief.md)) for technical constraints and success metrics."

---

**Document Status**: Draft v0.1 - Ready for Stakeholder Review
**Date**: 2026-01-06
**Author**: John (Product Manager Agent)
**Next Action**: Review, validate, and hand off to UX Expert and Architect for design and technical architecture phases.
