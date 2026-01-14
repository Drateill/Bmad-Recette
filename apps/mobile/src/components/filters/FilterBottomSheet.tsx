import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, PanResponder } from 'react-native';
import { Text, Button, Checkbox, Divider } from 'react-native-paper';
import BottomSheet from '@gorhom/bottom-sheet';
import type { RecipeFilterOptions } from '@bmad/shared/types/recipe.types';
import { useTagCategories } from '../../hooks/useTagCategories';

interface FilterBottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onApply: (filters: RecipeFilterOptions) => void;
  onClear: () => void;
  initialFilters: RecipeFilterOptions;
}

interface TimeSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (nextValue: number) => void;
}

function TimeSlider({ value, min, max, step, onChange }: TimeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  const clampValue = (nextValue: number) => {
    const clamped = Math.max(min, Math.min(max, nextValue));
    return Math.round(clamped / step) * step;
  };

  const positionToValue = (positionX: number) => {
    if (trackWidth === 0) return value;
    const ratio = Math.max(0, Math.min(1, positionX / trackWidth));
    return clampValue(min + ratio * (max - min));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          onChange(positionToValue(event.nativeEvent.locationX));
        },
        onPanResponderMove: (event) => {
          onChange(positionToValue(event.nativeEvent.locationX));
        },
      }),
    [trackWidth, min, max, step, value, onChange]
  );

  const progress = trackWidth
    ? ((value - min) / (max - min)) * trackWidth
    : 0;

  return (
    <View
      style={styles.sliderTrack}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={[styles.sliderFill, { width: progress }]} />
      <View style={[styles.sliderThumb, { left: Math.max(0, progress - 8) }]} />
    </View>
  );
}

/**
 * Filter Bottom Sheet Component
 * Features:
 * - Tag checkboxes
 * - Time range filter (max total time slider)
 * - Minimum rating filter
 * - Apply/Clear buttons
 */
export function FilterBottomSheet({
  visible,
  onDismiss,
  onApply,
  onClear,
  initialFilters,
}: FilterBottomSheetProps) {
  const { categories, loading, error } = useTagCategories(visible);
  const [maxTotalTime, setMaxTotalTime] = useState<number | undefined>(
    initialFilters.maxTotalTime
  );
  const [minRating, setMinRating] = useState<number | undefined>(
    initialFilters.minRating
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialFilters.tags || []
  );

  useEffect(() => {
    setMaxTotalTime(initialFilters.maxTotalTime);
    setMinRating(initialFilters.minRating);
    setSelectedTags(initialFilters.tags || []);
  }, [initialFilters]);

  const handleApply = () => {
    const filters: RecipeFilterOptions = {};

    if (maxTotalTime) {
      filters.maxTotalTime = maxTotalTime;
    }

    if (minRating) {
      filters.minRating = minRating;
    }

    if (selectedTags.length > 0) {
      filters.tags = selectedTags;
    }

    onApply(filters);
  };

  const handleClear = () => {
    setMaxTotalTime(undefined);
    setMinRating(undefined);
    setSelectedTags([]);
    onClear();
  };

  const snapPoints = useMemo(() => ['75%'], []);

  const ratingOptions = [1, 2, 3, 4, 5];

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  if (!visible) return null;

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onDismiss}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall">Filters</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Time Filter */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Max Cooking Time (minutes)
            </Text>
            <View style={styles.sliderRow}>
              <Text variant="bodyLarge">
                {maxTotalTime ? `${maxTotalTime} min` : 'No limit'}
              </Text>
            </View>
            <TimeSlider
              value={maxTotalTime ?? 120}
              min={10}
              max={240}
              step={5}
              onChange={setMaxTotalTime}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Rating Filter */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Minimum Rating
            </Text>
            <View style={styles.ratingContainer}>
              {ratingOptions.map((rating) => (
                <Button
                  key={rating}
                  mode={minRating === rating ? 'contained' : 'outlined'}
                  onPress={() =>
                    setMinRating(minRating === rating ? undefined : rating)
                  }
                  style={styles.ratingButton}
                  compact
                >
                  {rating}⭐
                </Button>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Tags Filter */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Tags
            </Text>
            {loading && (
              <Text variant="bodyMedium" style={styles.placeholderText}>
                Loading tags...
              </Text>
            )}
            {error && (
              <Text variant="bodyMedium" style={styles.errorText}>
                {error}
              </Text>
            )}
            {!loading &&
              !error &&
              categories.map((category) => (
                <View key={category.id} style={styles.tagCategory}>
                  <Text variant="titleSmall" style={styles.tagCategoryTitle}>
                    {category.name}
                  </Text>
                  {category.tags?.map((tag) => (
                    <View key={tag.id} style={styles.checkboxRow}>
                      <Checkbox
                        status={
                          selectedTags.includes(tag.id) ? 'checked' : 'unchecked'
                        }
                        onPress={() => toggleTag(tag.id)}
                      />
                      <Text variant="bodyLarge">{tag.name}</Text>
                    </View>
                  ))}
                </View>
              ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleClear}
            style={styles.clearButton}
          >
            Clear All
          </Button>
          <Button
            mode="contained"
            onPress={handleApply}
            style={styles.applyButton}
          >
            Apply Filters
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  sliderFill: {
    height: 12,
    backgroundColor: '#1976d2',
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1976d2',
    borderWidth: 2,
    borderColor: '#fff',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratingButton: {
    minWidth: 60,
  },
  divider: {
    marginVertical: 16,
  },
  placeholderText: {
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#c62828',
    marginBottom: 8,
  },
  tagCategory: {
    marginBottom: 12,
  },
  tagCategoryTitle: {
    marginBottom: 8,
    color: '#555',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
});
