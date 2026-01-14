import { Injectable } from '@nestjs/common';

export interface AdjustedIngredient {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  notes: string | null;
  sortOrder: number;
  isScalable: boolean;
  displayQuantity: string;
}

@Injectable()
export class PortionAdjustmentService {
  // Non-scalable units that should not be multiplied
  private readonly NON_SCALABLE_UNITS = [
    'to taste',
    'pinch',
    'dash',
    'as needed',
    'garnish',
  ];

  // Unit conversion map (smaller unit → larger unit)
  private readonly UNIT_CONVERSIONS: Record<
    string,
    Record<string, number>
  > = {
    tsp: { tbsp: 1 / 3, cup: 1 / 48 },
    tbsp: { tsp: 3, cup: 1 / 16 },
    cup: { tbsp: 16, tsp: 48 },
    oz: { lb: 1 / 16, g: 28.35 },
    lb: { oz: 16, g: 453.59 },
    g: { kg: 1 / 1000, oz: 0.035 },
    kg: { g: 1000, lb: 2.205 },
  };

  // Common fractions for display
  private readonly FRACTION_MAP: Record<number, string> = {
    0.13: '1/8', // 0.125 rounded to 0.13
    0.25: '1/4',
    0.33: '1/3',
    0.5: '1/2',
    0.66: '2/3',
    0.75: '3/4',
  };

  /**
   * Adjust recipe ingredients by multiplier
   * Returns ingredients with adjusted quantities and display formatting
   */
  adjustIngredients(
    ingredients: Array<{
      id: string;
      ingredientName: string;
      quantity: number;
      unit: string;
      notes: string | null;
      sortOrder: number;
    }>,
    multiplier: number,
  ): AdjustedIngredient[] {
    return ingredients.map((ingredient) => {
      const isScalable = this.isScalableUnit(ingredient.unit);

      // If not scalable, return original quantity
      if (!isScalable) {
        return {
          ...ingredient,
          isScalable: false,
          displayQuantity: this.formatQuantity(ingredient.quantity, ingredient.unit),
        };
      }

      // Multiply quantity
      let adjustedQuantity = ingredient.quantity * multiplier;
      let adjustedUnit = ingredient.unit;

      // Apply unit conversion if threshold reached
      const converted = this.convertUnit(adjustedQuantity, adjustedUnit);
      adjustedQuantity = converted.quantity;
      adjustedUnit = converted.unit;

      // Format quantity with fractions
      const displayQuantity = this.formatQuantity(adjustedQuantity, adjustedUnit);

      return {
        id: ingredient.id,
        ingredientName: ingredient.ingredientName,
        quantity: adjustedQuantity,
        unit: adjustedUnit,
        notes: ingredient.notes,
        sortOrder: ingredient.sortOrder,
        isScalable: true,
        displayQuantity,
      };
    });
  }

  /**
   * Check if unit is scalable (not "to taste", "pinch", etc.)
   */
  private isScalableUnit(unit: string): boolean {
    const normalizedUnit = unit.toLowerCase().trim();
    return !this.NON_SCALABLE_UNITS.some((nonScalable) =>
      normalizedUnit.includes(nonScalable),
    );
  }

  /**
   * Convert unit to larger unit if threshold reached
   * Example: 16 tbsp → 1 cup
   */
  private convertUnit(
    quantity: number,
    unit: string,
  ): { quantity: number; unit: string } {
    const normalizedUnit = unit.toLowerCase();

    // Define conversion thresholds (when to convert to larger unit)
    const conversions: Array<{
      from: string;
      to: string;
      threshold: number;
    }> = [
      { from: 'tsp', to: 'tbsp', threshold: 3 },
      { from: 'tbsp', to: 'cup', threshold: 16 },
    ];

    for (const conversion of conversions) {
      if (normalizedUnit === conversion.from && quantity >= conversion.threshold) {
        const conversionFactor =
          this.UNIT_CONVERSIONS[conversion.from]?.[conversion.to];
        if (conversionFactor) {
          return {
            quantity: quantity * conversionFactor,
            unit: conversion.to,
          };
        }
      }
    }

    return { quantity, unit };
  }

  /**
   * Format quantity with fractions for common decimals
   * Examples: 0.5 → "1/2", 1.5 → "1 1/2", 2.33 → "2.33"
   */
  private formatQuantity(quantity: number, unit: string): string {
    const whole = Math.floor(quantity);
    const decimal = quantity - whole;

    // Round decimal to 2 decimal places for fraction matching
    const roundedDecimal = Math.round(decimal * 100) / 100;

    // Look up fraction
    const fraction = this.FRACTION_MAP[roundedDecimal];

    if (whole === 0 && fraction) {
      return `${fraction} ${unit}`;
    }

    if (whole > 0 && fraction) {
      return `${whole} ${fraction} ${unit}`;
    }

    // No fraction match: display as decimal
    if (quantity === whole) {
      return `${whole} ${unit}`;
    }

    return `${quantity.toFixed(2)} ${unit}`;
  }
}
