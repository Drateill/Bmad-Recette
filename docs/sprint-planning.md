# Sprint Planning - BMad Recette

**Date**: 2026-01-07
**Scrum Master**: Bob
**Project**: BMad Recette - Recipe Management Platform

---

## Executive Summary

This sprint planning document provides a comprehensive overview of the BMad Recette project based on the current state of the product backlog. The project aims to deliver a unified recipe management platform with OCR scanning, intelligent menu generation, and automated shopping list capabilities.

**Current Status**:
- ✅ Story 1.1: Project Setup & Monorepo Infrastructure - **DONE**
- ✅ Story 1.2: Backend API Foundation & Database Setup - **DONE**
- ✅ Story 1.3: CI/CD Pipeline & Automated Testing - **DONE**
- 🚧 Remaining: 5 stories in Epic 1 + 6 additional epics

---

## Project Overview

### Vision
Enable users to centralize all recipe sources into a single accessible platform, reducing meal planning time from 2-3 hours to under 15 minutes per week.

### Goals
1. Centralize recipe sources (physical books, websites, personal creations)
2. Reduce meal planning time by 90%+ through intelligent automation
3. Minimize food waste by 50%+ through ingredient tracking
4. Streamline grocery shopping with automated shopping lists
5. Provide seamless cross-platform experience (web + mobile) with offline access

---

## Epic Breakdown

### **Epic 1: Foundation & Core Authentication** ⚡ Current Focus
**Goal**: Establish production-ready foundation with authentication system and basic user management.

**Status**: 3/10 stories complete (30%)

**Completed Stories**:
- ✅ 1.1: Project Setup & Monorepo Infrastructure
- ✅ 1.2: Backend API Foundation & Database Setup
- ✅ 1.3: CI/CD Pipeline & Automated Testing

**Remaining Stories**:
- 🔲 1.4: User Registration with Email/Password
- 🔲 1.5: User Login with Email/Password
- 🔲 1.6: OAuth Authentication (Google & Apple)
- 🔲 1.7: JWT Token Refresh & Session Management
- 🔲 1.8: Web App Foundation & Authentication UI
- 🔲 1.9: Mobile App Foundation & Authentication UI
- 🔲 1.10: Deployment to Staging Environment

**Epic Complexity**: 🔴 High (10 stories, ~8-12 weeks estimated)

---

### **Epic 2: Recipe Management Core**
**Goal**: Enable complete CRUD system for recipes with tagging and organization.

**Story Count**: 14 stories
**Key Features**:
- Database schema for recipes, ingredients, steps, photos
- Intelligent tag system (6 categories, 100+ predefined tags)
- Recipe CRUD operations with photo uploads
- Portion adjustment algorithm
- Rating system
- Web and mobile UI for recipe management

**Epic Complexity**: 🔴 High (14 stories, ~10-14 weeks estimated)

---

### **Epic 3: OCR Scanning & Recipe Import**
**Goal**: Enable digitization of recipes from physical sources using OCR technology.

**Story Count**: 7 stories
**Key Features**:
- Google Cloud Vision API integration
- Intelligent text parsing and structuring
- Post-OCR editor with corrections
- Mobile camera integration
- Web upload interface
- Quality feedback and improvement tracking

**Epic Complexity**: 🟡 Medium (7 stories, ~5-7 weeks estimated)

---

### **Epic 4: Shopping List Intelligence**
**Goal**: Deliver complete shopping list generation with intelligent aggregation.

**Story Count**: 9 stories
**Key Features**:
- Shopping list generation from selected recipes
- Intelligent ingredient aggregation with unit conversion
- Multiple organization modes (aisle, recipe, alphabetical)
- Inventory deduction
- Item check-off functionality
- Sharing capabilities (email, SMS, link)
- Cost estimation
- Web and mobile UI optimized for shopping

**Epic Complexity**: 🟡 Medium (9 stories, ~6-8 weeks estimated)

---

### **Epic 5: Ingredient-Based Recipe Suggestions**
**Goal**: Build ingredient matching system for recipe suggestions.

**Story Count**: 7 stories
**Key Features**:
- Ingredient inventory management API
- Recipe matching algorithm (100% and partial matches)
- Tag and constraint filters
- Missing ingredient shopping list integration
- Inventory quick-entry from shopping lists
- Web and mobile UI for ingredient matching

**Epic Complexity**: 🟢 Low-Medium (7 stories, ~4-6 weeks estimated)

---

### **Epic 6: Smart Menu Generation**
**Goal**: Implement intelligent menu generator with balancing algorithms.

**Story Count**: 8 stories
**Key Features**:
- Menu generation algorithm with balancing (protein variety, time, difficulty)
- Pre-configured menu templates
- Partial menu regeneration
- Menu favorites and reuse
- Menu to shopping list integration
- Calendar view
- Web and mobile UI for menu planning

**Epic Complexity**: 🟡 Medium (8 stories, ~5-7 weeks estimated)

---

### **Epic 7: Cross-Platform Sync & Offline Support**
**Goal**: Enable real-time synchronization across platforms with robust offline functionality.

**Story Count**: 8 stories
**Key Features**:
- Sync infrastructure with conflict resolution (last-write-wins)
- Offline data storage (web: IndexedDB, mobile: SQLite)
- Real-time sync polling
- Data export and backup (RGPD compliance)
- Data import and restore
- Sync settings and preferences
- Multi-device management

**Epic Complexity**: 🟡 Medium (8 stories, ~5-7 weeks estimated)

---

## Recommended Sprint Structure

### **Sprint 1: Complete Epic 1 - Foundation (2 weeks)**
**Sprint Goal**: Complete authentication system and deploy to staging

**Stories**:
1. 🔲 Story 1.4: User Registration with Email/Password (5 story points)
2. 🔲 Story 1.5: User Login with Email/Password (5 story points)
3. 🔲 Story 1.6: OAuth Authentication (Google & Apple) (8 story points)

**Estimated Velocity**: 18 story points
**Risk**: Medium - OAuth integration complexity

---

### **Sprint 2: Complete Epic 1 - Frontend & Deployment (2 weeks)**
**Sprint Goal**: Deliver complete authentication flow across web and mobile with staging deployment

**Stories**:
1. 🔲 Story 1.7: JWT Token Refresh & Session Management (5 story points)
2. 🔲 Story 1.8: Web App Foundation & Authentication UI (8 story points)
3. 🔲 Story 1.9: Mobile App Foundation & Authentication UI (8 story points)
4. 🔲 Story 1.10: Deployment to Staging Environment (5 story points)

**Estimated Velocity**: 26 story points
**Risk**: Medium - Multiple platform coordination

---

### **Sprint 3: Recipe Core - Backend Foundation (2 weeks)**
**Sprint Goal**: Establish recipe database schema and core APIs

**Stories**:
1. 🔲 Story 2.1: Recipe Database Schema & Core Models (8 story points)
2. 🔲 Story 2.2: Tag System Foundation & Database (8 story points)
3. 🔲 Story 2.3: Create Recipe API & Business Logic (8 story points)
4. 🔲 Story 2.4: Recipe Photo Upload & Management (5 story points)

**Estimated Velocity**: 29 story points
**Risk**: Low - Straightforward backend implementation

---

### **Sprint 4: Recipe Core - CRUD & APIs (2 weeks)**
**Sprint Goal**: Complete recipe CRUD operations and filtering

**Stories**:
1. 🔲 Story 2.5: Get Recipe Details API (3 story points)
2. 🔲 Story 2.6: Update Recipe API (5 story points)
3. 🔲 Story 2.7: Delete Recipe API (3 story points)
4. 🔲 Story 2.8: Recipe List & Filtering API (8 story points)
5. 🔲 Story 2.9: Recipe Templates Implementation (5 story points)
6. 🔲 Story 2.10: Portion Adjustment Algorithm (5 story points)
7. 🔲 Story 2.11: Recipe Rating System (3 story points)

**Estimated Velocity**: 32 story points
**Risk**: Low - Clear requirements

---

### **Sprint 5: Recipe Core - User Interface (2 weeks)**
**Sprint Goal**: Deliver web and mobile UI for recipe management

**Stories**:
1. 🔲 Story 2.12: Web Recipe Library UI (13 story points)
2. 🔲 Story 2.13: Web Recipe Detail & Edit UI (13 story points)
3. 🔲 Story 2.14: Mobile Recipe Library & Detail UI (13 story points)

**Estimated Velocity**: 39 story points
**Risk**: Medium - UI complexity and cross-platform compatibility

---

### **Sprint 6: OCR Scanning - Backend (2 weeks)**
**Sprint Goal**: Implement OCR scanning infrastructure

**Stories**:
1. 🔲 Story 3.1: Google Cloud Vision API Integration (8 story points)
2. 🔲 Story 3.2: OCR Scan API Endpoint (5 story points)
3. 🔲 Story 3.3: OCR Text Parsing & Structuring (13 story points)
4. 🔲 Story 3.4: Post-OCR Recipe Editor (8 story points)

**Estimated Velocity**: 34 story points
**Risk**: High - AI/ML integration complexity, parsing accuracy

---

### **Sprint 7: OCR Scanning - User Interface (1 week)**
**Sprint Goal**: Deliver OCR scanning UI for web and mobile

**Stories**:
1. 🔲 Story 3.5: OCR Scan Mobile UI (8 story points)
2. 🔲 Story 3.6: OCR Scan Web UI (5 story points)
3. 🔲 Story 3.7: OCR Quality Feedback & Improvement (5 story points)

**Estimated Velocity**: 18 story points
**Risk**: Low - UI implementation

---

### **Sprint 8: Shopping List Intelligence - Backend (2 weeks)**
**Sprint Goal**: Implement shopping list generation and aggregation

**Stories**:
1. 🔲 Story 4.1: Shopping List Generation API (8 story points)
2. 🔲 Story 4.2: Intelligent Ingredient Aggregation (13 story points)
3. 🔲 Story 4.3: Shopping List Organization Modes (5 story points)
4. 🔲 Story 4.4: Inventory Deduction from Shopping List (8 story points)
5. 🔲 Story 4.5: Shopping List Item Check-Off (3 story points)

**Estimated Velocity**: 37 story points
**Risk**: Medium - Complex aggregation logic

---

### **Sprint 9: Shopping List Intelligence - Features & UI (2 weeks)**
**Sprint Goal**: Complete shopping list features with web and mobile UI

**Stories**:
1. 🔲 Story 4.6: Shopping List Sharing (8 story points)
2. 🔲 Story 4.7: Shopping List Cost Estimation (5 story points)
3. 🔲 Story 4.8: Web Shopping List UI (8 story points)
4. 🔲 Story 4.9: Mobile Shopping List UI (8 story points)

**Estimated Velocity**: 29 story points
**Risk**: Low - Straightforward implementation

---

## Velocity & Timeline Estimation

### Assumptions
- **Team Size**: 1-2 developers (based on AI agent development)
- **Sprint Duration**: 2 weeks per sprint
- **Average Velocity**: 25-35 story points per sprint

### Timeline Summary

| Phase | Sprints | Duration | Stories | Status |
|-------|---------|----------|---------|--------|
| **Epic 1: Foundation** | Sprint 1-2 | 4 weeks | 7 stories | 3/10 Done (30%) |
| **Epic 2: Recipe Core** | Sprint 3-5 | 6 weeks | 14 stories | Not started |
| **Epic 3: OCR Scanning** | Sprint 6-7 | 3 weeks | 7 stories | Not started |
| **Epic 4: Shopping Lists** | Sprint 8-9 | 4 weeks | 9 stories | Not started |
| **Epic 5: Ingredient Suggestions** | Sprint 10-11 | 4 weeks | 7 stories | Not started |
| **Epic 6: Menu Generation** | Sprint 12-13 | 4 weeks | 8 stories | Not started |
| **Epic 7: Sync & Offline** | Sprint 14-15 | 4 weeks | 8 stories | Not started |

**Total Estimated Timeline**: 29 weeks (~7 months) for complete MVP

---

## Sprint Planning Recommendations

### Immediate Next Steps (Sprint 1)

**Priority 1: Complete Authentication System**
1. Start with Story 1.4 (User Registration) - foundational for all user features
2. Follow with Story 1.5 (User Login) - enables testing
3. Add Story 1.6 (OAuth) - differentiator feature

**Why this order?**
- Unblocks all future user-centric features
- Enables testing of authentication flows
- OAuth can be parallelized if 2 developers available

### Risk Mitigation Strategies

1. **Technical Risks**:
   - OCR accuracy: Plan for iterative improvements, consider fallback to manual entry
   - Cross-platform sync: Start simple with polling, upgrade to WebSockets in V2
   - Performance: Implement caching early, monitor query performance

2. **Timeline Risks**:
   - UI complexity: Consider using component libraries (MUI, NativeBase)
   - Testing debt: Maintain 70% coverage minimum (already enforced in CI/CD)
   - Scope creep: Defer nice-to-have features to V2

3. **Dependency Risks**:
   - Google Cloud Vision API: Have Tesseract.js fallback ready
   - Third-party OAuth: Test with developer accounts early
   - Database migrations: Practice rollback procedures

### Quality Gates

**Definition of Done (per story)**:
- ✅ All acceptance criteria met
- ✅ Code reviewed and merged to main
- ✅ Unit tests written (70%+ coverage)
- ✅ Integration tests passing
- ✅ API documentation updated
- ✅ QA gate passed (docs/qa/gates/)
- ✅ Deployed to staging (for applicable stories)

**Sprint Review Criteria**:
- Sprint goal achieved
- All committed stories completed
- Demo prepared for stakeholders
- Retrospective feedback documented

---

## Dependencies & Blockers

### Current Blockers
- None identified (Stories 1.1-1.3 complete)

### Upcoming Dependencies

**Sprint 1 Dependencies**:
- Story 1.4 requires: Database migrations (✅ complete via 1.2)
- Story 1.5 requires: Story 1.4 (user registration)
- Story 1.6 requires: Google/Apple OAuth app setup (external)

**Sprint 2 Dependencies**:
- Story 1.7 requires: Redis setup (✅ complete via 1.2)
- Story 1.8 requires: Stories 1.4-1.7 (complete auth backend)
- Story 1.9 requires: Stories 1.4-1.7 (complete auth backend)
- Story 1.10 requires: All Epic 1 stories complete

**Epic 2 Dependencies**:
- All Epic 2 stories require: Story 1.4 (user authentication)
- Story 2.4 requires: S3 or similar object storage setup (external)

---

## Capacity Planning

### Current State
- **Infrastructure**: ✅ Complete (Turborepo, NestJS, CI/CD)
- **Database**: ✅ PostgreSQL & Redis configured
- **Deployment**: ✅ CI/CD pipelines ready
- **Team Velocity**: To be established in Sprint 1

### Resource Needs

**Immediate (Sprint 1-2)**:
- Backend developer(s): Authentication APIs
- Frontend developer(s): React web + React Native mobile
- OAuth app credentials (Google, Apple)

**Short-term (Sprint 3-5)**:
- S3 or object storage account (for recipe photos)
- Design assets for recipe cards and UI components

**Medium-term (Sprint 6-7)**:
- Google Cloud Vision API account (free tier: 1000 images/month)
- Budget for OCR API costs if exceeding free tier

---

## Metrics & Success Criteria

### Sprint Metrics to Track
1. **Velocity**: Story points completed per sprint
2. **Quality**: Test coverage percentage (target: 70%+)
3. **Bugs**: Number of bugs found in QA per sprint
4. **Cycle Time**: Days from story start to deployment
5. **Deployment Frequency**: Successful deployments per sprint

### Epic Success Criteria

**Epic 1 Success** (Foundation):
- Users can register and log in via email/password and OAuth
- Application deployed to staging with 99%+ uptime
- All APIs secured with JWT authentication
- Mobile and web apps functional with authentication

**Epic 2 Success** (Recipe Management):
- Users can create, edit, view, and delete recipes
- Recipes searchable and filterable by tags
- Photos uploadable and displayed correctly
- Portion adjustment working accurately
- Mobile and web UIs feature-complete

**Future Epic Success Criteria**: To be defined as epics approach

---

## Retrospective Plan

### After Each Sprint
1. **What went well?**
2. **What could be improved?**
3. **Action items for next sprint**
4. **Velocity adjustment** (if needed)

### Key Questions to Ask
- Are we maintaining 70%+ test coverage?
- Are QA gates catching issues early?
- Is technical debt being managed?
- Are dependencies causing delays?
- Is the team velocity sustainable?

---

## Next Actions

### For Product Owner
1. ✅ Prioritize remaining Epic 1 stories (Stories 1.4-1.10)
2. 🔲 Set up OAuth app credentials (Google, Apple)
3. 🔲 Review and approve Sprint 1 plan
4. 🔲 Prepare acceptance testing scenarios for Story 1.4

### For Scrum Master (Bob)
1. ✅ Create this sprint planning document
2. 🔲 Schedule Sprint 1 kickoff meeting
3. 🔲 Set up sprint board (Epic 1 stories)
4. 🔲 Establish team velocity baseline

### For Development Team
1. ✅ Review completed stories (1.1-1.3)
2. 🔲 Review Story 1.4 acceptance criteria
3. 🔲 Plan technical approach for authentication
4. 🔲 Estimate effort for Stories 1.4-1.6

---

## Conclusion

The BMad Recette project has a solid foundation with 3 stories complete in Epic 1. The infrastructure, database, and CI/CD pipeline are production-ready. The next focus should be completing the authentication system (Epic 1) to unlock all user-centric features.

**Recommended Immediate Action**: Start Sprint 1 with Stories 1.4, 1.5, and 1.6 to complete the authentication backend, targeting a 2-week completion.

**Overall Project Health**: 🟢 Healthy
- Strong technical foundation
- Clear roadmap with 63 stories across 7 epics
- Well-documented requirements and architecture
- Established quality gates and testing standards

---

**Document Version**: 1.0
**Last Updated**: 2026-01-07
**Next Review**: After Sprint 1 completion
