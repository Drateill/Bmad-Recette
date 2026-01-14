import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBody, ApiQuery } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { RecipeTemplatesService } from './recipe-templates.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeFilterDto } from './dto/recipe-filter.dto';
import { RecipeListResponseDto } from './dto/recipe-list-response.dto';
import { RecipeDetailResponseDto } from './dto/recipe-detail-response.dto';
import { RecipeTemplateDto } from './dto/recipe-template.dto';
import { CreateFromTemplateDto } from './dto/create-from-template.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly recipeTemplatesService: RecipeTemplatesService,
  ) {}

  @Get('recipe-templates')
  @ApiOperation({ summary: 'Get recipe templates' })
  @ApiResponse({
    status: 200,
    description: 'List of available recipe templates',
    type: [RecipeTemplateDto],
  })
  async getTemplates(): Promise<RecipeTemplateDto[]> {
    return this.recipeTemplatesService.getTemplates();
  }

  @Post('from-template')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create recipe from template' })
  @ApiBody({ type: CreateFromTemplateDto })
  @ApiResponse({
    status: 201,
    description: 'Recipe created from template',
    type: RecipeDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid template ID' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async createFromTemplate(
    @Body() dto: CreateFromTemplateDto,
    @Request() req: Express.Request & { user: { id: string; email: string } },
  ) {
    const userId = req.user.id;
    return this.recipeTemplatesService.createFromTemplate(userId, dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createRecipe(
    @Body() createRecipeDto: CreateRecipeDto,
    @Request() req: Express.Request & { user: { id: string; email: string } },
  ) {
    const userId = req.user.id;
    return this.recipesService.create(userId, createRecipeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List user recipes with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Results per page (max 100)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['title', 'createdAt', 'prepTime', 'cookTime', 'rating'], description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort direction' })
  @ApiQuery({ name: 'tagIds', required: false, type: String, example: 'uuid1,uuid2', description: 'Comma-separated tag UUIDs (OR logic)' })
  @ApiQuery({ name: 'q', required: false, type: String, example: 'chicken', description: 'Search query (title, description, ingredients)' })
  @ApiQuery({ name: 'maxTotalTime', required: false, type: Number, example: 30, description: 'Maximum total time in minutes' })
  @ApiResponse({
    status: 200,
    description: 'Recipe list returned successfully',
    type: RecipeListResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async listRecipes(
    @Query() filterDto: RecipeFilterDto,
    @Request() req: Express.Request & { user: { id: string; email: string } },
  ): Promise<RecipeListResponseDto> {
    const userId = req.user.id;
    return this.recipesService.findAll(userId, filterDto);
  }

  @Get(':id/adjust-portions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Adjust recipe portions with multiplier (real-time calculation, not saved)' })
  @ApiParam({ name: 'id', description: 'Recipe UUID', type: 'string' })
  @ApiQuery({
    name: 'multiplier',
    description: 'Portion multiplier (0.01 to 100). Values outside 0.25-10 range accepted with warning.',
    required: true,
    type: Number,
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'Recipe returned with adjusted ingredient quantities (not saved to database)',
    type: RecipeDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid multiplier (must be positive number)' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({
    status: 404,
    description: 'Recipe not found (or unauthorized to prevent enumeration)',
  })
  async adjustPortions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('multiplier') multiplier: string,
    @Request() req: Express.Request & { user: { id: string; email: string } },
  ) {
    const userId = req.user.id;
    return this.recipesService.adjustPortions(id, userId, parseFloat(multiplier));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get recipe details by ID' })
  @ApiParam({ name: 'id', description: 'Recipe UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Recipe found and authorized',
    type: RecipeDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({
    status: 404,
    description: 'Recipe not found (or unauthorized to prevent enumeration)',
  })
  async getRecipe(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: Express.Request & { user: { id: string; email: string } },
  ): Promise<RecipeDetailResponseDto> {
    const userId = req.user.id;
    return this.recipesService.findById(id, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update recipe by ID' })
  @ApiParam({ name: 'id', description: 'Recipe UUID', type: 'string' })
  @ApiBody({ type: UpdateRecipeDto })
  @ApiResponse({
    status: 200,
    description: 'Recipe updated',
    type: RecipeDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'You do not own this recipe' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 409, description: 'Concurrent modification detected' })
  async updateRecipe(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
    @Request() req: Express.Request & { user: { id: string; email: string } },
  ): Promise<RecipeDetailResponseDto> {
    const userId = req.user.id;
    return this.recipesService.update(id, userId, updateRecipeDto);
  }

  @Put(':id/rating')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update recipe rating' })
  @ApiParam({ name: 'id', description: 'Recipe UUID', type: 'string' })
  @ApiBody({ type: UpdateRatingDto })
  @ApiResponse({
    status: 200,
    description: 'Recipe rating updated',
    type: RecipeDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid rating (must be 1-5 or null)' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'You do not own this recipe' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async updateRating(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRatingDto: UpdateRatingDto,
    @Request() req: Express.Request & { user: { id: string; email: string } },
  ): Promise<RecipeDetailResponseDto> {
    const userId = req.user.id;
    return this.recipesService.updateRating(id, userId, updateRatingDto.rating);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete recipe by ID' })
  @ApiParam({ name: 'id', description: 'Recipe UUID', type: 'string' })
  @ApiResponse({ status: 204, description: 'Recipe deleted successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({
    status: 404,
    description: 'Recipe not found or unauthorized',
  })
  async deleteRecipe(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: Express.Request & { user: { id: string; email: string } },
  ): Promise<void> {
    const userId = req.user.id;
    await this.recipesService.delete(id, userId);
  }
}
