import { IsString, IsInt, IsOptional, IsNotEmpty, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRecipeStepDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  instruction!: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  stepNumber?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  duration?: number;
}
