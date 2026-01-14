import { ApiProperty } from '@nestjs/swagger';

class RecipePhotoDto {
  @ApiProperty({ description: 'Photo UUID' })
  id!: string;

  @ApiProperty({ description: 'Thumbnail URL' })
  thumbnailUrl!: string;
}

export class RecipeListItemDto {
  @ApiProperty({ description: 'Recipe UUID' })
  id!: string;

  @ApiProperty({ description: 'Recipe title' })
  title!: string;

  @ApiProperty({ description: 'Recipe description', nullable: true })
  description!: string | null;

  @ApiProperty({ description: 'Preparation time in minutes' })
  prepTime!: number;

  @ApiProperty({ description: 'Cooking time in minutes' })
  cookTime!: number;

  @ApiProperty({ description: 'Number of servings' })
  servings!: number;

  @ApiProperty({ description: 'Recipe rating (1-5)', nullable: true })
  rating!: number | null;

  @ApiProperty({ description: 'Total time in minutes (prepTime + cookTime)' })
  totalTime!: number;

  @ApiProperty({
    description: 'Primary photo',
    type: RecipePhotoDto,
    nullable: true,
  })
  primaryPhoto!: RecipePhotoDto | null;

  @ApiProperty({
    description: 'Array of tag UUIDs',
    type: [String],
  })
  tagIds!: string[];
}
