# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in `packages/shared/types` and import from `@bmad/shared/types`
- **API Calls:** Use centralized `apiClient` service, never direct fetch
- **Environment Variables:** Access through typed config objects, never `process.env` directly
- **Error Handling:** All API routes use standard `HttpExceptionFilter`
- **State Updates:** Never mutate Zustand state directly
- **Database Access:** All queries through Repository pattern
- **Authentication:** Never store sensitive data in frontend state
- **File Uploads:** Always validate type and size on backend

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `UserProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/user-profile` |
| Database Tables | - | snake_case | `user_profiles` |

---
