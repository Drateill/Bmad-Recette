# Technical Assumptions

## Repository Structure: Monorepo

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

## Service Architecture

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

## Testing Requirements

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

## Additional Technical Assumptions and Requests

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
