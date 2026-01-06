# Data Models

Based on the PRD's functional requirements and Epic structure, these are the core business entities shared between frontend and backend via TypeScript interfaces in `packages/shared/`.

## User

**Purpose:** Represents authenticated users of the BMad Recette platform with profile information and authentication credentials.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `email`: string (unique, indexed) - User's email address for login and communication
- `firstName`: string - User's first name for personalization
- `passwordHash`: string (nullable) - Bcrypt hash for email/password auth (null for OAuth-only users)
- `oauthProviders`: OAuthProvider[] - Array of linked OAuth accounts (Google, Apple)
- `createdAt`: DateTime - Account creation timestamp
- `updatedAt`: DateTime - Last profile modification timestamp
- `lastSyncedAt`: DateTime - Last successful sync timestamp for conflict detection

**TypeScript Interface:**
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  passwordHash?: string | null;
  oauthProviders: OAuthProvider[];
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

interface OAuthProvider {
  provider: 'google' | 'apple';
  providerId: string;
  linkedAt: Date;
}
```

**Relationships:**
- One-to-Many: User → Recipes (a user owns many recipes)
- One-to-Many: User → ShoppingLists (a user creates many shopping lists)
- One-to-Many: User → Menus (a user generates many menus)
- One-to-Many: User → Inventory (a user maintains ingredient inventory)
- One-to-Many: User → CustomTags (a user creates custom tags)

## Recipe

**Purpose:** Core entity representing a recipe with metadata, nutritional timing, and ownership information.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `userId`: UUID (foreign key) - Recipe owner
- `title`: string - Recipe name (indexed for search)
- `description`: string (nullable) - Optional recipe overview
- `prepTime`: number - Preparation time in minutes
- `cookTime`: number - Cooking time in minutes
- `servings`: number - Default serving size
- `rating`: number (1-5, nullable) - User's personal rating
- `source`: string (nullable) - Original source (OCR scan, manual entry, website)
- `createdAt`: DateTime - Recipe creation timestamp
- `updatedAt`: DateTime - Last modification timestamp
- `version`: number - Optimistic locking version for sync conflicts

**TypeScript Interface:**
```typescript
interface Recipe {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  rating?: number | null; // 1-5
  source?: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  // Computed fields (not stored, calculated on fetch)
  totalTime: number; // prepTime + cookTime

  // Relations (populated via joins)
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  photos?: RecipePhoto[];
  tags?: Tag[];
}
```

**Relationships:**
- Many-to-One: Recipe → User (many recipes belong to one user)
- One-to-Many: Recipe → RecipeIngredients (a recipe has many ingredients)
- One-to-Many: Recipe → RecipeSteps (a recipe has many ordered steps)
- One-to-Many: Recipe → RecipePhotos (a recipe has many photos)
- Many-to-Many: Recipe ↔ Tags (via RecipeTags junction table)

## Ingredient

**Purpose:** Global catalog of ingredients used for auto-completion, aggregation, and inventory management.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `name`: string (unique, indexed) - Ingredient name (e.g., "chicken breast")
- `category`: string - Grocery aisle category (Produce, Meat, Dairy, etc.)
- `commonUnits`: string[] - Typical units for this ingredient (["cups", "g", "oz"])
- `averagePrice`: number (nullable) - Average price per unit for cost estimation
- `priceUnit`: string (nullable) - Unit for price (e.g., "per kg")
- `createdAt`: DateTime - When ingredient was added to catalog

**TypeScript Interface:**
```typescript
interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  commonUnits: string[];
  averagePrice?: number | null;
  priceUnit?: string | null;
  createdAt: Date;
}

type IngredientCategory =
  | 'Produce'
  | 'Meat/Seafood'
  | 'Dairy'
  | 'Bakery'
  | 'Canned Goods'
  | 'Frozen'
  | 'Spices'
  | 'Pantry'
  | 'Other';
```

**Relationships:**
- One-to-Many: Ingredient → RecipeIngredients (an ingredient appears in many recipe ingredients)
- One-to-Many: Ingredient → InventoryItems (an ingredient appears in many user inventories)

## RecipeIngredient

**Purpose:** Junction entity linking recipes to ingredients with quantity/unit information.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `recipeId`: UUID (foreign key) - Associated recipe
- `ingredientId`: UUID (foreign key) - Associated ingredient from catalog
- `ingredientName`: string - Denormalized name for display (handles custom ingredients not in catalog)
- `quantity`: number - Numeric amount (e.g., 2, 0.5, 1.25)
- `unit`: string - Measurement unit (cups, tbsp, g, oz, "to taste")
- `notes`: string (nullable) - Additional context (e.g., "diced", "room temperature")
- `sortOrder`: number - Display order within recipe

**TypeScript Interface:**
```typescript
interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId?: string | null; // null if custom ingredient not in catalog
  ingredientName: string; // always present for display
  quantity: number;
  unit: string;
  notes?: string | null;
  sortOrder: number;
}
```

**Relationships:**
- Many-to-One: RecipeIngredient → Recipe
- Many-to-One: RecipeIngredient → Ingredient (nullable for custom ingredients)

## RecipeStep

**Purpose:** Individual instruction step within a recipe's preparation process.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `recipeId`: UUID (foreign key) - Associated recipe
- `stepNumber`: number - Sequential order (1, 2, 3...)
- `instruction`: string - Step description/action
- `duration`: number (nullable) - Optional time for this specific step in minutes
- `createdAt`: DateTime - When step was added

**TypeScript Interface:**
```typescript
interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number;
  instruction: string;
  duration?: number | null; // minutes
  createdAt: Date;
}
```

**Relationships:**
- Many-to-One: RecipeStep → Recipe (many steps belong to one recipe)

## RecipePhoto

**Purpose:** Photo attachments for recipes stored in S3 with metadata.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `recipeId`: UUID (foreign key) - Associated recipe
- `s3Url`: string - Full S3 URL to original image
- `thumbnailUrl`: string - S3 URL to 400x400 thumbnail
- `isPrimary`: boolean - Whether this is the main recipe photo
- `fileSize`: number - Size in bytes
- `width`: number - Image width in pixels
- `height`: number - Image height in pixels
- `uploadedAt`: DateTime - Upload timestamp

**TypeScript Interface:**
```typescript
interface RecipePhoto {
  id: string;
  recipeId: string;
  s3Url: string;
  thumbnailUrl: string;
  isPrimary: boolean;
  fileSize: number;
  width: number;
  height: number;
  uploadedAt: Date;
}
```

**Relationships:**
- Many-to-One: RecipePhoto → Recipe (many photos belong to one recipe)

## Tag

**Purpose:** Categorization system for recipes (both system-defined and user-created custom tags).

**Key Attributes:**
- `id`: UUID - Primary identifier
- `categoryId`: UUID (foreign key) - Tag category
- `name`: string - Tag display name (e.g., "Vegetarian", "Quick")
- `slug`: string - URL-safe identifier (e.g., "vegetarian", "quick")
- `isSystem`: boolean - True for predefined tags, false for user-created
- `userId`: UUID (foreign key, nullable) - Owner of custom tag (null for system tags)
- `color`: string (nullable) - Hex color for UI display
- `createdAt`: DateTime - Tag creation timestamp

**TypeScript Interface:**
```typescript
interface Tag {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isSystem: boolean;
  userId?: string | null; // null for system tags
  color?: string | null; // hex color like "#FF5733"
  createdAt: Date;

  // Populated via join
  category?: TagCategory;
}

interface TagCategory {
  id: string;
  name: string; // "Time/Effort", "Diet/Health", etc.
  slug: string;
  sortOrder: number;
}
```

**Relationships:**
- Many-to-One: Tag → TagCategory (many tags belong to one category)
- Many-to-One: Tag → User (for custom tags only)
- Many-to-Many: Tag ↔ Recipe (via RecipeTags junction table)

## ShoppingList

**Purpose:** Generated shopping lists from selected recipes with aggregated ingredients.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `userId`: UUID (foreign key) - List owner
- `name`: string - List name (e.g., "Shopping List - Jan 6")
- `recipeIds`: UUID[] - Array of recipe IDs included in this list
- `shareToken`: string (nullable) - Secure token for shareable links
- `sharedVia`: string[] (nullable) - Tracking of share methods used (email, sms, link)
- `createdAt`: DateTime - List creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**TypeScript Interface:**
```typescript
interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  recipeIds: string[];
  shareToken?: string | null;
  sharedVia?: ('email' | 'sms' | 'link')[] | null;
  createdAt: Date;
  updatedAt: Date;

  // Populated via join
  items?: ShoppingListItem[];
}

interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  checked: boolean;
  recipeNames: string[]; // Which recipes need this ingredient
  estimatedCost?: number | null;
}
```

**Relationships:**
- Many-to-One: ShoppingList → User (many lists belong to one user)
- One-to-Many: ShoppingList → ShoppingListItems (a list has many items)

## Menu

**Purpose:** Generated meal plans with recipes assigned to specific days and meal types.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `userId`: UUID (foreign key) - Menu owner
- `name`: string - Menu name (e.g., "Vegetarian Week Jan 6-12")
- `startDate`: Date - First day of menu
- `days`: number - Number of days in menu (1-14)
- `isFavorite`: boolean - Whether user favorited this menu for reuse
- `templateId`: string (nullable) - If generated from template, template identifier
- `createdAt`: DateTime - Menu creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**TypeScript Interface:**
```typescript
interface Menu {
  id: string;
  userId: string;
  name: string;
  startDate: Date;
  days: number;
  isFavorite: boolean;
  templateId?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Populated via join
  meals?: MenuMeal[];
}

interface MenuMeal {
  id: string;
  menuId: string;
  dayNumber: number; // 1-14
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId: string;

  // Populated via join
  recipe?: Recipe;
}
```

**Relationships:**
- Many-to-One: Menu → User (many menus belong to one user)
- One-to-Many: Menu → MenuMeals (a menu has many meals)
- Many-to-One (indirect): MenuMeal → Recipe (each meal references a recipe)

## Inventory

**Purpose:** User's current ingredient inventory for recipe matching.

**Key Attributes:**
- `id`: UUID - Primary identifier
- `userId`: UUID (foreign key) - Inventory owner
- `ingredientId`: UUID (foreign key) - Ingredient in inventory
- `quantity`: number - Current quantity available
- `unit`: string - Unit of measurement
- `expiresAt`: DateTime (nullable) - Optional expiration date (V2 feature)
- `addedAt`: DateTime - When ingredient was added to inventory
- `updatedAt`: DateTime - Last quantity update

**TypeScript Interface:**
```typescript
interface InventoryItem {
  id: string;
  userId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  expiresAt?: Date | null;
  addedAt: Date;
  updatedAt: Date;

  // Populated via join
  ingredient?: Ingredient;
}
```

**Relationships:**
- Many-to-One: InventoryItem → User (many inventory items belong to one user)
- Many-to-One: InventoryItem → Ingredient (each inventory item references an ingredient)

**Data Model Design Decisions:**

1. **UUIDs over Auto-increment IDs**: Enables offline creation without ID conflicts during sync
2. **Denormalized ingredientName in RecipeIngredient**: Handles custom ingredients not in global catalog without breaking foreign keys
3. **Version field on Recipe**: Enables optimistic locking for conflict detection during sync
4. **Arrays in PostgreSQL** (recipeIds, sharedVia): Leverages PostgreSQL's native array support for simple one-to-many without junction tables
5. **Separate Photo entity**: Allows multiple photos per recipe with granular metadata (primary photo, thumbnails)

---
