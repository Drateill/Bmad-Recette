# API Specification

Based on REST API selection from Tech Stack, the following OpenAPI 3.0 specification covers the critical endpoints from PRD Epics 1-7.

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: BMad Recette API
  version: 1.0.0
  description: |
    RESTful API for BMad Recette recipe management platform.

    **Authentication:** All endpoints except /auth/* require JWT Bearer token in Authorization header.

    **Base URL (Production):** https://api.bmadrecette.com
    **Base URL (Staging):** https://api-staging.bmadrecette.com

    **Rate Limits:**
    - Auth endpoints: 10 requests/minute
    - General API: 100 requests/minute
    - OCR endpoints: 5 requests/minute

servers:
  - url: https://api.bmadrecette.com
    description: Production server
  - url: https://api-staging.bmadrecette.com
    description: Staging server
  - url: http://localhost:3000
    description: Local development server

paths:
  # Authentication Endpoints
  /api/auth/register:
    post:
      summary: Register new user
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, firstName]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                firstName:
                  type: string
      responses:
        '201':
          description: User created successfully
        '409':
          description: Email already exists

  /api/auth/login:
    post:
      summary: Login with email/password
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Login successful
        '401':
          description: Invalid credentials

  # Recipe Endpoints
  /api/recipes:
    get:
      summary: Get user's recipes with filtering
      tags: [Recipes]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: tagIds
          in: query
          schema:
            type: string
          description: Comma-separated tag IDs
        - name: q
          in: query
          schema:
            type: string
          description: Search query
      responses:
        '200':
          description: Recipes retrieved successfully

    post:
      summary: Create new recipe
      tags: [Recipes]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [title, prepTime, cookTime, servings]
      responses:
        '201':
          description: Recipe created successfully

  /api/recipes/{id}:
    get:
      summary: Get recipe by ID
      tags: [Recipes]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Recipe details
        '404':
          description: Recipe not found

    put:
      summary: Update recipe
      tags: [Recipes]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Recipe updated

    delete:
      summary: Delete recipe
      tags: [Recipes]
      security:
        - bearerAuth: []
      responses:
        '204':
          description: Recipe deleted successfully

  # Shopping List Endpoints
  /api/shopping-lists/generate:
    post:
      summary: Generate shopping list from recipes
      tags: [Shopping Lists]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [recipeIds]
      responses:
        '201':
          description: Shopping list generated

  # Menu Endpoints
  /api/menus/generate:
    post:
      summary: Generate meal menu
      tags: [Menus]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [days, mealTypes]
      responses:
        '201':
          description: Menu generated

  # Sync Endpoints
  /api/sync/changes:
    get:
      summary: Get entities modified since timestamp
      tags: [Sync]
      security:
        - bearerAuth: []
      parameters:
        - name: since
          in: query
          required: true
          schema:
            type: string
            format: date-time
      responses:
        '200':
          description: Modified entities

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

**API Design Decisions:**

1. **RESTful Resource Naming**: Plural nouns (`/recipes`, `/shopping-lists`) following REST conventions
2. **Nested Routes for Relationships**: `/recipes/{id}/photos` clearly indicates photos belong to recipes
3. **Query Parameters for Filtering**: All list endpoints support filtering via query params (standard REST pattern)
4. **JWT Bearer Authentication**: Stateless auth, access tokens in Authorization header, refresh tokens for rotation
5. **OpenAPI 3.0 Spec**: Enables auto-generated client SDKs (TypeScript, Swift, Kotlin), Swagger UI documentation, request/response validation

---
