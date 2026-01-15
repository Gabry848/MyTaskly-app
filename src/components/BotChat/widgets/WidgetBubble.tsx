import React from 'react';
import { View } from 'react-native';
import { WidgetBubbleProps } from '../types';
import CreationWidgetCard from './CreationWidgetCard';
import VisualizationWidget from './VisualizationWidget';

/**
 * Router component che decide quale widget renderizzare in base al tipo di tool
 */
const WidgetBubble: React.FC<WidgetBubbleProps> = ({ widget, onOpenVisualization, onOpenItemDetail }) => {
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

  // Handler per aprire dettaglio creazione
  const handleCreationPress = () => {
    if (!widget.toolOutput || widget.status !== 'success') return;

    const output = widget.toolOutput;

    // Determina tipo e item in base al tipo di output
    if (output.type === 'task_created' && output.task && onOpenItemDetail) {
      // Assicurati che il task abbia tutti i campi necessari per ItemDetailModal
      const taskItem = {
        ...output.task,
        id: output.task.task_id,
        completed: output.task.status === 'completed' || output.task.status === 'Completato',
      };
      onOpenItemDetail(taskItem, 'task');
    } else if (output.type === 'category_created' && output.category && onOpenItemDetail) {
      // Assicurati che la categoria abbia tutti i campi necessari
      const categoryItem = {
        ...output.category,
        id: output.category.category_id,
      };
      onOpenItemDetail(categoryItem, 'category');
    } else if (output.type === 'note_created' && output.note && onOpenItemDetail) {
      // Assicurati che la nota abbia tutti i campi necessari
      const noteItem = {
        ...output.note,
        id: output.note.note_id,
      };
      onOpenItemDetail(noteItem, 'note');
    }
  };

  // Altrimenti renderizza il widget di creazione (task_created, category_created, note_created)
  return <CreationWidgetCard widget={widget} onPress={handleCreationPress} />;
};

export default WidgetBubble;
