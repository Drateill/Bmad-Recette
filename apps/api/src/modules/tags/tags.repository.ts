import { Injectable } from '@nestjs/common';
import { Tag, TagCategory, RecipeTag } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all tag categories with their tags
   * @returns Array of tag categories with nested tags
   */
  async getAllCategoriesWithTags(): Promise<
    (TagCategory & { tags: Tag[] })[]
  > {
    return this.prisma.tagCategory.findMany({
      include: {
        tags: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  /**
   * Get tags filtered by category ID
   * @param categoryId - Optional category ID filter
   * @param isSystem - Optional system tag filter
   * @param userId - Optional user ID filter for custom tags
   * @returns Array of tags
   */
  async getTags(params: {
    categoryId?: string;
    isSystem?: boolean;
    userId?: string;
  }): Promise<Tag[]> {
    const where: any = {};

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.isSystem !== undefined) {
      where.isSystem = params.isSystem;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    return this.prisma.tag.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Assign tags to a recipe (replaces existing tags)
   * @param recipeId - Recipe ID
   * @param tagIds - Array of tag IDs to assign
   */
  async assignTagsToRecipe(
    recipeId: string,
    tagIds: string[],
  ): Promise<RecipeTag[]> {
    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Delete existing recipe tags
      await tx.recipeTag.deleteMany({
        where: { recipeId },
      });

      // Create new recipe tags
      const recipeTags = await Promise.all(
        tagIds.map((tagId) =>
          tx.recipeTag.create({
            data: {
              recipeId,
              tagId,
            },
            include: {
              tag: true,
            },
          }),
        ),
      );

      return recipeTags;
    });
  }

  /**
   * Get tags assigned to a recipe
   * @param recipeId - Recipe ID
   * @returns Array of recipe tags with tag details
   */
  async getRecipeTags(recipeId: string): Promise<RecipeTag[]> {
    return this.prisma.recipeTag.findMany({
      where: { recipeId },
      include: {
        tag: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  /**
   * Verify that all tag IDs exist
   * @param tagIds - Array of tag IDs to verify
   * @returns true if all exist, false otherwise
   */
  async verifyTagsExist(tagIds: string[]): Promise<boolean> {
    const count = await this.prisma.tag.count({
      where: {
        id: {
          in: tagIds,
        },
      },
    });

    return count === tagIds.length;
  }

  /**
   * Check if a recipe belongs to a user
   * @param recipeId - Recipe ID
   * @param userId - User ID
   * @returns true if the recipe belongs to the user
   */
  async recipeExistsAndBelongsToUser(
    recipeId: string,
    userId: string,
  ): Promise<boolean> {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id: recipeId,
        userId,
      },
    });

    return recipe !== null;
  }

  /**
   * Find a recipe by ID (regardless of owner)
   * @param recipeId - Recipe ID
   * @returns Recipe or null if not found
   */
  async findRecipeById(recipeId: string) {
    return this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });
  }
}
