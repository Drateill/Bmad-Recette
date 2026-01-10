# BMad Recette API

Backend API for BMad Recette application built with NestJS.

## Features

- **NestJS** - Enterprise-grade Node.js framework with TypeScript
- **PostgreSQL** - Primary relational database with Prisma ORM
- **Redis** - Session management and caching
- **Authentication** - JWT-based auth with bcrypt password hashing
- **Rate Limiting** - Protection against brute force attacks
- **Security** - Helmet.js for security headers, CORS middleware
- **Health Checks** - `/api/health` endpoint with service monitoring
- **Structured Logging** - Pino logger with JSON output
- **Environment Config** - Type-safe configuration management

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker (for PostgreSQL and Redis)

## Installation

1. Install dependencies (from project root):
```bash
npm install
```

2. Copy environment file:
```bash
cp apps/api/.env.example apps/api/.env
```

3. Start PostgreSQL and Redis:
```bash
docker compose up -d
```

4. Run database migrations:
```bash
cd apps/api
npx prisma migrate dev
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## API Endpoints

### Health Check
```
GET /api/health
```

Returns application health status with database and Redis connectivity checks.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-07T10:00:00.000Z",
  "version": "0.1.0",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Authentication

#### User Registration
```
POST /api/auth/register
```

Register a new user account with email and password.

**Rate Limit:** 5 requests per hour per IP

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John"
}
```

**Validation Rules:**
- `email`: Must be a valid email format
- `password`: Minimum 8 characters, must contain at least 1 uppercase letter and 1 number
- `firstName`: Required, cannot be empty

**Success Response (201 Created):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "firstName": "John",
    "createdAt": "2026-01-07T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid email format, weak password, or missing required fields
- `409 Conflict` - Email already registered
- `429 Too Many Requests` - Rate limit exceeded (5 requests/hour)

**Security:**
- Passwords are hashed using bcrypt with 10 salt rounds
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh tokens stored in Redis
- Rate limiting prevents brute force attacks

## Environment Variables

See `.env.example` for all required environment variables:

- `NODE_ENV` - Environment (development/production)
- `PORT` - API server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection URL
- `CORS_ORIGINS` - Comma-separated list of allowed origins
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `JWT_SECRET` - Secret key for signing JWT tokens
- `JWT_ACCESS_TOKEN_EXPIRATION` - Access token expiration (default: 15m)
- `JWT_REFRESH_TOKEN_EXPIRATION` - Refresh token expiration (default: 7d)

## Database

The API uses Prisma as the ORM for PostgreSQL.

### Run migrations:
```bash
npx prisma migrate dev
```

### Generate Prisma client:
```bash
npx prisma generate
```

### Open Prisma Studio:
```bash
npx prisma studio
```

## Docker Services

Start local development services:
```bash
docker compose up -d
```

Stop services:
```bash
docker compose down
```

Services included:
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)

## Project Structure

```
apps/api/
├── src/
│   ├── config/          # Configuration modules
│   ├── database/        # Database connection (Prisma)
│   ├── redis/           # Redis connection
│   ├── health/          # Health check endpoint
│   ├── modules/
│   │   └── auth/        # Authentication module
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       ├── auth.repository.ts
│   │       ├── dto/     # Data transfer objects
│   │       └── utils/   # Password & JWT utilities
│   ├── types/           # TypeScript type definitions
│   ├── common/          # Shared utilities
│   ├── app.module.ts    # Root module
│   └── main.ts          # Application entry point
├── test/                # Integration tests
│   └── auth/            # Auth e2e tests
├── prisma/              # Database schema and migrations
└── README.md
```

## Security

- **Helmet.js** - Sets security HTTP headers
- **CORS** - Configured for allowed origins only
- **Environment Variables** - Sensitive data never committed to git

## Testing

Run unit tests:
```bash
npm run test
```

Run integration tests:
```bash
npm run test:e2e
```

Run with coverage:
```bash
npm run test:cov
```

## Contributing

1. Follow coding standards in `docs/architecture/coding-standards.md`
2. Write tests for all new features
3. Ensure linting passes before committing
4. Use meaningful commit messages

## License

Private - BMad Recette Project
