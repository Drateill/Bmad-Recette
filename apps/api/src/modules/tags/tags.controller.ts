import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TagsService } from './tags.service';
import { AssignTagsDto } from './dto/assign-tags.dto';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * Get all tag categories with nested tags
   * GET /api/tag-categories
   */
  @Get('categories')
  async getAllCategoriesWithTags() {
    return this.tagsService.getAllCategoriesWithTags();
  }

  /**
   * Get tags with optional filters
   * GET /api/tags?categoryId=uuid&isSystem=true
   */
  @Get()
  async getTags(
    @Query('categoryId') categoryId?: string,
    @Query('isSystem') isSystem?: string,
  ) {
    const filters: any = {};

    if (categoryId) {
      filters.categoryId = categoryId;
    }

    if (isSystem !== undefined) {
      filters.isSystem = isSystem === 'true';
    }

    return this.tagsService.getTags(filters);
  }

  /**
   * Get system tags only
   * GET /api/tags/system
   */
  @Get('system')
  async getSystemTags() {
    return this.tagsService.getTags({ isSystem: true });
  }

  /**
   * Get user's custom tags
   * GET /api/tags/user
   * Requires authentication
   */
  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  async getUserTags(@Req() req: any) {
    const userId = req.user.userId;
    return this.tagsService.getTags({ isSystem: false, userId });
  }

  /**
   * Assign tags to a recipe
   * POST /api/recipes/:recipeId/tags
   * Requires authentication
   */
  @Post('recipes/:recipeId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  async assignTagsToRecipe(
    @Param('recipeId') recipeId: string,
    @Body() dto: AssignTagsDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.tagsService.assignTagsToRecipe(recipeId, userId, dto.tagIds);
  }

  /**
   * Get tags for a recipe
   * GET /api/recipes/:recipeId/tags
   */
  @Get('recipes/:recipeId')
  async getRecipeTags(@Param('recipeId') recipeId: string) {
    return this.tagsService.getRecipeTags(recipeId);
  }
}
