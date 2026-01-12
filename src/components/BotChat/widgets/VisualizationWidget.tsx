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
        <Ionicons name={icon} size={24} color="#000000" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {itemCount} {itemCount === 1 ? 'elemento' : 'elementi'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999999" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'System',
    fontWeight: '300',
  },
});

export default VisualizationWidget;
