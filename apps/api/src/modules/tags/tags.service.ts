import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TagsRepository } from './tags.repository';

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepository: TagsRepository) {}

  /**
   * Get all tag categories with their tags
   */
  async getAllCategoriesWithTags() {
    return this.tagsRepository.getAllCategoriesWithTags();
  }

  /**
   * Get tags with optional filters
   * @param categoryId - Optional category ID filter
   * @param isSystem - Optional system tag filter
   * @param userId - Optional user ID filter
   */
  async getTags(params: {
    categoryId?: string;
    isSystem?: boolean;
    userId?: string;
  }) {
    return this.tagsRepository.getTags(params);
  }

  /**
   * Assign tags to a recipe
   * @param recipeId - Recipe ID
   * @param userId - User ID (for authorization)
   * @param tagIds - Array of tag IDs
   * @throws NotFoundException if recipe not found
   * @throws ForbiddenException if user doesn't own the recipe
   * @throws BadRequestException if any tag ID is invalid
   */
  async assignTagsToRecipe(
    recipeId: string,
    userId: string,
    tagIds: string[],
  ) {
    // Verify recipe exists and belongs to user
    const recipeExists =
      await this.tagsRepository.recipeExistsAndBelongsToUser(recipeId, userId);

    if (!recipeExists) {
      // Check if recipe exists for any user to distinguish 404 from 403
      const recipe = await this.tagsRepository.findRecipeById(recipeId);

      if (recipe) {
        throw new ForbiddenException(
          'You do not have permission to modify this recipe',
        );
      }

      throw new NotFoundException(`Recipe with ID ${recipeId} not found`);
    }

    // Verify all tags exist
    const allTagsExist = await this.tagsRepository.verifyTagsExist(tagIds);

    if (!allTagsExist) {
      throw new BadRequestException('One or more tag IDs are invalid');
    }

    // Assign tags
    return this.tagsRepository.assignTagsToRecipe(recipeId, tagIds);
  }

  /**
   * Get tags assigned to a recipe
   * @param recipeId - Recipe ID
   */
  async getRecipeTags(recipeId: string) {
    return this.tagsRepository.getRecipeTags(recipeId);
  }
}
