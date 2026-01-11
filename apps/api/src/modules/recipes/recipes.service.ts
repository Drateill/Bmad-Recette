import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { RecipesRepository } from './recipes.repository';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private readonly recipesRepository: RecipesRepository,
    private readonly prisma: PrismaService,
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
}
