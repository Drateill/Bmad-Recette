# Epic Details

## Epic 1: Foundation & Core Authentication

**Goal**: Establish a production-ready foundation including project infrastructure (monorepo, CI/CD), basic deployment pipeline, authentication system (email/password + OAuth), and user management. Upon completion, the system will be deployable with functional health-check endpoints and user registration/login capability.

### Story 1.1: Project Setup & Monorepo Infrastructure

As a **developer**,
I want **a properly configured monorepo with all packages scaffolded and build tools configured**,
so that **I can develop web, mobile, and backend applications with shared code and unified workflows**.

**Acceptance Criteria:**

1. Monorepo structure created using Turborepo or Nx with `/packages` directory containing: web, mobile, backend, shared, database folders
2. TypeScript configured in strict mode across all packages with shared tsconfig base
3. ESLint and Prettier configured with pre-commit hooks (Husky + lint-staged) enforcing code quality
4. Package.json scripts created for: install, build, dev, test, lint across all workspaces
5. Git repository initialized with .gitignore covering node_modules, build artifacts, env files, and IDE configs
6. README.md created with setup instructions, architecture overview, and development commands

### Story 1.2: Backend API Foundation & Database Setup

As a **developer**,
I want **a NestJS backend API with PostgreSQL database, basic middleware, and health-check endpoint**,
so that **I have a deployable backend foundation with database connectivity verified**.

**Acceptance Criteria:**

1. NestJS application scaffolded with modular architecture (AppModule structure)
2. PostgreSQL database connection configured using TypeORM or Prisma with environment-based config
3. Redis connection configured for session management (connection verified on startup)
4. Database migrations framework set up with initial schema migration (users table placeholder)
5. Helmet.js configured for security headers, CORS middleware enabled with configurable origins
6. Health-check endpoint implemented at GET /api/health returning {status: "ok", timestamp, version}
7. Structured logging configured using Pino with JSON output format
8. Environment variable management implemented using dotenv with .env.example template

### Story 1.3: CI/CD Pipeline & Automated Testing

As a **developer**,
I want **GitHub Actions CI/CD pipelines configured for automated testing and deployment**,
so that **code quality is verified on every commit and deployments are automated**.

**Acceptance Criteria:**

1. GitHub Actions workflow created for PR validation (lint, type-check, unit tests) running on every push
2. Test coverage reporting configured to fail PR if coverage drops below 70% for new code
3. Separate workflow created for deployment to staging environment (triggered on merge to main)
4. Environment secrets management configured in GitHub (database URLs, API keys placeholders)
5. Build caching implemented to optimize CI run times (npm cache, TypeScript incremental builds)
6. Status checks configured as required for PR merging (tests must pass, linting must pass)

### Story 1.4: User Registration with Email/Password

As a **new user**,
I want **to create an account using my email and password**,
so that **I can access the BMad Recette platform and save my data**.

**Acceptance Criteria:**

1. POST /api/auth/register endpoint created accepting {email, password, firstName} with validation
2. Email validation enforces valid format; password validation enforces minimum 8 characters, 1 uppercase, 1 number
3. Password hashing implemented using bcrypt before storage (never store plaintext)
4. User record created in PostgreSQL users table with unique email constraint
5. Registration returns 201 Created with user object (excluding password) and JWT access + refresh tokens
6. Duplicate email registration returns 409 Conflict with clear error message
7. Rate limiting applied: max 5 registration attempts per IP per hour

### Story 1.5: User Login with Email/Password

As a **registered user**,
I want **to log in using my email and password**,
so that **I can access my recipes and personalized data**.

**Acceptance Criteria:**

1. POST /api/auth/login endpoint created accepting {email, password} with validation
2. Email lookup case-insensitive, password verified using bcrypt compare
3. Successful login returns 200 OK with user object and JWT access token (15 min expiry) + refresh token (7 days expiry)
4. Failed login returns 401 Unauthorized without revealing whether email or password was incorrect
5. Refresh token stored in httpOnly cookie (secure, sameSite: strict) for security
6. Rate limiting applied: max 10 login attempts per IP per hour to prevent brute force
7. Failed login attempts logged for security monitoring

### Story 1.6: OAuth Authentication (Google & Apple)

As a **new or existing user**,
I want **to sign in using my Google or Apple account**,
so that **I can access the app quickly without managing another password**.

**Acceptance Criteria:**

1. Passport.js configured with passport-google-oauth20 and passport-apple strategies
2. GET /api/auth/google endpoint initiates OAuth flow, callback at /api/auth/google/callback
3. GET /api/auth/apple endpoint initiates OAuth flow, callback at /api/auth/apple/callback
4. On successful OAuth callback, user created or retrieved from database using OAuth provider ID
5. New OAuth users have auto-generated profile with email from OAuth provider (if available)
6. OAuth login returns same JWT token structure as email/password login (access + refresh tokens)
7. Users can link multiple OAuth providers to same account (email as unique key)
8. OAuth configuration uses environment variables for client IDs and secrets

### Story 1.7: JWT Token Refresh & Session Management

As a **logged-in user**,
I want **my session to be automatically renewed when my access token expires**,
so that **I don't have to log in repeatedly during active use**.

**Acceptance Criteria:**

1. POST /api/auth/refresh endpoint created accepting refresh token from httpOnly cookie
2. Refresh token validated (signature, expiration) and checked against Redis session store
3. Valid refresh returns new access token (15 min expiry) and optionally rotates refresh token
4. Expired or invalid refresh token returns 401 Unauthorized, requiring new login
5. POST /api/auth/logout endpoint created, invalidating refresh token in Redis and clearing cookie
6. Redis stores refresh tokens with TTL matching expiration (7 days), auto-cleanup on expiry
7. Concurrent refresh requests handled gracefully (idempotent within 5-second window)

### Story 1.8: Web App Foundation & Authentication UI

As a **user**,
I want **a functional web application with login/register pages**,
so that **I can create an account and log in from my browser**.

**Acceptance Criteria:**

1. React 18+ application scaffolded with TypeScript, React Router v6, and Tailwind CSS
2. Login page created at /login with email and password inputs, "Sign in" button, and OAuth buttons (Google, Apple)
3. Registration page created at /register with email, password, firstName inputs and "Create account" button
4. Form validation implemented using React Hook Form + Zod (client-side validation mirrors backend rules)
5. Authentication state managed using Zustand store (token storage, user profile)
6. Protected route wrapper created, redirecting unauthenticated users to /login
7. JWT tokens stored in memory (access) and httpOnly cookie (refresh), automatic refresh on 401 responses
8. Loading states and error messages displayed for all auth actions (login, register, OAuth)

### Story 1.9: Mobile App Foundation & Authentication UI

As a **mobile user**,
I want **a functional mobile app with login/register screens**,
so that **I can create an account and log in from my iOS or Android device**.

**Acceptance Criteria:**

1. React Native with Expo scaffolded in /packages/mobile with TypeScript
2. React Navigation configured with authentication flow (Auth stack vs. App stack)
3. Login screen created with email and password inputs, "Sign in" button, and OAuth buttons
4. Registration screen created with email, password, firstName inputs and "Create account" button
5. Form validation implemented using React Hook Form + Zod (matching web validation)
6. Authentication state managed using Zustand (shared store from /packages/shared)
7. JWT tokens stored in AsyncStorage with secure encryption (expo-secure-store)
8. OAuth flow implemented using expo-auth-session for Google and Apple
9. Loading states, error messages, and keyboard-aware scroll views implemented for good UX

### Story 1.10: Deployment to Staging Environment

As a **developer**,
I want **the application deployed to a staging environment accessible via URL**,
so that **stakeholders can test the authentication flow and verify the foundation is production-ready**.

**Acceptance Criteria:**

1. Backend API deployed to Railway (or Render) with PostgreSQL and Redis provisioned
2. Web app deployed to Vercel with environment variables configured (API base URL)
3. Mobile app builds successfully for iOS (TestFlight) and Android (internal test track) - manual deployment for MVP
4. Staging environment accessible at predictable URLs (e.g., api-staging.bmadrecette.com, app-staging.bmadrecette.com)
5. Database migrations run automatically on deployment via CI/CD pipeline
6. Health-check endpoint verified returning 200 OK on staging
7. Staging environment uses separate database from production (staging data isolated)
8. Basic monitoring configured: Sentry for error tracking, uptime monitoring via health-check endpoint

## Epic 2: Recipe Management Core

**Goal**: Enable users to create, view, edit, and organize recipes through a complete CRUD system. Implement the foundational tag system architecture that powers all intelligent features (filtering, suggestions, menu generation). Upon completion, users can build their personal recipe library with rich metadata and powerful organization capabilities.

### Story 2.1: Recipe Database Schema & Core Models

As a **developer**,
I want **a normalized database schema for recipes with all required relationships**,
so that **recipes can be stored with ingredients, steps, tags, and metadata efficiently**.

**Acceptance Criteria:**

1. Recipes table created with fields: id, userId, title, description, prepTime, cookTime, servings, createdAt, updatedAt
2. Ingredients table created with fields: id, name, category, commonUnits (for auto-completion database)
3. RecipeIngredients junction table with fields: recipeId, ingredientId, quantity, unit, notes
4. Steps table with fields: id, recipeId, stepNumber, instruction, duration
5. Photos table with fields: id, recipeId, s3Url, thumbnailUrl, isPrimary, uploadedAt
6. Foreign key constraints and indexes configured for optimal query performance
7. Database migration scripts created and tested with rollback capability
8. Seed script created populating 500-1000 common ingredients with categories

### Story 2.2: Tag System Foundation & Database

As a **developer**,
I want **a flexible, extensible tag system that supports predefined and custom user tags**,
so that **the system can power filtering, search, suggestions, and menu generation**.

**Acceptance Criteria:**

1. TagCategories table created with 6 default categories: Time/Effort, Diet/Health, Dish Type, Occasion, World Cuisine, Budget
2. Tags table with fields: id, categoryId, name, slug, isSystem (true for predefined, false for user-created), userId (null for system tags)
3. RecipeTags junction table linking recipes to tags (many-to-many relationship)
4. 100+ predefined system tags seeded across all 6 categories (e.g., "Quick", "Vegetarian", "Dessert", "Budget-Friendly")
5. Unique constraint on (categoryId, slug) for system tags, (categoryId, slug, userId) for user tags
6. Tag assignment endpoint supports multiple tags in single operation (bulk insert)
7. Efficient indexing for tag-based queries (covering indexes on RecipeTags)

### Story 2.3: Create Recipe API & Business Logic

As a **user**,
I want **to create a new recipe with all details via API**,
so that **I can store my recipes in the system**.

**Acceptance Criteria:**

1. POST /api/recipes endpoint created accepting structured recipe payload with validation
2. Request body includes: title (required), description, prepTime, cookTime, servings, ingredients array, steps array, tagIds array
3. Ingredients array validated: each item has quantity (number), unit (string), ingredientId or ingredientName
4. Steps array validated: instructions (required), stepNumber (auto-assigned if omitted), duration (optional)
5. Transaction-based creation: recipe + ingredients + steps + tags created atomically (rollback on failure)
6. Response returns 201 Created with complete recipe object including nested ingredients, steps, tags
7. Authorization enforced: recipes belong to authenticated user (userId from JWT)
8. Input sanitization prevents XSS and SQL injection attacks

### Story 2.4: Recipe Photo Upload & Management

As a **user**,
I want **to upload one or more photos for my recipes**,
so that **I can visually identify and showcase my dishes**.

**Acceptance Criteria:**

1. POST /api/recipes/:id/photos endpoint accepts multipart/form-data with image file
2. Image validation: file size max 10MB, formats allowed: JPEG, PNG, WebP
3. Sharp library used to generate thumbnail (400x400) and optimize original image (compression, max 1920px width)
4. Images uploaded to S3 with unique filenames (userId/recipeId/uuid.ext), public-read ACL
5. Photo record created in database with s3Url, thumbnailUrl, fileSize, dimensions
6. First uploaded photo automatically marked as isPrimary (displayed in recipe cards)
7. PUT /api/recipes/:id/photos/:photoId/primary endpoint allows changing primary photo
8. DELETE /api/recipes/:id/photos/:photoId removes photo from S3 and database

### Story 2.5: Get Recipe Details API

As a **user**,
I want **to retrieve full recipe details by ID**,
so that **I can view a recipe with all ingredients, steps, tags, and photos**.

**Acceptance Criteria:**

1. GET /api/recipes/:id endpoint returns complete recipe object
2. Response includes nested relationships: ingredients (with quantity, unit, name), steps (ordered by stepNumber), tags (with category), photos (with thumbnailUrl)
3. Authorization check: users can only access their own recipes (userId match)
4. 404 Not Found returned if recipe doesn't exist or belongs to another user
5. Response includes computed fields: totalTime (prepTime + cookTime), ingredientCount, stepCount
6. Efficient database query using joins (single query, not N+1)
7. Response format consistent with recipe list endpoint for frontend reusability

### Story 2.6: Update Recipe API

As a **user**,
I want **to edit my existing recipes**,
so that **I can fix errors, add details, or adjust quantities**.

**Acceptance Criteria:**

1. PUT /api/recipes/:id endpoint accepts partial updates to recipe fields
2. Supports updating: title, description, prepTime, cookTime, servings, ingredients, steps, tags
3. Ingredients update replaces entire array (delete existing + insert new) within transaction
4. Steps update replaces entire array (delete existing + insert new) within transaction
5. Tags update uses upsert logic (add missing, remove extras) for efficiency
6. updatedAt timestamp automatically set to current time
7. Authorization enforced: only recipe owner can update
8. Optimistic locking prevents concurrent update conflicts (version field or updatedAt check)
9. Returns 200 OK with updated recipe object, or 409 Conflict if concurrent modification detected

### Story 2.7: Delete Recipe API

As a **user**,
I want **to permanently delete recipes I no longer need**,
so that **I can keep my library organized and remove mistakes**.

**Acceptance Criteria:**

1. DELETE /api/recipes/:id endpoint soft-deletes or hard-deletes recipe
2. Cascade deletion removes: recipe ingredients, steps, tags associations, photo records from database
3. Photos deleted from S3 asynchronously (queued job to avoid blocking response)
4. Authorization enforced: only recipe owner can delete
5. Returns 204 No Content on successful deletion
6. Returns 404 Not Found if recipe doesn't exist or unauthorized
7. Deletion logged for audit trail (userId, recipeId, deletedAt timestamp)

### Story 2.8: Recipe List & Filtering API

As a **user**,
I want **to view my recipe library with filtering and sorting options**,
so that **I can find recipes quickly based on various criteria**.

**Acceptance Criteria:**

1. GET /api/recipes endpoint returns paginated list of user's recipes
2. Query parameters supported: page, limit (default 20, max 100), sortBy (title, createdAt, prepTime), sortOrder (asc, desc)
3. Filtering by tags: ?tagIds=1,2,3 returns recipes matching ANY of the specified tags
4. Filtering by search query: ?q=chicken searches recipe title, description, and ingredient names (full-text search)
5. Filtering by time: ?maxTotalTime=30 returns recipes with totalTime ≤ 30 minutes
6. Each recipe in list includes: id, title, description, prepTime, cookTime, servings, primaryPhoto (thumbnail), tagIds, rating
7. Response includes pagination metadata: total, page, pageSize, totalPages
8. Efficient queries with proper indexing (avoid table scans on large datasets)

### Story 2.9: Recipe Templates Implementation

As a **user**,
I want **to create recipes from predefined templates**,
so that **I can quickly add common recipe types without starting from scratch**.

**Acceptance Criteria:**

1. GET /api/recipe-templates endpoint returns list of 5-10 predefined templates
2. Templates include: Dessert, Main Course, Appetizer, Beverage, Salad, Soup, Breakfast, Snack
3. Each template has: name, icon, defaultTags (pre-selected tags), defaultFields (e.g., servings: 4), placeholderIngredients, placeholderSteps
4. POST /api/recipes/from-template endpoint accepts templateId and creates recipe pre-filled with template defaults
5. User can immediately edit the template-created recipe (it's a normal recipe, not linked to template)
6. Templates stored as JSON configuration (no database table needed for MVP)
7. Frontend displays templates as visual cards during recipe creation flow

### Story 2.10: Portion Adjustment Algorithm

As a **user**,
I want **to adjust recipe portions using a multiplier**,
so that **I can scale ingredients for different serving sizes**.

**Acceptance Criteria:**

1. GET /api/recipes/:id/adjust-portions?multiplier=2 returns recipe with recalculated ingredient quantities
2. Multiplier validation: must be positive number, typically 0.25 to 10 (warn if outside range)
3. Quantity multiplication handles decimals correctly (e.g., 1.5 cups × 2 = 3 cups)
4. Unit conversion logic: 2 tbsp × 8 = 1 cup (smart conversion for common units)
5. Fractional display: 0.33 cups displayed as "1/3 cup" for readability (common fractions)
6. Non-scalable ingredients flagged: "to taste", "pinch", "dash" not multiplied
7. Response includes original servings and adjusted servings for reference
8. Adjustment is real-time calculation only (not saved to database unless user explicitly updates recipe)

### Story 2.11: Recipe Rating System

As a **user**,
I want **to rate my recipes with 1-5 stars**,
so that **I can remember which recipes I loved and prioritize favorites**.

**Acceptance Criteria:**

1. PUT /api/recipes/:id/rating endpoint accepts {rating: 1-5}
2. Rating stored in recipes table (rating column, nullable, default null)
3. Rating validation: integer between 1 and 5, or null to remove rating
4. Only recipe owner can rate their own recipes (no social/public ratings in MVP)
5. Recipe list API includes rating field for filtering/sorting
6. GET /api/recipes?minRating=4 filters recipes with rating ≥ 4
7. Star rating UI component displays half-stars for future decimal ratings (even if MVP uses integers)

### Story 2.12: Web Recipe Library UI

As a **user**,
I want **a web interface to view, create, and manage my recipes**,
so that **I can interact with my recipe collection from my browser**.

**Acceptance Criteria:**

1. Recipe Library page at /recipes displays grid/list view of recipes with toggle
2. Each recipe card shows: primary photo (or placeholder), title, rating stars, total time, tag badges (max 3 visible)
3. Search bar with real-time filtering (debounced API calls)
4. Tag filter sidebar with checkboxes for each category (collapsible categories)
5. Sort dropdown: Most Recent, Alphabetical, Shortest Time, Highest Rated
6. "Create Recipe" button opens recipe form modal or navigates to /recipes/new
7. Empty state for new users: "Get started by creating your first recipe" with illustration
8. Pagination controls at bottom (Previous, Page 1-N, Next)
9. Recipe cards clickable, navigate to /recipes/:id for detail view

### Story 2.13: Web Recipe Detail & Edit UI

As a **user**,
I want **to view full recipe details and edit recipes from the web app**,
so that **I can see all information and make changes easily**.

**Acceptance Criteria:**

1. Recipe Detail page at /recipes/:id displays: large photo, title, description, prep/cook/total time, servings, rating
2. Ingredients section lists each ingredient with quantity, unit, name (with checkboxes for cooking mode)
3. Steps section displays numbered instructions with optional duration per step
4. Tags displayed as colored badges grouped by category
5. Action buttons: Edit Recipe, Delete Recipe, Adjust Portions (dropdown), Share (future)
6. Edit Recipe opens form in edit mode (inline or modal) with all fields populated
7. Form validation displays errors inline (required fields, format validation)
8. Portion adjustment shows real-time preview with slider/input (×0.5 to ×10 range)
9. Delete confirmation modal: "Are you sure? This cannot be undone."
10. Mobile-responsive layout: stacked on mobile, two-column on desktop

### Story 2.14: Mobile Recipe Library & Detail UI

As a **mobile user**,
I want **to browse and view my recipes on my phone**,
so that **I can access recipes while shopping or cooking**.

**Acceptance Criteria:**

1. Recipe Library screen displays recipes in vertical scrollable list (infinite scroll or pagination)
2. Recipe cards optimized for mobile: large touch targets (min 44x44px), card height ~120px
3. Pull-to-refresh gesture reloads recipe list
4. Search bar at top with filter icon (opens filter bottom sheet)
5. Filter bottom sheet: tag checkboxes, time slider, rating filter, Apply/Clear buttons
6. Recipe Detail screen: full-screen photo at top, scrollable content below
7. Floating action buttons: Edit (pencil icon), Share, Adjust Portions (expand bottom sheet)
8. Ingredients and steps rendered in large, readable font (18px min for cooking readability)
9. Keep screen awake mode when viewing recipe (prevent auto-lock during cooking)
10. Swipe gesture to go back to library (native mobile pattern)


## Epic 3: OCR Scanning & Recipe Import

**Goal**: Enable users to digitize recipes from physical sources (cookbooks, magazines, printed recipes) using OCR technology. This differentiating feature allows users to centralize their entire recipe collection, including treasured family recipes and cookbook favorites that aren't available online.

### Story 3.1: Google Cloud Vision API Integration

As a **developer**,
I want **Google Cloud Vision API integrated for OCR text extraction**,
so that **we can accurately extract text from recipe photos**.

**Acceptance Criteria:**

1. Google Cloud Vision API credentials configured via environment variables
2. OCR service module created in backend with methods: extractText(imageBuffer), processRecipeScan(imageUrl)
3. API calls include error handling for rate limits, network failures, invalid images
4. Response text extraction includes bounding boxes and confidence scores for future enhancements
5. Cost tracking implemented: log API calls to monitor free tier usage (1000 images/month)
6. Fallback to Tesseract.js if Cloud Vision quota exceeded (with quality warning to user)
7. Unit tests mock Cloud Vision responses for offline development

### Story 3.2: OCR Scan API Endpoint

As a **user**,
I want **to upload a photo of a recipe and receive OCR-extracted text**,
so that **I can quickly digitize physical recipes**.

**Acceptance Criteria:**

1. POST /api/recipes/ocr-scan endpoint accepts multipart/form-data image file
2. Image validation: max 10MB, formats JPEG/PNG/WebP, resolution warning if <600px width
3. Image uploaded to S3 temporarily (deleted after 24 hours or successful recipe creation)
4. OCR processing returns extracted text with sections detected (title, ingredients, steps) as best-effort
5. Response includes: extractedText (raw), suggestedTitle, suggestedIngredients array, suggestedSteps array, confidence score
6. Processing completes within 10 seconds per NFR3, returns 202 Accepted if queued
7. Failed OCR returns 422 Unprocessable Entity with clear error message (e.g., "Text not detected")

### Story 3.3: OCR Text Parsing & Structuring

As a **user**,
I want **OCR results intelligently parsed into recipe structure**,
so that **I spend less time manually editing the extracted text**.

**Acceptance Criteria:**

1. Natural language processing identifies recipe sections: title (first line/largest text), ingredients (lists with quantities), steps (numbered or bulleted instructions)
2. Ingredient parsing extracts: quantity (number), unit (cups, tbsp, g), name (chicken breast, flour) using regex patterns
3. Common recipe keywords detected: "Ingredients:", "Directions:", "Instructions:", "Serves", "Prep time"
4. Quantities normalized: "1/2" → 0.5, "two" → 2, "a pinch" → handled as non-numeric
5. Units standardized: "tablespoons" → "tbsp", "ounces" → "oz", handles plurals
6. Steps numbered automatically if original text uses bullets or lacks numbers
7. Parser handles multiple formats: magazine recipes, handwritten notes, cookbook pages

### Story 3.4: Post-OCR Recipe Editor

As a **user**,
I want **an intuitive editor to review and correct OCR results before saving**,
so that **I can quickly fix any errors and finalize the recipe**.

**Acceptance Criteria:**

1. POST /api/recipes/from-ocr endpoint accepts: extractedText, suggestedTitle, suggestedIngredients, suggestedSteps, originalImageUrl
2. Editor UI displays side-by-side: original scanned image (left) and editable recipe form (right) on desktop
3. Form pre-populated with OCR suggestions: title, ingredients (editable table), steps (numbered textarea)
4. Inline corrections: click ingredient to edit quantity/unit/name, drag to reorder steps
5. "Add missing ingredient" and "Add missing step" buttons for incomplete OCR results
6. Original image remains visible during editing for reference (pinch-to-zoom on mobile)
7. Save button creates recipe with edited content, links to original scanned image as photo
8. "Discard" button deletes temporary S3 image and cancels creation

### Story 3.5: OCR Scan Mobile UI

As a **mobile user**,
I want **to scan recipes using my phone camera**,
so that **I can digitize recipes from cookbooks while browsing at home or in stores**.

**Acceptance Criteria:**

1. "Scan Recipe" button in mobile app opens camera with overlay guide (recipe card frame)
2. Camera captures photo, shows preview with "Retake" or "Use Photo" options
3. Image cropping tool allows user to trim edges before uploading (improves OCR accuracy)
4. Upload progress indicator shows: "Uploading..." → "Processing with OCR..." → "Ready to edit"
5. Post-scan editor optimized for mobile: full-screen form with "View Original" toggle
6. Ingredients table scrollable horizontally on small screens
7. Save button creates recipe and navigates to Recipe Detail screen
8. Error handling: "Camera permission denied" prompt, "OCR failed, try manual entry" fallback

### Story 3.6: OCR Scan Web UI

As a **web user**,
I want **to upload recipe photos from my computer for OCR scanning**,
so that **I can digitize recipes I've photographed or scanned**.

**Acceptance Criteria:**

1. "Scan Recipe" button in web app opens file picker (accept: image/jpeg, image/png, image/webp)
2. Drag-and-drop zone for image uploads with visual feedback
3. Image preview modal shows: thumbnail, file size, dimensions before upload
4. Upload button triggers OCR processing with animated progress bar
5. Post-scan editor displays: original image (left sidebar, zoomable), form (center), AI suggestions panel (right - optional)
6. Real-time validation: highlight unparsed ingredients (missing quantity or unit) in yellow
7. Keyboard shortcuts: Cmd+S to save, Cmd+Z to undo, Tab to navigate form fields
8. Batch upload future consideration: note in UI "Scan one recipe at a time in MVP"

### Story 3.7: OCR Quality Feedback & Improvement

As a **product team**,
I want **to collect OCR accuracy data**,
so that **we can improve parsing algorithms and justify investment in better OCR**.

**Acceptance Criteria:**

1. OCR results logged to database: scanId, userId, confidence score, manualEditsCount, timeToEdit
2. manualEditsCount tracks: number of ingredient edits, step edits, title changes after OCR
3. Optional user feedback prompt: "How accurate was the scan? 👍 Good / 👎 Needs work"
4. Failed OCR attempts logged with image metadata for debugging (resolution, format, file size)
5. Weekly report generated: average confidence score, edit rate, failure rate
6. Dashboard shows OCR cost: API calls used, cost per scan, monthly burn rate vs. budget
7. A/B testing infrastructure: allow switching between Cloud Vision and Tesseract.js for comparison


## Epic 4: Shopping List Intelligence

**Goal**: Deliver the complete shopping list generation system with intelligent ingredient aggregation, multiple organization modes, and seamless sharing. This killer feature transforms selected recipes into optimized, actionable shopping lists that reduce time spent planning and shopping.

### Story 4.1: Shopping List Generation API

As a **user**,
I want **to generate a shopping list from selected recipes**,
so that **I have a consolidated list of ingredients to buy**.

**Acceptance Criteria:**

1. POST /api/shopping-lists/generate endpoint accepts: recipeIds array, portionAdjustments object {recipeId: multiplier}
2. Algorithm fetches all ingredients from selected recipes, applies portion multipliers
3. Shopping list record created in database with: id, userId, name (auto: "Shopping List - Jan 6"), recipeIds, createdAt
4. ShoppingListItems table stores: listId, ingredientName, totalQuantity, unit, recipeIds (which recipes need this ingredient)
5. Response returns: listId, items array (ingredientName, quantity, unit, checked: false, recipeNames array)
6. Empty recipe selection returns 400 Bad Request with message
7. Generated list persists in database for later editing and sharing

### Story 4.2: Intelligent Ingredient Aggregation

As a **user**,
I want **duplicate ingredients automatically combined with unit conversion**,
so that **I don't buy the same item multiple times**.

**Acceptance Criteria:**

1. Aggregation algorithm identifies duplicates: "chicken breast" matches "chicken breasts" (pluralization)
2. Unit conversion: 2 cups + 4 tbsp = 2.25 cups (standard conversions: tbsp→cups, tsp→tbsp, oz→lb, g→kg)
3. Mixed units preserved when conversion unclear: "1 cup flour" + "200g flour" → shows both with note
4. Ingredient synonym detection: "scallions" and "green onions" flagged as potential duplicates (warning, not auto-merge)
5. Small quantities optimized: 0.25 cups displayed as "1/4 cup", 0.5 lb as "8 oz" for readability
6. Aggregation handles edge cases: "to taste", "pinch", "dash" items not aggregated
7. Grouped total shows source recipes: "Tomatoes (2 cups) - from Pasta Sauce, Salad"

### Story 4.3: Shopping List Organization Modes

As a **user**,
I want **to reorganize my shopping list by aisle, recipe, or alphabetically**,
so that **I can shop efficiently based on my preferred store layout**.

**Acceptance Criteria:**

1. GET /api/shopping-lists/:id?organize=aisle returns items grouped by store section
2. Aisle categories: Produce, Meat/Seafood, Dairy, Bakery, Canned Goods, Frozen, Spices, Other
3. Ingredient-to-aisle mapping stored in database (Ingredients table has aisleCategory field)
4. GET /api/shopping-lists/:id?organize=recipe groups items by which recipe(s) need them
5. GET /api/shopping-lists/:id?organize=alphabetical returns items sorted A-Z
6. Organization mode saved per user preference (default: aisle)
7. Real-time re-organization on frontend (client-side sorting, no API call) after initial load

### Story 4.4: Inventory Deduction from Shopping List

As a **user**,
I want **to mark ingredients I already have and exclude them from the shopping list**,
so that **I only buy what I'm missing**.

**Acceptance Criteria:**

1. Inventory table created: userId, ingredientId, quantity, unit, addedAt, expiresAt (optional)
2. GET /api/inventory returns user's saved inventory items
3. POST /api/inventory adds ingredient to inventory with quantity
4. Shopping list generation checks inventory: if user has "2 cups flour" and list needs "3 cups", show "1 cup flour (need more)"
5. UI shows inventory status per item: "✓ Have enough", "⚠️ Need 1 more cup", "✗ Don't have"
6. "Remove from list" button for items user already has (soft delete, item marked checked=true)
7. Inventory management basic: add/remove items, no expiration tracking in MVP (V2 feature)

### Story 4.5: Shopping List Item Check-Off

As a **user**,
I want **to check off items as I shop**,
so that **I can track what I've purchased and what's remaining**.

**Acceptance Criteria:**

1. PUT /api/shopping-lists/:listId/items/:itemId endpoint updates checked status
2. Checked items visually struck-through or moved to "Completed" section
3. Check-off persists across sessions (saved in database)
4. Undo check-off: tap checked item to uncheck
5. "Mark all as purchased" button completes entire list
6. Progress indicator shows: "5 of 12 items purchased"
7. Checked items optionally hidden with "Show completed" toggle

### Story 4.6: Shopping List Sharing

As a **user**,
I want **to share my shopping list with family or household members**,
so that **anyone can pick up groceries using the same list**.

**Acceptance Criteria:**

1. POST /api/shopping-lists/:id/share endpoint accepts: method (email, sms, link)
2. Email sharing: send via SendGrid with link to view/edit list (requires recipient account or guest access)
3. SMS sharing: send via Twilio with short link (bit.ly or custom short URL)
4. Shareable link generation: public URL with secure token (read-only or edit permissions)
5. Real-time collaboration: multiple users can check off items, changes sync via polling (WebSocket upgrade in V2)
6. Shared list permissions: owner can revoke access, delete list
7. Guest access: non-users can view list via link without account (limited to 7 days expiry)

### Story 4.7: Shopping List Cost Estimation

As a **user**,
I want **to see an estimated total cost for my shopping list**,
so that **I can budget appropriately before shopping**.

**Acceptance Criteria:**

1. IngredientPrices table stores: ingredientId, averagePrice (in euros), unit, region, updatedAt
2. Prices populated from public datasets or manual entry (500 common ingredients)
3. Cost calculation: sum(quantity × unitPrice) for all items
4. Total displayed with disclaimer: "Estimated cost: €42.50 (prices may vary by store)"
5. Per-item cost shown in list: "Chicken breast (500g) - ~€8.00"
6. Cost estimation accuracy tracked for future improvement
7. No real-time price API integration in MVP (too expensive, V2 feature)

### Story 4.8: Web Shopping List UI

As a **user**,
I want **a web interface to generate, view, and manage shopping lists**,
so that **I can plan my shopping from my computer**.

**Acceptance Criteria:**

1. "Generate Shopping List" button on Recipe Library page (multi-select recipes with checkboxes)
2. Generation modal: select recipes, adjust portions per recipe, "Generate" button
3. Shopping List View page at /shopping-lists/:id displays items with checkboxes
4. Organization mode selector: dropdown (By Aisle / By Recipe / Alphabetical)
5. Each item shows: checkbox, name, quantity/unit, recipe names (tooltip), inventory status icon
6. Action buttons: Share (opens share modal), Print, Edit, Delete List
7. Share modal: tabs for Email, SMS, Copy Link with respective input fields
8. Print view: printer-friendly layout without navigation (CSS @media print)

### Story 4.9: Mobile Shopping List UI

As a **mobile user**,
I want **a mobile shopping list optimized for in-store shopping**,
so that **I can efficiently check off items while grocery shopping**.

**Acceptance Criteria:**

1. Shopping List screen with large, thumb-friendly checkboxes (min 44x44px touch target)
2. Swipe gesture to check/uncheck items (alternative to tap)
3. Large, readable font (18px min) for easy reading while walking
4. Sticky header shows: progress "5/12 items", organization mode selector
5. Checked items fade out or move to bottom section (user preference)
6. Share button opens native share sheet (iOS/Android)
7. Keep screen awake mode enabled on shopping list screen
8. Offline mode: list cached locally, check-offs sync when connection restored
9. "Add item" button for manual additions during shopping (quick text input)


## Epic 5: Ingredient-Based Recipe Suggestions

**Goal**: Build the ingredient matching system that suggests recipes based on what users already have at home. This anti-waste feature helps users discover cooking possibilities with available ingredients, reducing trips to the store and food waste.

### Story 5.1: Ingredient Inventory Management API

As a **user**,
I want **to maintain an inventory of ingredients I have at home**,
so that **the system can suggest recipes I can make right now**.

**Acceptance Criteria:**

1. GET /api/inventory returns user's current ingredient inventory
2. POST /api/inventory/bulk-add accepts array of ingredientIds or names for quick entry
3. PUT /api/inventory/:id updates quantity for existing inventory item
4. DELETE /api/inventory/:id removes ingredient from inventory
5. Inventory items have optional expirationDate field for future smart suggestions
6. Quick-add from common ingredients: GET /api/inventory/suggestions returns frequently used ingredients
7. Inventory persists across sessions, no automatic expiration/removal in MVP

### Story 5.2: Recipe Matching Algorithm

As a **user**,
I want **to see which recipes I can make with my available ingredients**,
so that **I can cook without going shopping**.

**Acceptance Criteria:**

1. GET /api/recipes/match-ingredients?inventoryIds=1,2,3 returns recipes ordered by match percentage
2. Match calculation: (availableIngredients / totalIngredients) × 100
3. 100% match recipes displayed first ("You can make these now!")
4. 70-99% match recipes shown with missing ingredients list
5. <70% match recipes excluded from results (too many missing items)
6. Missing ingredients highlighted: "You need: 2 eggs, 1 cup milk"
7. Filter options: show only 100% matches, include partial matches, min match percentage slider

### Story 5.3: Ingredient Suggestion Filters

As a **user**,
I want **to filter ingredient-based suggestions by tags and constraints**,
so that **I find recipes matching my current needs (time, diet, difficulty)**.

**Acceptance Criteria:**

1. Query parameters added: ?tagIds=1,2&maxPrepTime=30&minRating=4
2. Tag filtering works on top of ingredient matching (intersection of both filters)
3. Time filter: only show recipes completable in specified time
4. Rating filter: only show recipes above specified rating
5. Filters applied server-side for performance (indexed queries)
6. Filter UI shows count: "12 recipes match your filters"
7. "Clear filters" button resets to ingredient-only matching

### Story 5.4: Missing Ingredient Shopping List Quick-Add

As a **user**,
I want **to quickly add missing ingredients to a shopping list**,
so that **I can shop for what I need to complete a partially-matched recipe**.

**Acceptance Criteria:**

1. Recipe match results show "Add missing items to cart" button for partial matches
2. Button creates new shopping list or adds to existing active list
3. Only missing ingredients added (available ingredients excluded)
4. Quantities adjusted to recipe requirements
5. Confirmation toast: "Added 3 items to shopping list"
6. Link to shopping list: "View list" button in toast
7. Supports bulk add: select multiple partial-match recipes, add all missing ingredients at once

### Story 5.5: Inventory Quick-Entry from Shopping List

As a **user**,
I want **to automatically update my inventory after shopping**,
so that **I don't manually re-enter purchased items**.

**Acceptance Criteria:**

1. Completed shopping list shows "Add purchased items to inventory" button
2. All checked items from list added to inventory with purchased quantities
3. Duplicate handling: if ingredient exists in inventory, add quantities together
4. Confirmation modal: "Add 12 items to inventory?" with item preview
5. Inventory updated in bulk transaction (atomic operation)
6. Success message: "Inventory updated with 12 new items"
7. Optional: auto-update inventory on list completion (user preference)

### Story 5.6: Web Ingredient Matching UI

As a **user**,
I want **a web interface to input available ingredients and see recipe suggestions**,
so that **I can discover what to cook based on what I have**.

**Acceptance Criteria:**

1. "What Can I Cook?" page at /suggestions displays ingredient input interface
2. Ingredient selector: searchable multi-select dropdown OR quick checkboxes of common items
3. Selected ingredients displayed as removable chips/tags
4. "Find Recipes" button triggers matching algorithm
5. Results display: 100% matches section (green header), Partial matches section (yellow header)
6. Each result shows: recipe card, match percentage badge, missing ingredients list
7. Filter sidebar: tags, time, rating with live result count
8. Empty state: "Select ingredients to see recipe suggestions"

### Story 5.7: Mobile Ingredient Matching UI

As a **mobile user**,
I want **to quickly input ingredients and find recipes on my phone**,
so that **I can check what to cook while in my kitchen**.

**Acceptance Criteria:**

1. "What Can I Cook?" screen in mobile app with large ingredient input
2. Quick-add grid: visual buttons for top 20 common ingredients (eggs, chicken, rice, etc.)
3. Search bar for additional ingredients (autocomplete dropdown)
4. Selected ingredients shown as chips with X to remove
5. "Find Recipes" button (sticky at bottom) shows count: "Find Recipes (12)"
6. Results screen: tabs for "Perfect Matches" and "Close Matches"
7. Recipe cards show prominent match percentage: large "100%" or "85%" badge
8. Pull-to-refresh reloads suggestions if inventory changed

## Epic 6: Smart Menu Generation

**Goal**: Implement the intelligent menu generator that creates balanced, varied meal plans for 1-14 days. The algorithm prevents ingredient repetition, balances protein variety, respects user constraints (tags, time), and seamlessly integrates with shopping list generation for the complete meal planning workflow.

### Story 6.1: Menu Generation Algorithm Foundation

As a **user**,
I want **an intelligent algorithm to generate balanced menus**,
so that **I get varied meals without repetitive ingredients**.

**Acceptance Criteria:**

1. POST /api/menus/generate endpoint accepts: days (1-14), mealsPerDay (1-3), mealTypes array (breakfast, lunch, dinner, snack), tagConstraints object
2. Algorithm selects recipes randomly with constraints: no recipe repetition, no main ingredient repetition in consecutive meals
3. Protein variety enforced: beef/pork/chicken/fish/vegetarian rotated across days
4. Tag constraints applied: if {vegetarian: 3} specified, 3 days have vegetarian recipes
5. Total time balanced: mix of quick (<30min) and longer recipes throughout week
6. Difficulty balanced: not all complex recipes in one day
7. Generated menu saved to database with id, userId, startDate, meals array, createdAt

### Story 6.2: Menu Templates System

As a **user**,
I want **pre-configured menu templates for common scenarios**,
so that **I can quickly generate specialized menus without custom configuration**.

**Acceptance Criteria:**

1. GET /api/menu-templates returns 5-10 predefined templates
2. Templates include: "Vegetarian Week", "Quick Meals Week", "Batch Cooking Weekend", "Family Friendly", "Budget Meals"
3. Each template has: name, icon, defaultDays, defaultMealsPerDay, tagConstraints, description
4. POST /api/menus/from-template/:templateId generates menu using template config
5. User can override template settings before generation
6. Templates stored as JSON configuration (no database needed)
7. Template selection UI shows benefits: "Vegetarian Week: 7 days of plant-based meals"

### Story 6.3: Partial Menu Regeneration

As a **user**,
I want **to regenerate specific meals without losing the entire menu**,
so that **I can replace meals I don't like while keeping the rest**.

**Acceptance Criteria:**

1. PUT /api/menus/:id/regenerate-meal accepts: day, mealType (breakfast/lunch/dinner)
2. Algorithm selects new recipe for specified meal respecting original constraints
3. New recipe doesn't conflict with other meals (no ingredient repetition check)
4. Updated menu returned with single meal changed
5. Regeneration history tracked (optional): meal regenerated count for analytics
6. UI shows "↻ Regenerate" button on each meal card
7. Regeneration instant (no full menu recalculation, just one slot)

### Story 6.4: Menu Favorites & Reuse

As a **user**,
I want **to save favorite menus for reuse**,
so that **I can quickly generate the same weekly plan again**.

**Acceptance Criteria:**

1. PUT /api/menus/:id/favorite marks menu as favorite (isFavorite boolean)
2. GET /api/menus?favorites=true returns only favorited menus
3. POST /api/menus/:id/duplicate creates new menu with same recipes (new startDate)
4. Favorite menus shown in "My Favorites" section of menu list
5. Duplicate button creates copy: "Copy of Vegetarian Week Jan 2026"
6. User can edit duplicated menu before finalizing
7. Max 20 saved menus per user (soft limit, can increase in V2)

### Story 6.5: Menu to Shopping List Integration

As a **user**,
I want **to generate a shopping list for an entire menu with one click**,
so that **I can shop for a full week of meals efficiently**.

**Acceptance Criteria:**

1. POST /api/menus/:id/shopping-list generates shopping list from all menu recipes
2. All recipes in menu included with default portions (adjustable before generation)
3. Shopping list named: "Shopping for [Menu Name]" or "Shopping for Jan 6-12"
4. Generated list includes all unique ingredients across all meals with aggregation
5. "Generate Shopping List" button prominent on menu detail page
6. Option to exclude specific meals from shopping list (checkboxes)
7. Shopping list linked back to menu (menuId field) for context

### Story 6.6: Menu Calendar View

As a **user**,
I want **to view my menu in a calendar format**,
so that **I can see what I'm cooking each day at a glance**.

**Acceptance Criteria:**

1. GET /api/menus/:id returns menu with meals structured by day and mealType
2. Calendar view displays: days as columns, meal types as rows
3. Each cell shows: recipe name, photo thumbnail, prep time, tags (3 max visible)
4. Click recipe card opens recipe detail modal or navigates to recipe page
5. Drag-and-drop to swap meals between days (updates menu via API)
6. Today's meals highlighted with distinct border/background color
7. Print-friendly calendar view (CSS @media print)

### Story 6.7: Web Menu Generator UI

As a **user**,
I want **a web interface to generate and manage menus**,
so that **I can plan my meals from my computer**.

**Acceptance Criteria:**

1. "Generate Menu" page at /menus/generate with configuration form
2. Form inputs: days slider (1-14), meals per day checkboxes (breakfast/lunch/dinner/snack), tag filters
3. Template selection: visual cards "Start from template" or "Custom configuration"
4. Generate button shows loading state: "Generating your menu..."
5. Generated menu displays in calendar grid view with meal cards
6. Action buttons: Save to Favorites, Edit Menu, Generate Shopping List, Print, Delete
7. Menu list page at /menus shows saved menus as cards (name, date range, meal count)

### Story 6.8: Mobile Menu Generator UI

As a **mobile user**,
I want **to generate and view menus on my phone**,
so that **I can plan meals and reference them while shopping or cooking**.

**Acceptance Criteria:**

1. "Generate Menu" screen with mobile-optimized form (large touch inputs)
2. Quick-start templates: swipeable cards "Tap to generate from template"
3. Generated menu displays as vertical scrollable day list (not grid)
4. Each day card shows: date, meal cards (breakfast/lunch/dinner), total time
5. Swipe meal card left to reveal "Regenerate" and "Remove" actions
6. "Generate Shopping List" button sticky at bottom of menu view
7. Calendar view toggle: switch between list and calendar grid layouts
8. Offline access: recently viewed menus cached for offline reference

## Epic 7: Cross-Platform Sync & Offline Support

**Goal**: Enable seamless real-time synchronization across web and mobile platforms with robust offline functionality. Users can access their recipes anywhere, continue working without internet, and have changes automatically synced when reconnected.

### Story 7.1: Sync Infrastructure & Conflict Resolution

As a **developer**,
I want **a synchronization system with last-write-wins conflict resolution**,
so that **user data stays consistent across devices**.

**Acceptance Criteria:**

1. All data models include: updatedAt timestamp, lastSyncedAt timestamp, version number
2. PUT /api/sync endpoint accepts: entity type, entity ID, updatedAt, data payload
3. Conflict detection: if server updatedAt > client updatedAt, conflict exists
4. Last-write-wins resolution: most recent updatedAt wins, older update rejected with 409 Conflict
5. Delta sync: GET /api/sync?since=<timestamp> returns only entities modified after timestamp
6. Sync queue on client: failed sync attempts queued and retried
7. Sync status tracking: lastSyncedAt per device stored in user_devices table

### Story 7.2: Offline Data Storage - Web

As a **web user**,
I want **my recipes and data cached offline**,
so that **I can access them without internet connection**.

**Acceptance Criteria:**

1. IndexedDB configured via Dexie.js with tables: recipes, shoppingLists, menus, inventory, syncQueue
2. Service worker (Workbox) caches: API responses, recipe photos, app shell (HTML/CSS/JS)
3. Offline-first architecture: read from IndexedDB first, fetch from API if miss or stale
4. Write operations queued in syncQueue when offline, synced when connection restored
5. Offline indicator in UI: banner "You're offline - changes will sync when connected"
6. Conflict warning: if sync fails due to conflict, show modal "This recipe was updated elsewhere"
7. Cache invalidation: clear stale data after 7 days or on user logout

### Story 7.3: Offline Data Storage - Mobile

As a **mobile user**,
I want **my recipes available offline**,
so that **I can cook and shop without cellular data or WiFi**.

**Acceptance Criteria:**

1. AsyncStorage (with expo-secure-store encryption) stores: auth tokens, user profile
2. Local SQLite database (expo-sqlite) stores: recipes, ingredients, tags, shopping lists, menus
3. Image caching via expo-file-system: recipe photos downloaded and cached locally
4. Offline mode auto-detected via NetInfo (no connection = offline mode)
5. Sync queue persists pending changes: creates, updates, deletes queued with retry logic
6. Background sync: when app reopens with connection, auto-sync queued changes
7. Storage management: limit offline cache to 200 recipes or 500MB, user can clear cache

### Story 7.4: Real-Time Sync Polling

As a **user**,
I want **changes made on one device to appear on my other devices quickly**,
so that **I have a seamless multi-device experience**.

**Acceptance Criteria:**

1. Polling interval: every 30 seconds when app active, every 5 minutes when app backgrounded
2. GET /api/sync/changes?since=<lastSyncTimestamp> returns modified entities
3. Client merges server changes into local database (update if updatedAt newer)
4. Push notifications on mobile when critical sync occurs (optional, basic in MVP)
5. Sync triggered manually: "Sync Now" button in settings
6. Sync status indicator: last synced timestamp shown in UI ("Last synced: 2 min ago")
7. Exponential backoff on sync failures: retry after 1s, 2s, 4s, 8s, max 60s

### Story 7.5: Data Export & Backup

As a **user**,
I want **to export my complete data as a backup file**,
so that **I can restore it if I lose access or switch to another device**.

**Acceptance Criteria:**

1. GET /api/users/export generates complete data export as JSON file
2. Export includes: all recipes (with ingredients, steps, tags, photos as URLs), shopping lists, menus, inventory
3. Export excludes: sensitive data (password hash, OAuth tokens)
4. File download triggered: bmad-recette-backup-2026-01-06.json
5. Export runs asynchronously for large datasets: 202 Accepted, poll for completion
6. Export file encrypted with user password (optional security enhancement)
7. RGPD compliance: export fulfills "right to data portability" requirement

### Story 7.6: Data Import & Restore

As a **user**,
I want **to import data from a backup file**,
so that **I can restore my recipes after data loss or on a new device**.

**Acceptance Criteria:**

1. POST /api/users/import accepts JSON file upload (max 50MB)
2. Import validates file format: checks schema version, required fields
3. Duplicate handling: merge strategy (skip existing, overwrite, or create duplicates) user-selectable
4. Import runs asynchronously: 202 Accepted, progress updates via polling endpoint
5. Import summary returned: "Imported: 45 recipes, 3 shopping lists, 2 menus"
6. Failed imports logged: invalid entries reported to user with line numbers
7. Import creates audit log entry for security tracking

### Story 7.7: Sync Settings & Preferences

As a **user**,
I want **to configure sync preferences**,
so that **I can control bandwidth usage and sync behavior**.

**Acceptance Criteria:**

1. Settings page includes "Sync & Offline" section
2. Toggle: Auto-sync enabled/disabled (default: enabled)
3. Option: Sync only on WiFi (mobile data-saving mode)
4. Option: Download recipe photos for offline (default: enabled)
5. Cache size limit: slider 100MB - 1GB (default: 500MB)
6. "Clear offline cache" button with confirmation
7. Sync status dashboard: last sync time, pending changes count, cache size used

### Story 7.8: Multi-Device Management

As a **user**,
I want **to see which devices are synced to my account**,
so that **I can manage access and revoke devices I no longer use**.

**Acceptance Criteria:**

1. GET /api/users/devices returns list of devices with: deviceId, name (iPhone, Chrome), lastSyncedAt, createdAt
2. Device registration on login: device fingerprint generated and stored
3. Device list shown in settings: "Your Devices" section
4. Revoke device button: DELETE /api/users/devices/:id removes device, invalidates its refresh tokens
5. Current device highlighted: "This device (Web - Chrome)"
6. Device limit: max 5 devices per user (soft limit, can increase in V2)
7. Security: email notification when new device logs in (optional enhancement)
