import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToolWidget, CategoryListItem } from '../types';
import { getCategories } from '../../../services/taskService';

interface InlineCategoryListProps {
  widget: ToolWidget;
  onCategoryPress?: (category: CategoryListItem) => void;
}

/**
 * Lista completa di categorie inline per voice chat
 * Mostra tutte le categorie come card semplificate
 */
const InlineCategoryList: React.FC<InlineCategoryListProps> = React.memo(({ widget, onCategoryPress }) => {
  // Stato locale per le categorie recuperate
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [fetchedCategories, setFetchedCategories] = useState<CategoryListItem[] | null>(null);

  // Recupera categorie dal backend quando non ci sono dati
  useEffect(() => {
    const fetchCategories = async () => {
      const output = widget.toolOutput;
      if (!output) return;

      // Parse doppio: se toolOutput.text esiste, è una stringa JSON con i dati veri
      let parsedData = output;
      if (output.type === 'text' && output.text) {
        try {
          parsedData = JSON.parse(output.text);
        } catch (e) {
          console.error('[InlineCategoryList] Error parsing text field:', e);
          return;
        }
      }

      // Se abbiamo già categorie recuperate o ci sono già categorie, non fare nulla
      if (fetchedCategories) return;
      if (parsedData.type === 'category_list' && parsedData.categories && parsedData.categories.length > 0) return;
      if (parsedData.categories && parsedData.categories.length > 0) return;

      setLoadingCategories(true);
      try {
        const categories = await getCategories();

        // Converti al formato CategoryListItem
        const categoryListItems: CategoryListItem[] = categories.map(cat => ({
          id: cat.category_id,
          name: cat.name,
          description: cat.description || '',
          color: getCategoryColor(cat.name),
          taskCount: 0, // TODO: Calculate actual task count
        }));

        setFetchedCategories(categoryListItems);
      } catch (error) {
        console.error('[InlineCategoryList] Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [widget.toolOutput]);

  // Helper function per category color
  const getCategoryColor = (categoryName: string): string => {
    const colorMap: Record<string, string> = {
      'Lavoro': '#3B82F6',
      'Personale': '#8B5CF6',
      'Studio': '#10B981',
      'Sport': '#F59E0B',
      'Famiglia': '#EC4899',
      'Cibo': '#EF4444',
      'Generale': '#6B7280'
    };
    return colorMap[categoryName] || '#6B7280';
  };

  // Se stiamo caricando, mostra un indicatore di caricamento
  if (loadingCategories) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#666666" />
        <Text style={styles.loadingText}>Caricamento categorie...</Text>
      </View>
    );
  }

  // Nessun output disponibile
  if (!widget.toolOutput) {
    return null;
  }

  // Parse doppio: se toolOutput.text esiste, è una stringa JSON con i dati veri
  let parsedData = widget.toolOutput;
  if (widget.toolOutput.type === 'text' && widget.toolOutput.text) {
    try {
      parsedData = JSON.parse(widget.toolOutput.text);
    } catch (e) {
      console.error('[InlineCategoryList] Error parsing text field:', e);
    }
  }

  // Gestisci sia formato diretto che formato con type wrapper
  let categories: CategoryListItem[] = [];

  if (parsedData.type === 'category_list' && parsedData.categories) {
    // Formato con type wrapper (come text chat)
    categories = parsedData.categories;
  } else if (parsedData.categories) {
    // Formato diretto
    categories = parsedData.categories;
  }

  // Se non abbiamo categorie nell'output ma abbiamo categorie recuperate, usa quelle
  if (categories.length === 0 && fetchedCategories && fetchedCategories.length > 0) {
    categories = fetchedCategories;
  }

  // Lista vuota
  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nessuna categoria trovata</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {categories.map((category) => {
        const taskCount = category.taskCount || category.task_count || 0;
        const categoryColor = category.color || '#666666';

        return (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => onCategoryPress?.(category)}
            activeOpacity={0.7}
          >
            {/* Color badge */}
            <View style={[styles.colorBadge, { backgroundColor: categoryColor }]} />

            {/* Category info */}
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName} numberOfLines={1}>
                {category.name}
              </Text>
              <Text style={styles.taskCount}>
                {taskCount} {taskCount === 1 ? 'task' : 'task'}
              </Text>
            </View>

            {/* Shared badge */}
            {category.isShared && (
              <View style={styles.sharedBadge}>
                <Ionicons name="people" size={16} color="#666666" />
              </View>
            )}

            {/* Arrow icon */}
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginVertical: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  colorBadge: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  taskCount: {
    fontSize: 13,
    color: '#666666',
  },
  sharedBadge: {
    marginRight: 4,
  },
});

export default InlineCategoryList;
