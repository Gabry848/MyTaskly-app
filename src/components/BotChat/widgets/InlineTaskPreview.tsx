import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ToolWidget, TaskListItem } from '../types';
import { Task } from '../../../services/taskService';
import TaskCard from '../../Task/TaskCard';

interface InlineTaskPreviewProps {
  widget: ToolWidget;
  onTaskPress?: (task: Task) => void;
}

/**
 * Preview inline di max 3 task per voice chat
 * Mostra task cards con testo "+ N altre task" se ce ne sono di più
 */
const InlineTaskPreview: React.FC<InlineTaskPreviewProps> = ({ widget, onTaskPress }) => {
  console.log('[InlineTaskPreview] Rendering with widget:', {
    hasToolOutput: !!widget.toolOutput,
    toolOutput: widget.toolOutput,
    toolOutputKeys: widget.toolOutput ? Object.keys(widget.toolOutput) : [],
  });

  // Nessun output disponibile
  if (!widget.toolOutput) {
    console.log('[InlineTaskPreview] No toolOutput, returning null');
    return null;
  }

  // Parse doppio: se toolOutput.text esiste, è una stringa JSON con i dati veri
  let parsedData = widget.toolOutput;
  if (widget.toolOutput.type === 'text' && widget.toolOutput.text) {
    try {
      parsedData = JSON.parse(widget.toolOutput.text);
      console.log('[InlineTaskPreview] Parsed text field, data:', parsedData);
    } catch (e) {
      console.error('[InlineTaskPreview] Error parsing text field:', e);
    }
  }

  // Gestisci sia formato diretto che formato con type wrapper
  let tasks: TaskListItem[] = [];

  if (parsedData.type === 'task_list' && parsedData.tasks) {
    // Formato con type wrapper (come text chat)
    tasks = parsedData.tasks;
    console.log('[InlineTaskPreview] Using wrapped format, tasks:', tasks.length);
  } else if (parsedData.tasks) {
    // Formato diretto
    tasks = parsedData.tasks;
    console.log('[InlineTaskPreview] Using direct format, tasks:', tasks.length);
  } else {
    console.log('[InlineTaskPreview] No tasks found in output');
  }

  // Lista vuota
  if (tasks.length === 0) {
    console.log('[InlineTaskPreview] Empty tasks list');
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nessuna task trovata</Text>
      </View>
    );
  }

  console.log('[InlineTaskPreview] Rendering', tasks.length, 'tasks (max 3)');

  // Converti TaskListItem → Task per TaskCard
  const convertTaskListItemToTask = (item: TaskListItem): Task => {
    return {
      id: item.id,
      title: item.title,
      description: '',  // TaskListItem non ha description
      status: item.status || 'In corso',
      priority: item.priority || 'Media',
      category_id: undefined,
      category_name: item.category || item.category_name,
      start_time: item.end_time || item.endTimeFormatted,
      end_time: item.end_time || item.endTimeFormatted,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 0,
    };
  };

  const previewTasks = tasks.slice(0, 3);
  const remainingCount = tasks.length - 3;

  return (
    <View style={styles.container}>
      {previewTasks.map((taskItem) => {
        const task = convertTaskListItemToTask(taskItem);
        return (
          <TaskCard
            key={task.id}
            task={task}
            onPress={onTaskPress}
          />
        );
      })}

      {remainingCount > 0 && (
        <View style={styles.moreTasksContainer}>
          <Text style={styles.moreTasksText}>
            + {remainingCount} {remainingCount === 1 ? 'altra task' : 'altre task'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginVertical: 4,
  },
  emptyContainer: {
    backgroundColor: '#F5F5F5',
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
  moreTasksContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  moreTasksText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
});

export default InlineTaskPreview;
