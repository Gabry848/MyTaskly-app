import React from 'react';
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

  // Tool non supportato per inline rendering
  return null;
});

export default InlineVisualizationWidget;
