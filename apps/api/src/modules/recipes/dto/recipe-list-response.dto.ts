import { ApiProperty } from '@nestjs/swagger';
import { RecipeListItemDto } from './recipe-list-item.dto';

class PaginationDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Number of items per page', example: 20 })
  pageSize!: number;

  @ApiProperty({ description: 'Total number of items', example: 45 })
  total!: number;

  @ApiProperty({ description: 'Total number of pages', example: 3 })
  totalPages!: number;
}

export class RecipeListResponseDto {
  @ApiProperty({
    description: 'Array of recipe items',
    type: [RecipeListItemDto],
  })
  data!: RecipeListItemDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationDto,
  })
  pagination!: PaginationDto;
}
