import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRatingDto {
  @ApiProperty({
    description: 'Recipe rating (1-5 stars, or null to remove rating)',
    minimum: 1,
    maximum: 5,
    nullable: true,
    example: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number | null;
}
