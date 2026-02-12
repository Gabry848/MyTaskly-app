import React from 'react';
import { View, Text } from 'react-native';
import { ToolWidget, TaskListItem, CategoryListItem } from '../types';
import { Task } from '../../../services/taskService';
import LoadingSkeletonCard from './LoadingSkeletonCard';
import ErrorWidgetCard from './ErrorWidgetCard';
import InlineTaskPreview from './InlineTaskPreview';
import InlineCategoryList from './InlineCategoryList';

interface InlineVisualizationWidgetProps {
  widget: ToolWidget;
  onTaskPress?: (task: Task) => void;
  onCategoryPress?: (category: CategoryListItem) => void;
}

/**
 * Router per widget inline in voice chat
 * Decide quale componente renderizzare in base allo stato del widget
 */
const InlineVisualizationWidget: React.FC<InlineVisualizationWidgetProps> = React.memo(({
  widget,
  onTaskPress,
  onCategoryPress,
}) => {
  // Loading state
  if (widget.status === 'loading' && !widget.toolOutput) {
    return <LoadingSkeletonCard widget={widget} />;
  }

  // Error state
  if (widget.status === 'error') {
    return <ErrorWidgetCard widget={widget} />;
  }

  // Success state - routing per tipo di tool
  if (widget.toolName === 'show_tasks_to_user') {
    return <InlineTaskPreview widget={widget} onTaskPress={onTaskPress} />;
  }

  if (widget.toolName === 'show_categories_to_user') {
    return <InlineCategoryList widget={widget} onCategoryPress={onCategoryPress} />;
  }

  // Tool non supportato per inline rendering → mostra almeno il nome del tool
  if (widget.status === 'success') {
    const formatToolName = (name: string) =>
      name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const title = widget.toolOutput?.message || formatToolName(widget.toolName);

    return (
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#000000', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6, borderWidth: 1, borderColor: '#E1E5E9' }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#000000' }} numberOfLines={2}>{title}</Text>
        {widget.toolOutput?.type && (
          <Text style={{ fontSize: 12, color: '#666666', marginTop: 2 }} numberOfLines={1}>
            {widget.toolOutput.type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </Text>
        )}
      </View>
    );
  }

  return null;
});

export default InlineVisualizationWidget;
