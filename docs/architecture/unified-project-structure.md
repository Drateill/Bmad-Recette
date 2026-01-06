# Unified Project Structure

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
