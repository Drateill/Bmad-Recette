import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeFilterDto } from './dto/recipe-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RecipesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRecipe(userId: string, data: CreateRecipeDto) {
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Create Recipe
      const recipe = await prisma.recipe.create({
        data: {
          userId,
          title: data.title,
          description: data.description,
          prepTime: data.prepTime,
          cookTime: data.cookTime,
          servings: data.servings,
        },
      });

      // 2. Create RecipeIngredients
      if (data.ingredients.length > 0) {
        await prisma.recipeIngredient.createMany({
          data: data.ingredients.map((ing, index) => ({
            recipeId: recipe.id,
            ingredientId: ing.ingredientId || null,
            ingredientName: ing.ingredientName,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes || null,
            sortOrder: index + 1,
          })),
        });
      }

      // 3. Create RecipeSteps with auto-assigned stepNumbers
      if (data.steps.length > 0) {
        await prisma.recipeStep.createMany({
          data: data.steps.map((step, index) => ({
            recipeId: recipe.id,
            stepNumber: step.stepNumber ?? index + 1,
            instruction: step.instruction,
            duration: step.duration || null,
          })),
        });
      }

      // 4. Create RecipeTags
      if (data.tagIds.length > 0) {
        await prisma.recipeTag.createMany({
          data: data.tagIds.map((tagId) => ({
            recipeId: recipe.id,
            tagId,
          })),
        });
      }

      // 5. Fetch complete recipe with relations
      return await prisma.recipe.findUnique({
        where: { id: recipe.id },
        include: {
          ingredients: { orderBy: { sortOrder: 'asc' } },
          steps: { orderBy: { stepNumber: 'asc' } },
          tags: { include: { tag: true } },
          photos: true,
        },
      });
    });
  }

  async findById(recipeId: string) {
    return await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                category: true,
                commonUnits: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        steps: { orderBy: { stepNumber: 'asc' } },
        tags: {
          include: {
            tag: {
              include: {
                category: true,
              },
            },
          },
        },
        photos: { orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }] },
      },
    });
  }

  async findByUser(userId: string) {
    return await this.prisma.recipe.findMany({
      where: { userId },
      include: {
        photos: {
          where: { isPrimary: true },
          take: 1,
        },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(recipeId: string, data: UpdateRecipeDto) {
    return await this.prisma.$transaction(async (prisma) => {
      // Build dynamic update object for Recipe fields (only update provided fields)
      const recipeUpdateData: any = {
        version: { increment: 1 }, // Always increment version for optimistic locking
      };

      if (data.title !== undefined) recipeUpdateData.title = data.title;
      if (data.description !== undefined)
        recipeUpdateData.description = data.description;
      if (data.prepTime !== undefined) recipeUpdateData.prepTime = data.prepTime;
      if (data.cookTime !== undefined) recipeUpdateData.cookTime = data.cookTime;
      if (data.servings !== undefined) recipeUpdateData.servings = data.servings;

      // 1. Update Recipe base fields
      await prisma.recipe.update({
        where: { id: recipeId },
        data: recipeUpdateData,
      });

      // 2. Replace ingredients if provided (delete all + create new)
      if (data.ingredients !== undefined) {
        // Delete existing ingredients
        await prisma.recipeIngredient.deleteMany({
          where: { recipeId },
        });

        // Create new ingredients if array not empty
        if (data.ingredients.length > 0) {
          await prisma.recipeIngredient.createMany({
            data: data.ingredients.map((ing, index) => ({
              recipeId,
              ingredientId: ing.ingredientId || null,
              ingredientName: ing.ingredientName,
              quantity: ing.quantity,
              unit: ing.unit,
              notes: ing.notes || null,
              sortOrder: ing.sortOrder ?? index + 1,
            })),
          });
        }
      }

      // 3. Replace steps if provided (delete all + create new)
      if (data.steps !== undefined) {
        // Delete existing steps
        await prisma.recipeStep.deleteMany({
          where: { recipeId },
        });

        // Create new steps if array not empty
        if (data.steps.length > 0) {
          await prisma.recipeStep.createMany({
            data: data.steps.map((step, index) => ({
              recipeId,
              stepNumber: step.stepNumber ?? index + 1,
              instruction: step.instruction,
              duration: step.duration || null,
            })),
          });
        }
      }

      // 4. Upsert tags if provided (differential update)
      if (data.tagIds !== undefined) {
        // Fetch existing tags
        const existingTags = await prisma.recipeTag.findMany({
          where: { recipeId },
          select: { tagId: true },
        });
        const existingTagIds = existingTags.map((t) => t.tagId);

        // Calculate diff
        const tagsToAdd = data.tagIds.filter(
          (id) => !existingTagIds.includes(id),
        );
        const tagsToRemove = existingTagIds.filter(
          (id) => !data.tagIds!.includes(id),
        );

        // Remove tags
        if (tagsToRemove.length > 0) {
          await prisma.recipeTag.deleteMany({
            where: { recipeId, tagId: { in: tagsToRemove } },
          });
        }

        // Add tags
        if (tagsToAdd.length > 0) {
          await prisma.recipeTag.createMany({
            data: tagsToAdd.map((tagId) => ({ recipeId, tagId })),
          });
        }
      }

      // 5. Fetch and return updated recipe with all relations
      return await prisma.recipe.findUnique({
        where: { id: recipeId },
        include: {
          ingredients: {
            include: {
              ingredient: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  commonUnits: true,
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          steps: { orderBy: { stepNumber: 'asc' } },
          tags: {
            include: {
              tag: {
                include: {
                  category: true,
                },
              },
            },
          },
          photos: { orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }] },
        },
      });
    });
  }

  async delete(recipeId: string): Promise<void> {
    // Hard delete recipe - Prisma cascade deletes all relations automatically
    await this.prisma.recipe.delete({
      where: { id: recipeId },
    });
  }

  /**
   * Build Prisma where clause from filter DTO
   * Handles tag filtering, search query, rating filter, but NOT time filtering (done in-memory)
   */
  private buildWhereClause(
    userId: string,
    filters: RecipeFilterDto,
  ): Prisma.RecipeWhereInput {
    const andConditions: Prisma.RecipeWhereInput[] = [];

    // Tag filtering with OR logic (recipe has ANY of the specified tags)
    if (filters.tagIds && filters.tagIds.length > 0) {
      andConditions.push({
        tags: {
          some: {
            tagId: { in: filters.tagIds },
          },
        },
      });
    }

    // Search query: title, description, or ingredient names (case-insensitive)
    if (filters.q) {
      andConditions.push({
        OR: [
          { title: { contains: filters.q, mode: 'insensitive' } },
          { description: { contains: filters.q, mode: 'insensitive' } },
          {
            ingredients: {
              some: {
                ingredientName: { contains: filters.q, mode: 'insensitive' },
              },
            },
          },
        ],
      });
    }

    // Rating filter: minimum rating (includes recipes with rating >= minRating)
    if (filters.minRating !== undefined) {
      andConditions.push({
        rating: { gte: filters.minRating },
      });
    }

    const where: Prisma.RecipeWhereInput = {
      userId,
      ...(andConditions.length > 0 && { AND: andConditions }),
    };

    return where;
  }

  /**
   * Find all recipes with filters, sorting, and pagination
   * Note: maxTotalTime filter applied in-memory (see service layer)
   */
  async findAll(userId: string, filters: RecipeFilterDto) {
    const where = this.buildWhereClause(userId, filters);

    const recipes = await this.prisma.recipe.findMany({
      where,
      include: {
        photos: {
          where: { isPrimary: true },
          select: { id: true, thumbnailUrl: true },
          take: 1,
        },
        tags: {
          select: { tagId: true },
        },
      },
      orderBy: { [filters.sortBy!]: filters.sortOrder },
      skip: (filters.page! - 1) * filters.limit!,
      take: filters.limit,
    });

    return recipes;
  }

  /**
   * Count total recipes matching filters
   * Note: Does NOT apply maxTotalTime filter (counted in service layer)
   */
  async count(userId: string, filters: RecipeFilterDto): Promise<number> {
    const where = this.buildWhereClause(userId, filters);
    return await this.prisma.recipe.count({ where });
  }
}
