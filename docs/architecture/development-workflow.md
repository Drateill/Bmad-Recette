# Development Workflow

## Prerequisites

```bash
node --version    # v20.x LTS
npm --version     # v10.x
docker --version  # v24.x
```

## Initial Setup

```bash
git clone https://github.com/bmad/bmad-recette.git
cd bmad-recette
npm install
cp .env.example .env
docker-compose up -d
npm run db:migrate
npm run db:seed
```

## Development Commands

```bash
npm run dev              # Start all services
npm run build            # Build all apps
npm run test             # Run all tests
npm run lint             # ESLint
npm run type-check       # TypeScript
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
```

## Environment Configuration

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
