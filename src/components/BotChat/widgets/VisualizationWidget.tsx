import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToolWidget } from '../types';

interface VisualizationWidgetProps {
  widget: ToolWidget;
  onOpen: (widget: ToolWidget) => void;
}

/**
 * Widget per tool di visualizzazione (show_tasks_to_user, show_categories_to_user, show_notes_to_user)
 * Apre una modal full-screen quando toccato
 */
const VisualizationWidget: React.FC<VisualizationWidgetProps> = ({ widget, onOpen }) => {
  const output = widget.toolOutput;
  if (!output) return null;

  let title = '';
  let itemCount = 0;
  let icon: keyof typeof Ionicons.glyphMap = 'list';

  if (output.type === 'task_list') {
    title = 'Visualizza task';
    itemCount = output.tasks?.length || 0;
    icon = 'checkmark-circle-outline';
  } else if (output.type === 'category_list') {
    title = 'Visualizza categorie';
    itemCount = output.categories?.length || 0;
    icon = 'folder-outline';
  } else if (output.type === 'note_list') {
    title = 'Visualizza note';
    itemCount = output.notes?.length || 0;
    icon = 'document-text-outline';
  }

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onOpen(widget)}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={28} color="#007AFF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {itemCount} {itemCount === 1 ? 'elemento' : 'elementi'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    maxWidth: '85%',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

export default VisualizationWidget;
