/**
 * Tag Category Slugs
 * These are the predefined category identifiers used throughout the application
 */
export type TagCategorySlug =
  | 'time-effort'
  | 'diet-health'
  | 'dish-type'
  | 'occasion'
  | 'world-cuisine'
  | 'budget';

/**
 * Tag Category interface
 * Represents a category grouping for tags (e.g., Diet/Health, Time/Effort)
 */
export interface TagCategory {
  id: string;
  name: string;
  slug: TagCategorySlug;
  sortOrder: number;
  createdAt: Date;

  // Optional nested relations
  tags?: Tag[];
}

/**
 * Tag interface
 * Represents a tag that can be assigned to recipes
 * Tags can be system-defined (isSystem=true) or user-created (isSystem=false)
 */
export interface Tag {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isSystem: boolean;
  userId: string | null;
  color: string | null;
  createdAt: Date;

  // Optional nested relations
  category?: TagCategory;
  recipes?: RecipeTag[];
}

/**
 * Recipe Tag interface
 * Junction table linking recipes to tags (many-to-many relationship)
 */
export interface RecipeTag {
  id: string;
  recipeId: string;
  tagId: string;
  createdAt: Date;

  // Optional nested relations
  tag?: Tag;
}

/**
 * DTO for assigning tags to a recipe
 */
export interface AssignTagsDto {
  tagIds: string[];
}

/**
 * Response type for tag assignment
 */
export interface RecipeTagResponse extends RecipeTag {
  tag: Tag & {
    category: TagCategory;
  };
}
