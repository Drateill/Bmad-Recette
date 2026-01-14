import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RecipeTemplateDto } from './dto/recipe-template.dto';
import { CreateFromTemplateDto } from './dto/create-from-template.dto';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import {
  getAllTemplates,
  getTemplateById,
} from './templates/recipe-templates';
import { TagsRepository } from '../tags/tags.repository';
import { RecipesService } from './recipes.service';

@Injectable()
export class RecipeTemplatesService {
  private readonly logger = new Logger(RecipeTemplatesService.name);
  private tagSlugCache: Map<string, string> = new Map(); // slug -> ID

  constructor(
    private readonly tagsRepository: TagsRepository,
    private readonly recipesService: RecipesService,
  ) {}

  /**
   * Get all recipe templates with resolved tag IDs
   * AC 1: GET /api/recipe-templates endpoint returns list of templates
   */
  async getTemplates(): Promise<RecipeTemplateDto[]> {
    const templates = getAllTemplates();
    const dtos: RecipeTemplateDto[] = [];

    for (const template of templates) {
      const tagIds = await this.resolveTagSlugs(template.defaultTagSlugs);

      dtos.push({
        id: template.id,
        name: template.name,
        icon: template.icon,
        description: template.description,
        defaultFields: template.defaultFields,
        defaultTagIds: tagIds,
        placeholderIngredients: template.placeholderIngredients,
        placeholderSteps: template.placeholderSteps,
      });
    }

    return dtos;
  }

  /**
   * Create a recipe from a template
   * AC 4: POST /api/recipes/from-template accepts templateId and creates recipe
   */
  async createFromTemplate(
    userId: string,
    dto: CreateFromTemplateDto,
  ): Promise<any> {
    // 1. Load template
    const template = getTemplateById(dto.templateId);
    if (!template) {
      throw new BadRequestException(
        `Invalid template ID: '${dto.templateId}'`,
      );
    }

    // 2. Resolve tag slugs to IDs
    const tagIds = await this.resolveTagSlugs(template.defaultTagSlugs);

    // 3. Build CreateRecipeDto with template defaults + user customizations
    const createDto: CreateRecipeDto = {
      title: dto.title || `New ${template.name}`,
      description: undefined,
      prepTime: template.defaultFields.prepTime || 0,
      cookTime: template.defaultFields.cookTime || 0,
      servings: dto.servings || template.defaultFields.servings,
      ingredients: template.placeholderIngredients.map((ing, index) => ({
        ingredientName: ing.ingredientName,
        quantity: ing.quantity,
        unit: ing.unit,
        sortOrder: index + 1,
      })),
      steps: template.placeholderSteps,
      tagIds,
    };

    // 4. Create recipe using existing create logic (Story 2.3)
    const recipe = await this.recipesService.create(userId, createDto);

    this.logger.log(
      `Recipe created from template '${dto.templateId}': ${recipe.id}`,
    );

    return recipe;
  }

  /**
   * Resolve tag slugs to tag IDs with caching
   * AC 6: Map template defaultTags to actual Tag IDs
   *
   * Optimized to query database once for all uncached slugs,
   * avoiding N+1 query problem in the original implementation.
   */
  private async resolveTagSlugs(slugs: string[]): Promise<string[]> {
    const ids: string[] = [];

    // Identify slugs not in cache
    const uncachedSlugs = slugs.filter((s) => !this.tagSlugCache.has(s));

    // Query database once for all uncached slugs
    if (uncachedSlugs.length > 0) {
      const tags = await this.tagsRepository.findBySlug(uncachedSlugs);

      // Populate cache with results
      for (const tag of tags) {
        this.tagSlugCache.set(tag.slug, tag.id);
      }
    }

    // Build result array from cache
    for (const slug of slugs) {
      const cachedId = this.tagSlugCache.get(slug);
      if (cachedId) {
        ids.push(cachedId);
      } else {
        this.logger.warn({
          slug,
          event: 'template_tag_not_found',
          message: `Tag with slug '${slug}' not found in database`,
        });
      }
    }

    return ids;
  }
}
