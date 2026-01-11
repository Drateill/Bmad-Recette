import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';

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
        ingredients: { orderBy: { sortOrder: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
        tags: { include: { tag: true } },
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
}
