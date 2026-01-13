import React from 'react';
import { View } from 'react-native';
import { WidgetBubbleProps } from '../types';
import CreationWidgetCard from './CreationWidgetCard';
import VisualizationWidget from './VisualizationWidget';

/**
 * Router component che decide quale widget renderizzare in base al tipo di tool
 */
const WidgetBubble: React.FC<WidgetBubbleProps> = ({ widget, onOpenVisualization }) => {
  // Lista dei tool di visualizzazione
  const visualizationTools = ['show_tasks_to_user', 'show_categories_to_user', 'show_notes_to_user'];

  // Se è un tool di visualizzazione (anche in loading)
  const isVisualizationTool = visualizationTools.includes(widget.toolName);

  // Se il widget ha un output di tipo "visualizzazione" O è un tool di visualizzazione in loading
  if (isVisualizationTool ||
      (widget.toolOutput?.type && ['task_list', 'category_list', 'note_list'].includes(widget.toolOutput.type))) {
    return (
      <VisualizationWidget
        widget={widget}
        onOpen={onOpenVisualization}
      />
    );
  }

  // Altrimenti renderizza il widget di creazione (task_created, category_created, note_created)
  return <CreationWidgetCard widget={widget} />;
};

export default WidgetBubble;
