import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import type { RecipeStep } from '@bmad/shared/types/recipe.types';

interface RecipeStepsProps {
  steps: RecipeStep[];
}

/**
 * Recipe Steps Component
 * Features:
 * - Large readable font (18px) for cooking readability
 * - Cooking mode: highlight current step on tap
 */
export function RecipeSteps({ steps }: RecipeStepsProps) {
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  const handleStepPress = (stepNumber: number) => {
    setCurrentStep(currentStep === stepNumber ? null : stepNumber);
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Instructions
      </Text>

      <Divider style={styles.divider} />

      {steps
        .sort((a, b) => a.stepNumber - b.stepNumber)
        .map((step) => (
          <TouchableOpacity
            key={step.id}
            style={[
              styles.stepContainer,
              currentStep === step.stepNumber && styles.stepActive,
            ]}
            onPress={() => handleStepPress(step.stepNumber)}
            activeOpacity={0.7}
          >
            <View style={styles.stepHeader}>
              <Text variant="titleMedium" style={styles.stepNumber}>
                Step {step.stepNumber}
              </Text>
              {step.duration && (
                <Text variant="bodyMedium" style={styles.duration}>
                  ⏱️ {step.duration} min
                </Text>
              )}
            </View>
            <Text variant="bodyLarge" style={styles.stepInstruction}>
              {step.instruction}
            </Text>
          </TouchableOpacity>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    marginBottom: 16,
  },
  stepContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontWeight: '600',
    color: '#1976d2',
  },
  duration: {
    color: '#666',
  },
  stepInstruction: {
    fontSize: 18,
    lineHeight: 28,
  },
});
