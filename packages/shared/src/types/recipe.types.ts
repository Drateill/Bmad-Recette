/**
 * Recipe-related types shared across the application
 * Based on Prisma schema models in apps/api/prisma/schema.prisma
 */

/**
 * Ingredient categories as defined in the database schema
 * Source: architecture/data-models.md#ingredient
 */
export type IngredientCategory =
  | 'Produce'
  | 'Meat/Seafood'
  | 'Dairy'
  | 'Bakery'
  | 'Canned Goods'
  | 'Frozen'
  | 'Spices'
  | 'Pantry'
  | 'Other';

/**
 * Recipe base interface matching Prisma Recipe model
 */
export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  rating: number | null; // 1-5 scale
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number; // for optimistic locking during sync
}

/**
 * Recipe with computed fields
 */
export interface RecipeWithComputed extends Recipe {
  totalTime: number; // prepTime + cookTime
}

/**
 * Ingredient base interface matching Prisma Ingredient model
 */
export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  commonUnits: string[]; // e.g., ['cup', 'g', 'oz']
  averagePrice: number | null;
  priceUnit: string | null; // e.g., 'lbs', 'oz', 'each'
  createdAt: Date;
}

/**
 * RecipeIngredient junction model
 * Links recipes to ingredients with quantity and ordering
 */
export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string | null; // null for custom ingredients
  ingredientName: string; // denormalized for display
  quantity: number;
  unit: string;
  notes: string | null;
  sortOrder: number; // for user-defined ordering
}

/**
 * Recipe step/instruction
 */
export interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number; // 1, 2, 3, etc.
  instruction: string;
  duration: number | null; // optional time for this step in minutes
  createdAt: Date;
}

/**
 * Recipe photo metadata
 */
export interface RecipePhoto {
  id: string;
  recipeId: string;
  s3Url: string; // full S3 URL to original image
  thumbnailUrl: string; // S3 URL to thumbnail (400x400)
  isPrimary: boolean; // only one photo per recipe should be primary
  fileSize: number; // in bytes
  width: number; // in pixels
  height: number; // in pixels
  uploadedAt: Date;
}

/**
 * Complete recipe with all relations
 * Used for recipe detail views
 */
export interface RecipeDetail extends RecipeWithComputed {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  photos: RecipePhoto[];
}

/**
 * Recipe creation payload (frontend → backend)
 */
export interface CreateRecipeDto {
  title: string;
  description?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  rating?: number;
  source?: string;
  ingredients: Array<{
    ingredientId?: string; // optional for custom ingredients
    ingredientName: string;
    quantity: number;
    unit: string;
    notes?: string;
    sortOrder: number;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
    duration?: number;
  }>;
}

/**
 * Recipe update payload (frontend → backend)
 */
export interface UpdateRecipeDto {
  title?: string;
  description?: string | null;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  rating?: number | null;
  source?: string | null;
  version: number; // for optimistic locking
  ingredients?: Array<{
    id?: string; // existing ingredient to update
    ingredientId?: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    notes?: string;
    sortOrder: number;
  }>;
  steps?: Array<{
    id?: string; // existing step to update
    stepNumber: number;
    instruction: string;
    duration?: number;
  }>;
}

/**
 * Recipe list item (for list views)
 * Lightweight version without full relations
 */
export interface RecipeListItem {
  id: string;
  title: string;
  description: string | null;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  rating: number | null;
  primaryPhoto: {
    id: string;
    thumbnailUrl: string;
  } | null;
  tagIds: string[];
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Recipe list response with pagination
 */
export interface RecipeListResponse {
  data: RecipeListItem[];
  pagination: PaginationMeta;
}

/**
 * Recipe filter options (for search/filtering)
 */
export interface RecipeFilterOptions {
  searchQuery?: string;
  maxPrepTime?: number;
  maxCookTime?: number;
  maxTotalTime?: number;
  minRating?: number;
  servings?: number;
  ingredientIds?: string[];
  tags?: string[]; // for future tag system (Story 2.2)
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'rating' | 'totalTime';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Ingredient autocomplete result
 */
export interface IngredientSuggestion {
  id: string;
  name: string;
  category: IngredientCategory;
  commonUnits: string[];
}
