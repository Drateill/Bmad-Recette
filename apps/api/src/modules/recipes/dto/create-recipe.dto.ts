import {
  IsString,
  IsInt,
  IsOptional,
  IsNotEmpty,
  Min,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';
import { CreateRecipeIngredientDto } from './create-recipe-ingredient.dto';
import { CreateRecipeStepDto } from './create-recipe-step.dto';

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  title!: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    value ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }) : value
  )
  description?: string;

  @IsInt()
  @Min(0)
  prepTime!: number;

  @IsInt()
  @Min(0)
  cookTime!: number;

  @IsInt()
  @Min(1)
  servings!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients!: CreateRecipeIngredientDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeStepDto)
  steps!: CreateRecipeStepDto[];

  @IsArray()
  @IsUUID('4', { each: true })
  tagIds!: string[];
}
