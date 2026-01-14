import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';
import { UpdateRecipeIngredientDto } from './update-recipe-ingredient.dto';
import { UpdateRecipeStepDto } from './update-recipe-step.dto';

export class UpdateRecipeDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  title?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    value ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }) : value
  )
  description?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  prepTime?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  cookTime?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  servings?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateRecipeIngredientDto)
  ingredients?: UpdateRecipeIngredientDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateRecipeStepDto)
  steps?: UpdateRecipeStepDto[];

  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsInt()
  @IsOptional()
  @Min(0)
  expectedVersion?: number;
}
