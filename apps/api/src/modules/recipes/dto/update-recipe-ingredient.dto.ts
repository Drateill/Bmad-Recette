import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  IsInt,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateRecipeIngredientDto {
  @IsNumber()
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  unit!: string;

  @IsUUID('4')
  @IsOptional()
  ingredientId?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  ingredientName!: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  sortOrder?: number;
}
