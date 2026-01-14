import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IngredientCatalogDto {
  @ApiProperty({ description: 'Ingredient catalog ID' })
  id!: string;

  @ApiProperty({ description: 'Ingredient name' })
  name!: string;

  @ApiProperty({ description: 'Ingredient category' })
  category!: string;

  @ApiProperty({
    description: 'Common units for this ingredient',
    type: [String],
  })
  commonUnits!: string[];
}

export class RecipeIngredientDto {
  @ApiProperty({ description: 'Recipe ingredient ID' })
  id!: string;

  @ApiProperty({ description: 'Ingredient name (custom or from catalog)' })
  ingredientName!: string;

  @ApiProperty({ description: 'Quantity amount' })
  quantity!: number;

  @ApiProperty({ description: 'Unit of measurement' })
  unit!: string;

  @ApiPropertyOptional({ description: 'Optional notes for this ingredient' })
  notes?: string | null;

  @ApiProperty({ description: 'Display order in recipe' })
  sortOrder!: number;

  @ApiPropertyOptional({
    description: 'Ingredient catalog reference (if linked)',
    type: () => IngredientCatalogDto,
  })
  ingredient?: IngredientCatalogDto | null;
}

export class RecipeStepDto {
  @ApiProperty({ description: 'Step ID' })
  id!: string;

  @ApiProperty({ description: 'Step number (order)' })
  stepNumber!: number;

  @ApiProperty({ description: 'Step instruction text' })
  instruction!: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  duration?: number | null;
}

export class TagCategoryDto {
  @ApiProperty({ description: 'Tag category ID' })
  id!: string;

  @ApiProperty({ description: 'Category name' })
  name!: string;

  @ApiProperty({ description: 'Category slug' })
  slug!: string;
}

export class TagDto {
  @ApiProperty({ description: 'Tag ID' })
  id!: string;

  @ApiProperty({ description: 'Tag name' })
  name!: string;

  @ApiProperty({ description: 'Tag slug' })
  slug!: string;

  @ApiPropertyOptional({ description: 'Tag color (hex code)' })
  color?: string | null;

  @ApiProperty({ description: 'Tag category', type: () => TagCategoryDto })
  category!: TagCategoryDto;
}

export class RecipePhotoDto {
  @ApiProperty({ description: 'Photo ID' })
  id!: string;

  @ApiProperty({ description: 'S3 full image URL' })
  s3Url!: string;

  @ApiProperty({ description: 'S3 thumbnail URL' })
  thumbnailUrl!: string;

  @ApiProperty({ description: 'Whether this is the primary photo' })
  isPrimary!: boolean;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize!: number;

  @ApiProperty({ description: 'Image width in pixels' })
  width!: number;

  @ApiProperty({ description: 'Image height in pixels' })
  height!: number;

  @ApiProperty({ description: 'Upload timestamp' })
  uploadedAt!: Date;
}

export class RecipeDetailResponseDto {
  @ApiProperty({ description: 'Recipe ID' })
  id!: string;

  @ApiProperty({ description: 'User ID who owns this recipe' })
  userId!: string;

  @ApiProperty({ description: 'Recipe title' })
  title!: string;

  @ApiPropertyOptional({ description: 'Recipe description' })
  description?: string | null;

  @ApiProperty({ description: 'Preparation time in minutes' })
  prepTime!: number;

  @ApiProperty({ description: 'Cooking time in minutes' })
  cookTime!: number;

  @ApiProperty({ description: 'Number of servings' })
  servings!: number;

  @ApiPropertyOptional({ description: 'Recipe rating (1-5)' })
  rating?: number | null;

  @ApiPropertyOptional({ description: 'Recipe source (URL or text)' })
  source?: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Recipe version for optimistic locking' })
  version!: number;

  // Computed fields
  @ApiProperty({
    description: 'Total time (prepTime + cookTime) in minutes',
  })
  totalTime!: number;

  @ApiProperty({ description: 'Count of ingredients' })
  ingredientCount!: number;

  @ApiProperty({ description: 'Count of steps' })
  stepCount!: number;

  // Nested relations
  @ApiProperty({
    description: 'Recipe ingredients with catalog references',
    type: [RecipeIngredientDto],
  })
  ingredients!: RecipeIngredientDto[];

  @ApiProperty({
    description: 'Recipe steps in order',
    type: [RecipeStepDto],
  })
  steps!: RecipeStepDto[];

  @ApiProperty({
    description: 'Recipe tags with categories',
    type: [TagDto],
  })
  tags!: TagDto[];

  @ApiProperty({
    description: 'Recipe photos (primary first)',
    type: [RecipePhotoDto],
  })
  photos!: RecipePhotoDto[];
}
