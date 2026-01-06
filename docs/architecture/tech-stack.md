# Tech Stack

This is the **DEFINITIVE** technology selection for the entire project. All development must use these exact versions.

## Technology Stack Table

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
