import React from 'react';
import { View } from 'react-native';
import { WidgetBubbleProps } from '../types';
import CreationWidgetCard from './CreationWidgetCard';
import VisualizationWidget from './VisualizationWidget';

/**
 * Router component che decide quale widget renderizzare in base al tipo di tool
 */
const WidgetBubble: React.FC<WidgetBubbleProps> = ({ widget, onOpenVisualization, onOpenItemDetail, onTaskPress }) => {
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
        onTaskPress={onTaskPress}
      />
    );
  }

  // Handler per aprire dettaglio creazione
  const handleCreationPress = () => {
    if (!widget.toolOutput || widget.status !== 'success') return;

    const output = widget.toolOutput;

    // Parse toolArgs per ottenere i dati originali della richiesta
    let toolArgsData: any = {};
    if (widget.toolArgs) {
      try {
        toolArgsData = JSON.parse(widget.toolArgs);
      } catch (e) {
        console.error('[WidgetBubble] Error parsing toolArgs:', e);
      }
    }

    // Determina tipo e item in base al tipo di output
    if (output.type === 'task_created' && output.task) {
      // Per i task, usa onTaskPress per aprire TaskEditModal
      if (onTaskPress) {
        // Converti al formato Task completo per TaskEditModal
        // Usa toolArgs per i dati originali (title, description, etc.)
        const taskForEdit = {
          task_id: output.task.task_id,
          id: output.task.task_id,
          title: toolArgsData.title || output.task.title || '',
          description: toolArgsData.description || output.task.description || '',
          start_time: toolArgsData.start_time || output.task.start_time || new Date().toISOString(),
          end_time: toolArgsData.end_time || output.task.end_time || '',
          category_id: output.task.category_id || 0,
          category_name: output.task.category_name || '',
          priority: toolArgsData.priority || output.task.priority || 'Media',
          status: output.task.status || 'In sospeso',
          user_id: 0,
          is_recurring: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        onTaskPress(taskForEdit);
      }
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
