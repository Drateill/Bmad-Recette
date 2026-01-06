# Testing Strategy

## Testing Pyramid

```
        E2E Tests (5-7 paths)
       /                    \
      Integration Tests
     /                      \
    Frontend Unit    Backend Unit
```

## Test Organization

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
