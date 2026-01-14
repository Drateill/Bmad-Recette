import { ApiProperty } from '@nestjs/swagger';

export class RecipeTemplateIngredientDto {
  @ApiProperty({ example: 'All-purpose flour' })
  ingredientName!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 'cups' })
  unit!: string;
}

export class RecipeTemplateStepDto {
  @ApiProperty({ example: 1 })
  stepNumber!: number;

  @ApiProperty({ example: 'Preheat oven to 350°F (175°C)' })
  instruction!: string;
}

export class RecipeTemplateDto {
  @ApiProperty({ example: 'dessert' })
  id!: string;

  @ApiProperty({ example: 'Dessert' })
  name!: string;

  @ApiProperty({ example: 'cake' })
  icon!: string;

  @ApiProperty({ example: 'Perfect for cakes, cookies, and sweet treats' })
  description!: string;

  @ApiProperty({
    example: { servings: 8, prepTime: 30, cookTime: 45 },
  })
  defaultFields!: {
    servings: number;
    prepTime?: number;
    cookTime?: number;
  };

  @ApiProperty({
    type: [String],
    example: ['tag-id-1', 'tag-id-2'],
    description: 'Resolved tag IDs from default tag slugs',
  })
  defaultTagIds!: string[];

  @ApiProperty({
    type: [RecipeTemplateIngredientDto],
  })
  placeholderIngredients!: RecipeTemplateIngredientDto[];

  @ApiProperty({
    type: [RecipeTemplateStepDto],
  })
  placeholderSteps!: RecipeTemplateStepDto[];
}
