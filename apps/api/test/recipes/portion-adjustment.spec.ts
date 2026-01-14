import { PortionAdjustmentService } from '../../src/modules/recipes/portion-adjustment.service';

describe('PortionAdjustmentService', () => {
  let service: PortionAdjustmentService;

  beforeEach(() => {
    service = new PortionAdjustmentService();
  });

  describe('adjustIngredients', () => {
    it('should multiply scalable ingredient quantities', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Flour',
          quantity: 2,
          unit: 'cup',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 2);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(4);
      expect(result[0].unit).toBe('cup');
      expect(result[0].displayQuantity).toBe('4 cup');
      expect(result[0].isScalable).toBe(true);
    });

    it('should not multiply non-scalable ingredients (to taste)', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Salt',
          quantity: 1,
          unit: 'to taste',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 2);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(1);
      expect(result[0].unit).toBe('to taste');
      expect(result[0].isScalable).toBe(false);
    });

    it('should not multiply non-scalable ingredients (pinch)', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Salt',
          quantity: 1,
          unit: 'pinch',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 3);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(1);
      expect(result[0].unit).toBe('pinch');
      expect(result[0].isScalable).toBe(false);
    });

    it('should not multiply non-scalable ingredients (dash)', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Pepper',
          quantity: 2,
          unit: 'dash',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 2);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(2);
      expect(result[0].isScalable).toBe(false);
    });

    it('should not multiply non-scalable ingredients (as needed)', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Water',
          quantity: 1,
          unit: 'as needed',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 2);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(1);
      expect(result[0].isScalable).toBe(false);
    });

    it('should not multiply non-scalable ingredients (garnish)', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Parsley',
          quantity: 1,
          unit: 'garnish',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 2);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(1);
      expect(result[0].isScalable).toBe(false);
    });

    it('should convert 16 tbsp to 1 cup', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Butter',
          quantity: 2,
          unit: 'tbsp',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 8);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(1);
      expect(result[0].unit).toBe('cup');
      expect(result[0].displayQuantity).toBe('1 cup');
    });

    it('should convert 3 tsp to 1 tbsp', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Vanilla',
          quantity: 1,
          unit: 'tsp',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 3);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(1);
      expect(result[0].unit).toBe('tbsp');
      expect(result[0].displayQuantity).toBe('1 tbsp');
    });

    it('should display 0.5 as "1/2"', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Sugar',
          quantity: 1,
          unit: 'cup',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 0.5);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(0.5);
      expect(result[0].displayQuantity).toBe('1/2 cup');
    });

    it('should display 0.25 as "1/4"', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Sugar',
          quantity: 1,
          unit: 'cup',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 0.25);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(0.25);
      expect(result[0].displayQuantity).toBe('1/4 cup');
    });

    it('should display 0.33 as "1/3"', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Sugar',
          quantity: 1,
          unit: 'cup',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 0.33);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(0.33);
      expect(result[0].displayQuantity).toBe('1/3 cup');
    });

    it('should display 0.66 as "2/3"', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Sugar',
          quantity: 1,
          unit: 'cup',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 0.66);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(0.66);
      expect(result[0].displayQuantity).toBe('2/3 cup');
    });

    it('should display 0.75 as "3/4"', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Sugar',
          quantity: 1,
          unit: 'cup',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 0.75);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(0.75);
      expect(result[0].displayQuantity).toBe('3/4 cup');
    });

    it('should display 1.5 as "1 1/2"', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Sugar',
          quantity: 1,
          unit: 'cup',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 1.5);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(1.5);
      expect(result[0].displayQuantity).toBe('1 1/2 cup');
    });

    it('should display 2.25 as "2 1/4"', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Flour',
          quantity: 1,
          unit: 'cup',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 2.25);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(2.25);
      expect(result[0].displayQuantity).toBe('2 1/4 cup');
    });

    it('should display uncommon decimals as decimal numbers', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Milk',
          quantity: 1,
          unit: 'cup',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 1.7);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(1.7);
      expect(result[0].displayQuantity).toBe('1.70 cup');
    });

    it('should handle multiple ingredients with different units', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Flour',
          quantity: 2,
          unit: 'cup',
          notes: null,
          sortOrder: 1,
        },
        {
          id: '2',
          ingredientName: 'Salt',
          quantity: 1,
          unit: 'pinch',
          notes: null,
          sortOrder: 2,
        },
        {
          id: '3',
          ingredientName: 'Butter',
          quantity: 2,
          unit: 'tbsp',
          notes: null,
          sortOrder: 3,
        },
      ];

      const result = service.adjustIngredients(ingredients, 2);

      expect(result).toHaveLength(3);

      // Flour: 2 cups × 2 = 4 cups
      expect(result[0].quantity).toBe(4);
      expect(result[0].unit).toBe('cup');
      expect(result[0].isScalable).toBe(true);

      // Salt: pinch (not scalable)
      expect(result[1].quantity).toBe(1);
      expect(result[1].unit).toBe('pinch');
      expect(result[1].isScalable).toBe(false);

      // Butter: 2 tbsp × 2 = 4 tbsp
      expect(result[2].quantity).toBe(4);
      expect(result[2].unit).toBe('tbsp');
      expect(result[2].isScalable).toBe(true);
    });

    it('should handle multiplier less than 1 (halving recipe)', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Flour',
          quantity: 2,
          unit: 'cup',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 0.5);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(1);
      expect(result[0].displayQuantity).toBe('1 cup');
    });

    it('should preserve ingredient metadata (id, name, notes, sortOrder)', () => {
      const ingredients = [
        {
          id: 'test-id-123',
          ingredientName: 'Special Flour',
          quantity: 1,
          unit: 'cup',
          notes: 'Use organic',
          sortOrder: 5,
        },
      ];

      const result = service.adjustIngredients(ingredients, 2);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-id-123');
      expect(result[0].ingredientName).toBe('Special Flour');
      expect(result[0].notes).toBe('Use organic');
      expect(result[0].sortOrder).toBe(5);
    });

    it('should handle 0.125 as "1/8"', () => {
      const ingredients = [
        {
          id: '1',
          ingredientName: 'Spice',
          quantity: 1,
          unit: 'tsp',
          notes: null,
          sortOrder: 1,
        },
      ];

      const result = service.adjustIngredients(ingredients, 0.125);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(0.125);
      expect(result[0].displayQuantity).toBe('1/8 tsp');
    });
  });
});
