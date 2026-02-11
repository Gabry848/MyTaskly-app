import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToolWidget, CategoryListItem } from '../types';

interface InlineCategoryListProps {
  widget: ToolWidget;
  onCategoryPress?: (category: CategoryListItem) => void;
}

/**
 * Lista completa di categorie inline per voice chat
 * Mostra tutte le categorie come card semplificate
 */
const InlineCategoryList: React.FC<InlineCategoryListProps> = React.memo(({ widget, onCategoryPress }) => {
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
