# Introduction

This document outlines the complete fullstack architecture for **BMad Recette**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## Starter Template or Existing Project

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

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2026-01-06 | 0.1 | Initial architecture document draft | Winston (Architect) |

---
