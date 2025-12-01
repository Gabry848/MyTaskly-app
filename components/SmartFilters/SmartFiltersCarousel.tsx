import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SmartFilterService, SmartFilter } from '../../src/services/SmartFilterService';

interface SmartFiltersCarouselProps {
  tasks: any[];
  onFilterSelect: (filterId: string) => void;
  selectedFilterId?: string;
}

const SmartFiltersCarousel: React.FC<SmartFiltersCarouselProps> = ({
  tasks,
  onFilterSelect,
  selectedFilterId
}) => {
  const [filters, setFilters] = useState<Array<SmartFilter & { count: number }>>([]);

  useEffect(() => {
    const filtersWithCounts = SmartFilterService.getFiltersWithCounts(tasks);
    setFilters(filtersWithCounts);
  }, [tasks]);

  if (filters.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filtri Rapidi</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            onPress={() => {
              onFilterSelect(filter.id);
              SmartFilterService.saveLastUsedFilter(filter.id);
            }}
            style={[
              styles.filterCard,
              selectedFilterId === filter.id && styles.filterCardActive
            ]}
          >
            <View style={styles.filterIconContainer}>
              <MaterialIcons
                name={filter.icon as any}
                size={24}
                color={selectedFilterId === filter.id ? '#FF6B35' : '#666'}
              />
            </View>
            <Text
              style={[
                styles.filterName,
                selectedFilterId === filter.id && styles.filterNameActive
              ]}
              numberOfLines={2}
            >
              {filter.name}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filter.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 12,
    color: '#333',
  },
  scrollView: {
    paddingHorizontal: 8,
  },
  scrollViewContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  filterCard: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    minWidth: 90,
    justifyContent: 'center',
  },
  filterCardActive: {
    backgroundColor: '#fff3e0',
    borderColor: '#FF6B35',
  },
  filterIconContainer: {
    marginBottom: 6,
  },
  filterName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: '#666',
    marginBottom: 6,
  },
  filterNameActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default SmartFiltersCarousel;
