import React from 'react';
import { View } from 'react-native';
import { WidgetBubbleProps } from '../types';
import CreationWidgetCard from './CreationWidgetCard';
import VisualizationWidget from './VisualizationWidget';

/**
 * Router component che decide quale widget renderizzare in base al tipo di tool
 */
const WidgetBubble: React.FC<WidgetBubbleProps> = ({ widget, onOpenVisualization }) => {
  // Se il widget ha un output di tipo "visualizzazione" (task_list, category_list, note_list)
  if (widget.toolOutput?.type &&
      ['task_list', 'category_list', 'note_list'].includes(widget.toolOutput.type)) {
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
