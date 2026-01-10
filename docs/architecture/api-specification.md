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
      summary: Login with email/password (case-insensitive)
      description: |
        Authenticates user with email and password. Returns JWT access token (15 min expiry) in response body and refresh token (7 days expiry) in httpOnly cookie.

        **Security Features:**
        - Case-insensitive email lookup
        - Generic "Invalid credentials" error (prevents user enumeration)
        - Rate limiting: 10 attempts per IP per hour
        - Failed attempts logged for security monitoring
        - Refresh token in httpOnly cookie (XSS-proof)
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
                  format: email
                  example: user@example.com
                  description: User's email (case-insensitive)
                password:
                  type: string
                  example: Password123
                  description: User's password
      responses:
        '200':
          description: Login successful
          headers:
            Set-Cookie:
              description: Refresh token as httpOnly cookie
              schema:
                type: string
                example: refreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    type: object
                    properties:
                      id:
                        type: string
                        format: uuid
                      email:
                        type: string
                      firstName:
                        type: string
                      createdAt:
                        type: string
                        format: date-time
                  accessToken:
                    type: string
                    description: JWT access token (15 min expiry)
                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
              example:
                user:
                  id: "123e4567-e89b-12d3-a456-426614174000"
                  email: "user@example.com"
                  firstName: "John"
                  createdAt: "2026-01-07T10:30:00.000Z"
                accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        '400':
          description: Validation error (invalid email format or missing fields)
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: object
                    properties:
                      code:
                        type: string
                      message:
                        type: string
                      timestamp:
                        type: string
                        format: date-time
        '401':
          description: Invalid credentials (user not found, wrong password, or OAuth-only account)
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Invalid credentials"
        '429':
          description: Too many login attempts (rate limit exceeded)
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "ThrottlerException: Too Many Requests"

  /api/auth/google:
    get:
      summary: Initiate Google OAuth flow
      description: |
        Redirects to Google authorization URL for OAuth 2.0 authentication.
        User will be prompted to sign in with their Google account and grant permissions.
      tags: [Authentication, OAuth]
      responses:
        '302':
          description: Redirect to Google authorization URL
          headers:
            Location:
              description: Google OAuth authorization endpoint
              schema:
                type: string
                example: https://accounts.google.com/o/oauth2/v2/auth?client_id=...

  /api/auth/google/callback:
    get:
      summary: Google OAuth callback
      description: |
        Handles OAuth callback from Google after user authorization.
        Creates new user, links to existing account, or retrieves existing OAuth user.
        Redirects to frontend with access token in URL and refresh token in httpOnly cookie.
      tags: [Authentication, OAuth]
      parameters:
        - name: code
          in: query
          required: true
          schema:
            type: string
          description: Authorization code from Google
        - name: state
          in: query
          schema:
            type: string
          description: CSRF protection state parameter
      responses:
        '302':
          description: Redirect to frontend with token
          headers:
            Location:
              description: Frontend success URL with access token
              schema:
                type: string
                example: http://localhost:5173/auth/success?token=eyJhbGc...
            Set-Cookie:
              description: Refresh token as httpOnly cookie
              schema:
                type: string
                example: refreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800
        '400':
          description: Missing email from OAuth provider
        '500':
          description: OAuth authentication failed (redirects to frontend error page)

  /api/auth/apple:
    get:
      summary: Initiate Apple OAuth flow
      description: |
        Redirects to Apple authorization URL for Sign in with Apple.
        User will be prompted to sign in with their Apple ID and grant permissions.
      tags: [Authentication, OAuth]
      responses:
        '302':
          description: Redirect to Apple authorization URL
          headers:
            Location:
              description: Apple OAuth authorization endpoint
              schema:
                type: string
                example: https://appleid.apple.com/auth/authorize?client_id=...

  /api/auth/apple/callback:
    get:
      summary: Apple OAuth callback (GET)
      description: |
        Handles OAuth callback from Apple after user authorization.
        Creates new user, links to existing account, or retrieves existing OAuth user.
        Redirects to frontend with access token in URL and refresh token in httpOnly cookie.

        **Apple-specific behavior:**
        - Email and name provided only on first authorization
        - Subsequent logins retrieve email from stored OAuth provider record
      tags: [Authentication, OAuth]
      parameters:
        - name: code
          in: query
          required: true
          schema:
            type: string
          description: Authorization code from Apple
        - name: user
          in: query
          schema:
            type: string
          description: User data (JSON string, only on first login)
      responses:
        '302':
          description: Redirect to frontend with token
          headers:
            Location:
              description: Frontend success URL with access token
              schema:
                type: string
                example: http://localhost:5173/auth/success?token=eyJhbGc...
            Set-Cookie:
              description: Refresh token as httpOnly cookie
              schema:
                type: string
                example: refreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800
        '400':
          description: Missing email from OAuth provider
        '500':
          description: OAuth authentication failed (redirects to frontend error page)
    post:
      summary: Apple OAuth callback (POST)
      description: |
        Handles OAuth callback from Apple (Apple may use POST for callback).
        Identical behavior to GET /api/auth/apple/callback.
      tags: [Authentication, OAuth]
      requestBody:
        content:
          application/x-www-form-urlencoded:
            schema:
              type: object
              properties:
                code:
                  type: string
                user:
                  type: string
      responses:
        '302':
          description: Redirect to frontend with token (same as GET callback)

  /api/auth/refresh:
    post:
      summary: Refresh access token with automatic token rotation
      description: |
        Generates a new access token using the refresh token from httpOnly cookie.
        Validates refresh token signature, expiration, and presence in Redis session store.
        Implements token rotation: generates new refresh token and invalidates the old one.
        Includes 5-second idempotency window to handle concurrent requests from multiple tabs.

        **Security Features:**
        - Refresh token from httpOnly cookie (secure, XSS-proof)
        - Token validated against Redis session store (enables revocation)
        - Token rotation: new refresh token generated on each refresh
        - Idempotency window: 5 seconds for concurrent requests
        - Rate limiting: 10 requests per hour per IP
        - Returns new 15-minute access token and new 7-day refresh token (in cookie)
      tags: [Authentication]
      parameters:
        - name: refreshToken
          in: cookie
          required: true
          schema:
            type: string
          description: Refresh token from httpOnly cookie (automatically sent by browser)
      responses:
        '200':
          description: Access token refreshed successfully, new refresh token set in cookie
          headers:
            Set-Cookie:
              description: New refresh token as httpOnly cookie (token rotation)
              schema:
                type: string
                example: refreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string
                    description: New JWT access token (15 min expiry)
                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        '401':
          description: Refresh token invalid, expired, or not found in session store
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode:
                    type: integer
                    example: 401
                  message:
                    type: string
                    example: "Invalid refresh token"
        '429':
          description: Too many refresh requests (rate limit exceeded)

  /api/auth/logout:
    post:
      summary: Logout user
      description: |
        Invalidates refresh token in Redis session store and clears httpOnly cookie.
        Always returns 204 No Content, even if token is missing or invalid (graceful logout).

        **Security Features:**
        - Deletes refresh token from Redis (prevents reuse)
        - Clears httpOnly cookie
        - Logs logout event for security audit
        - Graceful handling: succeeds even if token missing
      tags: [Authentication]
      parameters:
        - name: refreshToken
          in: cookie
          schema:
            type: string
          description: Refresh token from httpOnly cookie (optional, graceful if missing)
      responses:
        '204':
          description: Logout successful (no content)
          headers:
            Set-Cookie:
              description: Clears refresh token cookie
              schema:
                type: string
                example: refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=0

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
