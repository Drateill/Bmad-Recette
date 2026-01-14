import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { RecipesRepository } from './recipes.repository';
import { PortionAdjustmentService } from './portion-adjustment.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeFilterDto } from './dto/recipe-filter.dto';
import { RecipeListResponseDto } from './dto/recipe-list-response.dto';
import { RecipeListItemDto } from './dto/recipe-list-item.dto';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private readonly recipesRepository: RecipesRepository,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly portionAdjustmentService: PortionAdjustmentService,
  ) {}

  async create(userId: string, createRecipeDto: CreateRecipeDto) {
    try {
      // Validate tagIds exist in database
      if (createRecipeDto.tagIds.length > 0) {
        const tags = await this.prisma.tag.findMany({
          where: { id: { in: createRecipeDto.tagIds } },
        });

        if (tags.length !== createRecipeDto.tagIds.length) {
          throw new BadRequestException('One or more tag IDs are invalid');
        }
      }

      // Process ingredients: lookup catalog ingredients by name if only ingredientName provided
      const processedDto = { ...createRecipeDto };

      for (let i = 0; i < processedDto.ingredients.length; i++) {
        const ingredient = processedDto.ingredients[i];

        // If ingredientId provided, validate it exists
        if (ingredient.ingredientId) {
          const catalogIngredient = await this.prisma.ingredient.findUnique({
            where: { id: ingredient.ingredientId },
          });

          if (!catalogIngredient) {
            throw new BadRequestException(
              `Ingredient with ID ${ingredient.ingredientId} not found`,
            );
          }
        } else {
          // If only ingredientName provided, search catalog (case-insensitive)
          const catalogIngredient = await this.prisma.ingredient.findFirst({
            where: {
              name: {
                equals: ingredient.ingredientName,
                mode: 'insensitive',
              },
            },
          });

          // If found in catalog, use its ID
          if (catalogIngredient) {
            processedDto.ingredients[i].ingredientId = catalogIngredient.id;
            processedDto.ingredients[i].ingredientName = catalogIngredient.name;
          }
          // Otherwise, allow custom ingredient (ingredientId remains undefined/null)
        }
      }

      // Create recipe with transaction
      const recipe = await this.recipesRepository.createRecipe(
        userId,
        processedDto,
      );

      if (!recipe) {
        throw new Error('Failed to create recipe');
      }

      this.logger.log(`Recipe created successfully: ${recipe.id}`);

      return recipe;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle Prisma-specific errors
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid foreign key reference');
        }
        if (error.code === 'P2025') {
          throw new BadRequestException('Referenced record not found');
        }
      }

      // Re-throw BadRequestException and other known errors
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error('Failed to create recipe', error);
      throw error;
    }
  }

  async findById(recipeId: string, userId: string) {
    try {
      // Fetch recipe with all relations
      const recipe = await this.recipesRepository.findById(recipeId);

      // Handle recipe not found or unauthorized access
      // Security: Return 404 for both cases to prevent information disclosure
      if (!recipe || recipe.userId !== userId) {
        throw new NotFoundException('Recipe not found');
      }

      // Add computed fields
      const totalTime = recipe.prepTime + recipe.cookTime;
      const ingredientCount = recipe.ingredients?.length || 0;
      const stepCount = recipe.steps?.length || 0;

      // Log access event
      this.logger.log(
        `Recipe accessed: recipeId=${recipeId}, userId=${userId}, timestamp=${new Date().toISOString()}`,
      );

      // Transform tags from RecipeTag[] to TagDto[]
      const transformedTags = recipe.tags.map((recipeTag) => ({
        id: recipeTag.tag.id,
        name: recipeTag.tag.name,
        slug: recipeTag.tag.slug,
        color: recipeTag.tag.color,
        category: {
          id: recipeTag.tag.category.id,
          name: recipeTag.tag.category.name,
          slug: recipeTag.tag.category.slug,
        },
      }));

      // Return recipe with computed fields and transformed tags
      return {
        id: recipe.id,
        userId: recipe.userId,
        title: recipe.title,
        description: recipe.description,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        rating: recipe.rating,
        source: recipe.source,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
        version: recipe.version,
        totalTime,
        ingredientCount,
        stepCount,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        tags: transformedTags,
        photos: recipe.photos,
      };
    } catch (error) {
      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2023') {
          // Invalid UUID format
          throw new BadRequestException('Invalid recipe ID format');
        }
        if (error.code === 'P1001') {
          // Database connection error
          this.logger.error('Database connection error', error);
          throw new Error('Database connection error');
        }
      }

      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Log and re-throw unexpected errors
      this.logger.error(
        `Failed to retrieve recipe: recipeId=${recipeId}, userId=${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Adjust recipe portions by multiplier
   * Real-time calculation only - not saved to database
   */
  async adjustPortions(recipeId: string, userId: string, multiplier: number) {
    try {
      // Validate multiplier
      if (isNaN(multiplier) || multiplier <= 0) {
        throw new BadRequestException(
          'Multiplier must be a positive number greater than 0',
        );
      }

      if (multiplier > 100) {
        throw new BadRequestException(
          'Multiplier must be less than or equal to 100',
        );
      }

      if (multiplier < 0.01) {
        throw new BadRequestException(
          'Multiplier must be greater than or equal to 0.01',
        );
      }

      // Warn if multiplier outside typical range (but allow it)
      if (multiplier < 0.25 || multiplier > 10) {
        this.logger.warn(
          `Unusual multiplier value: ${multiplier} for recipeId=${recipeId}, userId=${userId}`,
        );
      }

      // Fetch recipe with all relations (reuse findById)
      const recipe = await this.findById(recipeId, userId);

      // Adjust ingredients using PortionAdjustmentService
      const adjustedIngredients = this.portionAdjustmentService.adjustIngredients(
        recipe.ingredients,
        multiplier,
      );

      // Calculate adjusted servings
      const adjustedServings = Math.round(recipe.servings * multiplier);

      // Log adjustment event
      this.logger.log(
        `Portion adjustment: recipeId=${recipeId}, userId=${userId}, multiplier=${multiplier}, originalServings=${recipe.servings}, adjustedServings=${adjustedServings}, timestamp=${new Date().toISOString()}`,
      );

      // Return recipe with adjusted ingredients and servings
      // Include originalServings for reference
      return {
        ...recipe,
        servings: adjustedServings,
        originalServings: recipe.servings,
        ingredients: adjustedIngredients,
        multiplier,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Log and re-throw unexpected errors
      this.logger.error(
        `Failed to adjust portions: recipeId=${recipeId}, userId=${userId}, multiplier=${multiplier}`,
        error,
      );
      throw error;
    }
  }

  async updateRating(
    recipeId: string,
    userId: string,
    rating: number | null,
  ) {
    try {
      // Fetch existing recipe to verify existence and ownership
      const existingRecipe = await this.recipesRepository.findById(recipeId);

      if (!existingRecipe) {
        throw new NotFoundException('Recipe not found');
      }

      if (existingRecipe.userId !== userId) {
        throw new ForbiddenException('You do not own this recipe');
      }

      // Update rating in database
      const updatedRecipe = await this.prisma.recipe.update({
        where: { id: recipeId },
        data: { rating },
        include: {
          ingredients: {
            orderBy: { sortOrder: 'asc' },
          },
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
          photos: true,
          tags: {
            include: {
              tag: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(
        `Recipe rating updated: recipeId=${recipeId}, userId=${userId}, rating=${rating}, timestamp=${new Date().toISOString()}`,
      );

      // Transform and return the same format as findById
      const totalTime = updatedRecipe.prepTime + updatedRecipe.cookTime;
      const ingredientCount = updatedRecipe.ingredients?.length || 0;
      const stepCount = updatedRecipe.steps?.length || 0;

      const transformedTags = updatedRecipe.tags.map((recipeTag) => ({
        id: recipeTag.tag.id,
        name: recipeTag.tag.name,
        slug: recipeTag.tag.slug,
        color: recipeTag.tag.color,
        category: {
          id: recipeTag.tag.category.id,
          name: recipeTag.tag.category.name,
          slug: recipeTag.tag.category.slug,
        },
      }));

      return {
        id: updatedRecipe.id,
        userId: updatedRecipe.userId,
        title: updatedRecipe.title,
        description: updatedRecipe.description,
        prepTime: updatedRecipe.prepTime,
        cookTime: updatedRecipe.cookTime,
        servings: updatedRecipe.servings,
        rating: updatedRecipe.rating,
        source: updatedRecipe.source,
        createdAt: updatedRecipe.createdAt,
        updatedAt: updatedRecipe.updatedAt,
        version: updatedRecipe.version,
        totalTime,
        ingredientCount,
        stepCount,
        ingredients: updatedRecipe.ingredients,
        steps: updatedRecipe.steps,
        tags: transformedTags,
        photos: updatedRecipe.photos,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Recipe not found');
        }
      }

      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error(
        `Failed to update recipe rating: recipeId=${recipeId}, userId=${userId}`,
        error,
      );
      throw error;
    }
  }

  async update(
    recipeId: string,
    userId: string,
    updateRecipeDto: UpdateRecipeDto,
  ) {
    try {
      // Fetch existing recipe to verify existence and ownership
      const existingRecipe = await this.recipesRepository.findById(recipeId);

      if (!existingRecipe) {
        throw new NotFoundException('Recipe not found');
      }

      if (existingRecipe.userId !== userId) {
        throw new ForbiddenException('You do not own this recipe');
      }

      // Check optimistic locking if expectedVersion provided
      if (
        updateRecipeDto.expectedVersion !== undefined &&
        existingRecipe.version !== updateRecipeDto.expectedVersion
      ) {
        throw new ConflictException(
          'Recipe was modified by another user. Please refresh and try again.',
        );
      }

      // Validate tagIds if provided
      if (updateRecipeDto.tagIds && updateRecipeDto.tagIds.length > 0) {
        const tags = await this.prisma.tag.findMany({
          where: { id: { in: updateRecipeDto.tagIds } },
        });

        if (tags.length !== updateRecipeDto.tagIds.length) {
          throw new BadRequestException('One or more tag IDs are invalid');
        }
      }

      // Process ingredients if provided: lookup catalog ingredients
      if (updateRecipeDto.ingredients) {
        for (let i = 0; i < updateRecipeDto.ingredients.length; i++) {
          const ingredient = updateRecipeDto.ingredients[i];

          // If ingredientId provided, validate it exists
          if (ingredient.ingredientId) {
            const catalogIngredient = await this.prisma.ingredient.findUnique({
              where: { id: ingredient.ingredientId },
            });

            if (!catalogIngredient) {
              throw new BadRequestException(
                `Ingredient with ID ${ingredient.ingredientId} not found`,
              );
            }
          } else {
            // If only ingredientName provided, search catalog (case-insensitive)
            const catalogIngredient = await this.prisma.ingredient.findFirst({
              where: {
                name: {
                  equals: ingredient.ingredientName,
                  mode: 'insensitive',
                },
              },
            });

            // If found in catalog, use its ID
            if (catalogIngredient) {
              updateRecipeDto.ingredients[i].ingredientId =
                catalogIngredient.id;
              updateRecipeDto.ingredients[i].ingredientName =
                catalogIngredient.name;
            }
            // Otherwise, allow custom ingredient (ingredientId remains undefined)
          }
        }
      }

      // Update recipe with transaction
      const updatedRecipe = await this.recipesRepository.update(
        recipeId,
        updateRecipeDto,
      );

      if (!updatedRecipe) {
        throw new Error('Failed to update recipe');
      }

      this.logger.log(
        `Recipe updated: recipeId=${recipeId}, userId=${userId}, timestamp=${new Date().toISOString()}`,
      );

      // Transform and return the same format as findById
      const totalTime = updatedRecipe.prepTime + updatedRecipe.cookTime;
      const ingredientCount = updatedRecipe.ingredients?.length || 0;
      const stepCount = updatedRecipe.steps?.length || 0;

      const transformedTags = updatedRecipe.tags.map((recipeTag) => ({
        id: recipeTag.tag.id,
        name: recipeTag.tag.name,
        slug: recipeTag.tag.slug,
        color: recipeTag.tag.color,
        category: {
          id: recipeTag.tag.category.id,
          name: recipeTag.tag.category.name,
          slug: recipeTag.tag.category.slug,
        },
      }));

      return {
        id: updatedRecipe.id,
        userId: updatedRecipe.userId,
        title: updatedRecipe.title,
        description: updatedRecipe.description,
        prepTime: updatedRecipe.prepTime,
        cookTime: updatedRecipe.cookTime,
        servings: updatedRecipe.servings,
        rating: updatedRecipe.rating,
        source: updatedRecipe.source,
        createdAt: updatedRecipe.createdAt,
        updatedAt: updatedRecipe.updatedAt,
        version: updatedRecipe.version,
        totalTime,
        ingredientCount,
        stepCount,
        ingredients: updatedRecipe.ingredients,
        steps: updatedRecipe.steps,
        tags: transformedTags,
        photos: updatedRecipe.photos,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid foreign key reference');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Recipe not found');
        }
      }

      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error(
        `Failed to update recipe: recipeId=${recipeId}, userId=${userId}`,
        error,
      );
      throw error;
    }
  }

  async delete(recipeId: string, userId: string): Promise<void> {
    try {
      // Fetch recipe to verify existence and ownership
      const recipe = await this.recipesRepository.findById(recipeId);

      // Handle recipe not found or unauthorized access
      // Security: Return 404 for both cases to prevent information disclosure
      if (!recipe || recipe.userId !== userId) {
        throw new NotFoundException('Recipe not found');
      }

      // Fetch all photos for S3 deletion
      const photos = await this.prisma.recipePhoto.findMany({
        where: { recipeId },
        select: { s3Url: true, thumbnailUrl: true },
      });

      // Delete recipe from database (cascade deletes all relations)
      await this.recipesRepository.delete(recipeId);

      // Queue async S3 photo deletion (don't block response)
      if (photos.length > 0) {
        this.queueS3PhotoDeletion(photos);
      }

      // Log deletion event for audit trail
      this.logger.log({
        event: 'recipe_deleted',
        userId,
        recipeId,
        recipeTitle: recipe.title,
        photoCount: photos.length,
        deletedAt: new Date().toISOString(),
      });
    } catch (error) {
      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          throw new NotFoundException('Recipe not found');
        }
      }

      // Re-throw known exceptions
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log and re-throw unexpected errors
      this.logger.error(
        `Failed to delete recipe: recipeId=${recipeId}, userId=${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find all recipes with filters, sorting, and pagination
   * Applies in-memory maxTotalTime filter after database query
   */
  async findAll(
    userId: string,
    filters: RecipeFilterDto,
  ): Promise<RecipeListResponseDto> {
    try {
      // Fetch recipes from repository with filters
      let recipes = await this.recipesRepository.findAll(userId, filters);

      // Apply maxTotalTime filter in-memory (Prisma limitation with computed fields)
      if (filters.maxTotalTime !== undefined) {
        recipes = recipes.filter(
          (r: any) => r.prepTime + r.cookTime <= filters.maxTotalTime!,
        );
      }

      // Get total count (before pagination, but after filters including time filter)
      let total: number;
      if (filters.maxTotalTime !== undefined) {
        // If time filter applied, need to count filtered results
        // For MVP: Fetch all matching recipes and count (acceptable for <10k recipes)
        const allRecipes = await this.recipesRepository.findAll(userId, {
          ...filters,
          page: 1,
          limit: 10000, // Fetch all to count
        });
        total = allRecipes.filter(
          (r: any) => r.prepTime + r.cookTime <= filters.maxTotalTime!,
        ).length;
      } else {
        // No time filter: Use efficient count query
        total = await this.recipesRepository.count(userId, filters);
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / filters.limit!);

      // Transform recipes to RecipeListItemDto
      const data: RecipeListItemDto[] = recipes.map((recipe: any) => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        rating: recipe.rating,
        totalTime: recipe.prepTime + recipe.cookTime,
        primaryPhoto: recipe.photos[0]
          ? {
              id: recipe.photos[0].id,
              thumbnailUrl: recipe.photos[0].thumbnailUrl,
            }
          : null,
        tagIds: recipe.tags.map((tag: any) => tag.tagId),
      }));

      // Log list query for monitoring
      this.logger.log({
        event: 'recipe_list_query',
        userId,
        filters,
        resultCount: data.length,
        total,
        timestamp: new Date().toISOString(),
      });

      return {
        data,
        pagination: {
          page: filters.page!,
          pageSize: filters.limit!,
          total,
          totalPages,
        },
      };
    } catch (error) {
      // Handle Prisma errors
      if (error instanceof Error && 'code' in error) {
        if ((error as any).code === 'P1001') {
          this.logger.error('Database connection error', error);
          throw new Error('Database connection error');
        }
      }

      // Log and re-throw unexpected errors
      this.logger.error(
        `Failed to list recipes: userId=${userId}, filters=${JSON.stringify(filters)}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Queue async S3 photo deletion (MVP simplification: uses setImmediate)
   * Does not block the response - photos deleted in background
   */
  private queueS3PhotoDeletion(
    photos: { s3Url: string; thumbnailUrl: string }[],
  ): void {
    setImmediate(async () => {
      for (const photo of photos) {
        try {
          // Extract S3 keys and delete
          const originalKey = this.storageService.extractKeyFromUrl(
            photo.s3Url,
          );
          const thumbnailKey = this.storageService.extractKeyFromUrl(
            photo.thumbnailUrl,
          );

          await this.storageService.deleteFile(originalKey);
          await this.storageService.deleteFile(thumbnailKey);
        } catch (error) {
          // Log error but don't throw - recipe already deleted from DB
          this.logger.error({
            event: 's3_deletion_failed',
            photo,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    });
  }
}
