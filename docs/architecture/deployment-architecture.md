# Deployment Architecture

## Deployment Strategy

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

## CI/CD Pipeline

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

## Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|-------------|-------------|---------|
| Development | http://localhost:5173 | http://localhost:3000 | Local development |
| Staging | https://staging.bmadrecette.com | https://api-staging.bmadrecette.com | Pre-production testing |
| Production | https://app.bmadrecette.com | https://api.bmadrecette.com | Live environment |

---
