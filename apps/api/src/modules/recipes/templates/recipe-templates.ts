/**
 * Recipe Template System
 *
 * Templates are static, system-defined recipe starting points.
 * They provide pre-filled data (ingredients, steps, tags) for common recipe types.
 */

export interface RecipeTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultFields: {
    servings: number;
    prepTime?: number;
    cookTime?: number;
  };
  defaultTagSlugs: string[];
  placeholderIngredients: Array<{
    ingredientName: string;
    quantity: number;
    unit: string;
  }>;
  placeholderSteps: Array<{
    stepNumber: number;
    instruction: string;
  }>;
}

/**
 * Predefined recipe templates for MVP
 * AC 2: Templates include Dessert, Main Course, Appetizer, Beverage, Salad, Soup, Breakfast, Snack
 */
export const RECIPE_TEMPLATES: RecipeTemplate[] = [
  {
    id: 'dessert',
    name: 'Dessert',
    icon: 'cake',
    description: 'Perfect for cakes, cookies, and sweet treats',
    defaultFields: {
      servings: 8,
      prepTime: 30,
      cookTime: 45,
    },
    defaultTagSlugs: ['dessert', 'sweet'],
    placeholderIngredients: [
      { ingredientName: 'All-purpose flour', quantity: 2, unit: 'cups' },
      { ingredientName: 'Sugar', quantity: 1, unit: 'cup' },
      { ingredientName: 'Eggs', quantity: 3, unit: 'whole' },
      { ingredientName: 'Vanilla extract', quantity: 1, unit: 'tsp' },
      { ingredientName: 'Butter', quantity: 0.5, unit: 'cup' },
    ],
    placeholderSteps: [
      { stepNumber: 1, instruction: 'Preheat oven to 350°F (175°C)' },
      {
        stepNumber: 2,
        instruction: 'Mix dry ingredients in a large bowl',
      },
      {
        stepNumber: 3,
        instruction: 'Beat eggs and add to dry mixture',
      },
      {
        stepNumber: 4,
        instruction: 'Bake for 35-45 minutes until golden',
      },
      { stepNumber: 5, instruction: 'Cool completely before serving' },
    ],
  },
  {
    id: 'main-course',
    name: 'Main Course',
    icon: 'restaurant',
    description: 'Hearty meals for lunch or dinner',
    defaultFields: {
      servings: 4,
      prepTime: 20,
      cookTime: 30,
    },
    defaultTagSlugs: ['dinner', 'main-course'],
    placeholderIngredients: [
      { ingredientName: 'Main protein', quantity: 1, unit: 'lb' },
      { ingredientName: 'Vegetables', quantity: 2, unit: 'cups' },
      { ingredientName: 'Olive oil', quantity: 2, unit: 'tbsp' },
      { ingredientName: 'Salt and pepper', quantity: 1, unit: 'to taste' },
      { ingredientName: 'Garlic', quantity: 3, unit: 'cloves' },
    ],
    placeholderSteps: [
      { stepNumber: 1, instruction: 'Prepare and season ingredients' },
      {
        stepNumber: 2,
        instruction: 'Heat oil in a large pan over medium-high heat',
      },
      {
        stepNumber: 3,
        instruction: 'Cook protein until browned and cooked through',
      },
      { stepNumber: 4, instruction: 'Add vegetables and sauté until tender' },
      { stepNumber: 5, instruction: 'Season to taste and serve hot' },
    ],
  },
  {
    id: 'appetizer',
    name: 'Appetizer',
    icon: 'tapas',
    description: 'Small bites and starters',
    defaultFields: {
      servings: 6,
      prepTime: 15,
      cookTime: 10,
    },
    defaultTagSlugs: ['appetizer', 'snack'],
    placeholderIngredients: [
      { ingredientName: 'Base ingredient', quantity: 1, unit: 'lb' },
      { ingredientName: 'Toppings', quantity: 0.5, unit: 'cup' },
      { ingredientName: 'Sauce or dressing', quantity: 0.25, unit: 'cup' },
      { ingredientName: 'Fresh herbs', quantity: 2, unit: 'tbsp' },
    ],
    placeholderSteps: [
      { stepNumber: 1, instruction: 'Prepare base ingredient' },
      { stepNumber: 2, instruction: 'Arrange on serving platter' },
      { stepNumber: 3, instruction: 'Add toppings evenly' },
      { stepNumber: 4, instruction: 'Drizzle with sauce and garnish' },
    ],
  },
  {
    id: 'soup',
    name: 'Soup',
    icon: 'soup',
    description: 'Warm and comforting soups',
    defaultFields: {
      servings: 4,
      prepTime: 15,
      cookTime: 40,
    },
    defaultTagSlugs: ['soup', 'comfort-food'],
    placeholderIngredients: [
      { ingredientName: 'Broth or stock', quantity: 4, unit: 'cups' },
      { ingredientName: 'Vegetables', quantity: 3, unit: 'cups' },
      { ingredientName: 'Protein (optional)', quantity: 1, unit: 'cup' },
      { ingredientName: 'Herbs and spices', quantity: 1, unit: 'to taste' },
      { ingredientName: 'Onion', quantity: 1, unit: 'whole' },
    ],
    placeholderSteps: [
      { stepNumber: 1, instruction: 'Sauté aromatics in a large pot' },
      { stepNumber: 2, instruction: 'Add broth and bring to a boil' },
      {
        stepNumber: 3,
        instruction: 'Add vegetables and protein, reduce to simmer',
      },
      { stepNumber: 4, instruction: 'Cook until vegetables are tender' },
      { stepNumber: 5, instruction: 'Season to taste and serve hot' },
    ],
  },
  {
    id: 'salad',
    name: 'Salad',
    icon: 'salad',
    description: 'Fresh and healthy salads',
    defaultFields: {
      servings: 4,
      prepTime: 15,
      cookTime: 0,
    },
    defaultTagSlugs: ['salad', 'healthy'],
    placeholderIngredients: [
      { ingredientName: 'Mixed greens', quantity: 6, unit: 'cups' },
      { ingredientName: 'Fresh vegetables', quantity: 2, unit: 'cups' },
      { ingredientName: 'Protein (optional)', quantity: 1, unit: 'cup' },
      { ingredientName: 'Dressing', quantity: 0.5, unit: 'cup' },
      { ingredientName: 'Toppings', quantity: 0.25, unit: 'cup' },
    ],
    placeholderSteps: [
      { stepNumber: 1, instruction: 'Wash and dry greens thoroughly' },
      { stepNumber: 2, instruction: 'Chop vegetables and protein' },
      { stepNumber: 3, instruction: 'Combine all ingredients in a large bowl' },
      { stepNumber: 4, instruction: 'Toss with dressing just before serving' },
    ],
  },
  {
    id: 'breakfast',
    name: 'Breakfast',
    icon: 'egg',
    description: 'Morning meals to start your day',
    defaultFields: {
      servings: 2,
      prepTime: 10,
      cookTime: 15,
    },
    defaultTagSlugs: ['breakfast', 'quick'],
    placeholderIngredients: [
      { ingredientName: 'Eggs', quantity: 4, unit: 'whole' },
      { ingredientName: 'Bread or toast', quantity: 4, unit: 'slices' },
      { ingredientName: 'Butter', quantity: 2, unit: 'tbsp' },
      { ingredientName: 'Fresh fruit', quantity: 1, unit: 'cup' },
    ],
    placeholderSteps: [
      { stepNumber: 1, instruction: 'Heat pan over medium heat' },
      { stepNumber: 2, instruction: 'Cook eggs to your preference' },
      { stepNumber: 3, instruction: 'Toast bread until golden' },
      { stepNumber: 4, instruction: 'Arrange on plate with fresh fruit' },
    ],
  },
  {
    id: 'beverage',
    name: 'Beverage',
    icon: 'drink',
    description: 'Refreshing drinks and smoothies',
    defaultFields: {
      servings: 4,
      prepTime: 5,
      cookTime: 0,
    },
    defaultTagSlugs: ['beverage', 'refreshing'],
    placeholderIngredients: [
      { ingredientName: 'Base liquid', quantity: 4, unit: 'cups' },
      { ingredientName: 'Sweetener (optional)', quantity: 2, unit: 'tbsp' },
      { ingredientName: 'Flavorings', quantity: 1, unit: 'to taste' },
      { ingredientName: 'Ice', quantity: 2, unit: 'cups' },
    ],
    placeholderSteps: [
      { stepNumber: 1, instruction: 'Combine all ingredients in a blender' },
      { stepNumber: 2, instruction: 'Blend until smooth' },
      { stepNumber: 3, instruction: 'Pour into glasses and serve immediately' },
    ],
  },
  {
    id: 'snack',
    name: 'Snack',
    icon: 'snack',
    description: 'Quick and easy snacks',
    defaultFields: {
      servings: 4,
      prepTime: 10,
      cookTime: 5,
    },
    defaultTagSlugs: ['snack', 'quick'],
    placeholderIngredients: [
      { ingredientName: 'Main ingredient', quantity: 2, unit: 'cups' },
      { ingredientName: 'Seasonings', quantity: 1, unit: 'tbsp' },
      { ingredientName: 'Oil or butter', quantity: 1, unit: 'tbsp' },
    ],
    placeholderSteps: [
      { stepNumber: 1, instruction: 'Prepare main ingredient' },
      { stepNumber: 2, instruction: 'Season to taste' },
      { stepNumber: 3, instruction: 'Serve immediately or store for later' },
    ],
  },
];

/**
 * Get a template by its ID
 * @param id - Template ID
 * @returns RecipeTemplate or null if not found
 */
export function getTemplateById(id: string): RecipeTemplate | null {
  return RECIPE_TEMPLATES.find((t) => t.id === id) || null;
}

/**
 * Get all available templates
 * @returns Array of all recipe templates
 */
export function getAllTemplates(): RecipeTemplate[] {
  return RECIPE_TEMPLATES;
}

/**
 * Validate that all template IDs are unique
 * @returns true if all IDs are unique
 */
export function validateTemplateIds(): boolean {
  const ids = RECIPE_TEMPLATES.map((t) => t.id);
  return ids.length === new Set(ids).size;
}
