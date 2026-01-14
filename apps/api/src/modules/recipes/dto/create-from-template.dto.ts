import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateFromTemplateDto {
  @ApiProperty({
    description: 'Template ID to use for recipe creation',
    example: 'dessert',
  })
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @ApiPropertyOptional({
    description: 'Custom title for the recipe (overrides template default)',
    example: 'Chocolate Cake',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Custom servings (overrides template default)',
    example: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;
}
