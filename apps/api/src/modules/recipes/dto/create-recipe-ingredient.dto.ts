import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRecipeIngredientDto {
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
}
