import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToolWidget, TaskListItem } from '../types';
import TaskCard from '../../Task/TaskCard';
import { Task as TaskType } from '../../../services/taskService';

interface VisualizationWidgetProps {
  widget: ToolWidget;
  onOpen: (widget: ToolWidget) => void;
  onTaskPress?: (task: any) => void;
  onCategoryPress?: (category: any) => void;
}

/**
 * Widget per tool di visualizzazione (show_tasks_to_user, show_categories_to_user, show_notes_to_user)
 * Per task_list: mostra preview card-based (max 3)
 * Per altri tipi: mostra card semplice con pulsante
 */
const VisualizationWidget: React.FC<VisualizationWidgetProps> = ({ widget, onOpen, onTaskPress, onCategoryPress }) => {
  const output = widget.toolOutput;

  // Se è in stato loading e non ha ancora output, mostra lo skeleton loader
  if (widget.status === 'loading' && !output) {
    return <LoadingWidget widget={widget} />;
  }

  if (!output) return null;

  // Per task, categorie e note, usa il design semplice con bottone
  let title = '';
  let itemCount = 0;
  let icon: keyof typeof Ionicons.glyphMap = 'list';

  if (output.type === 'task_list') {
    title = 'Visualizza task';
    itemCount = output.tasks?.length || 0;
    icon = 'calendar-outline';
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

/**
 * Loading widget con animazione per visualizzazione task/categorie/note
 */
const LoadingWidget: React.FC<{ widget: ToolWidget }> = ({ widget }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    // Animazione di pulsazione
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Animazione shimmer
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    shimmerAnimation.start();

    return () => {
      pulseAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [pulseAnim, shimmerAnim]);

  // Determina il tipo di contenuto in base al tool name
  let loadingText = 'Caricamento dati...';
  let icon: keyof typeof Ionicons.glyphMap = 'list';

  if (widget.toolName === 'show_tasks_to_user') {
    loadingText = 'Recupero task dal server...';
    icon = 'calendar-outline';
  } else if (widget.toolName === 'show_categories_to_user') {
    loadingText = 'Recupero categorie dal server...';
    icon = 'folder-outline';
  } else if (widget.toolName === 'show_notes_to_user') {
    loadingText = 'Recupero note dal server...';
    icon = 'document-text-outline';
  }

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingHeader}>
        <Animated.View style={[styles.loadingIconContainer, { opacity: pulseAnim }]}>
          <Ionicons name={icon} size={24} color="#666666" />
        </Animated.View>
        <View style={styles.loadingTextContainer}>
          <Text style={styles.loadingTitle}>{loadingText}</Text>
          <View style={styles.loadingDotsContainer}>
            <ActivityIndicator size="small" color="#666666" />
          </View>
        </View>
      </View>

      {/* Skeleton per task preview */}
      {widget.toolName === 'show_tasks_to_user' && (
        <View style={styles.skeletonTasksContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonTaskCard}>
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  {
                    transform: [{ translateX: shimmerTranslate }],
                  },
                ]}
              />
              <View style={styles.skeletonTaskContent}>
                <Animated.View style={[styles.skeletonLine, styles.skeletonTitle, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonLine, styles.skeletonSubtitle, { opacity: pulseAnim }]} />
                <View style={styles.skeletonTaskMeta}>
                  <Animated.View style={[styles.skeletonBadge, { opacity: pulseAnim }]} />
                  <Animated.View style={[styles.skeletonBadge, { opacity: pulseAnim }]} />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Component for task list preview with card-based design
 */
const TaskListPreview: React.FC<VisualizationWidgetProps> = ({ widget, onOpen, onTaskPress }) => {
  const output = widget.toolOutput;
  const tasks = output?.tasks || [];

  // Log ridotto - solo una volta all'inizio
  console.log('[VisualizationWidget] Tasks received:', tasks.length);

  // Mostra max 3 task come preview
  const MAX_PREVIEW_TASKS = 3;
  const previewTasks = tasks.slice(0, MAX_PREVIEW_TASKS);
  const hasMoreTasks = tasks.length > MAX_PREVIEW_TASKS;

  // Converti TaskListItem a Task per TaskCard
  const convertToTask = (taskListItem: TaskListItem): TaskType => {
    const item = taskListItem as any;

    // Log completo del task raw per il primo elemento
    if (taskListItem.id === tasks[0]?.id) {
      console.log('[VisualizationWidget] 🔍 RAW TASK DATA:', JSON.stringify(item, null, 2));
    }

    const converted = {
      task_id: taskListItem.id,
      id: taskListItem.id,
      title: taskListItem.title,
      description: item.description || '',
      // Il server può inviare in diversi formati, prova tutti
      start_time: item.startTime || item.start_time || item.startTimeFormatted || '',
      end_time: item.endTime || item.end_time || item.endTimeFormatted || taskListItem.end_time || '',
      category_id: item.category_id || item.categoryId || 0,
      category_name: taskListItem.category_name || taskListItem.category || item.category || '',
      priority: taskListItem.priority || item.priority || 'Media',
      status: taskListItem.status || item.status || (taskListItem.completed ? 'Completato' : 'In sospeso'),
      user_id: item.user_id || item.userId || 0,
      is_recurring: item.is_recurring || item.isRecurring || false,
      created_at: item.created_at || item.createdAt || new Date().toISOString(),
      updated_at: item.updated_at || item.updatedAt || new Date().toISOString(),
    };

    // Log della conversione per il primo task
    if (taskListItem.id === tasks[0]?.id) {
      console.log('[VisualizationWidget] ✅ CONVERTED TASK:', {
        description: converted.description,
        start_time: converted.start_time,
        end_time: converted.end_time,
        category_name: converted.category_name
      });
    }

    return converted;
  };

  // Empty state
  if (tasks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyMessageContainer}>
          <Ionicons name="calendar-outline" size={48} color="#C7C7CC" />
          <Text style={styles.emptyMessage}>Nessun task trovato</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Task</Text>
        {tasks.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{tasks.length}</Text>
          </View>
        )}
      </View>

      {/* Preview Task Cards usando il TaskCard classico */}
      <View style={styles.taskCardsContainer}>
        {previewTasks.map((taskListItem: TaskListItem, index: number) => {
          const task = convertToTask(taskListItem);
          return (
            <TaskCard
              key={task.id || index}
              task={task}
              onPress={onTaskPress}
            />
          );
        })}
      </View>

      {/* View All Button */}
      {hasMoreTasks && (
        <TouchableOpacity
          style={styles.viewAllButton}
          activeOpacity={0.7}
          onPress={() => onOpen(widget)}
        >
          <Text style={styles.viewAllText}>
            Visualizza tutti ({tasks.length})
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#000000" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Stili per categorie/note (card semplice con bottone)
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    maxWidth: '85%',
    borderWidth: 1.5,
    borderColor: '#E1E5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'System',
    fontWeight: '300',
  },

  // Stili per task list preview (usa TaskCard classico)
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 0,
    borderColor: '#E1E5E9',
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    maxWidth: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'System',
  },
  taskCardsContainer: {
    gap: 0, // TaskCard ha già i suoi margini
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  emptyMessageContainer: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontFamily: 'System',
    lineHeight: 20,
    marginTop: 12,
  },

  // Loading widget styles
  loadingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 0,
    borderColor: '#E1E5E9',
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    maxWidth: '85%',
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  loadingTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'System',
    flex: 1,
  },
  loadingDotsContainer: {
    marginLeft: 8,
  },
  skeletonTasksContainer: {
    gap: 12,
  },
  skeletonTaskCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 200,
  },
  skeletonTaskContent: {
    gap: 8,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },
  skeletonTitle: {
    width: '70%',
    height: 14,
  },
  skeletonSubtitle: {
    width: '50%',
    height: 12,
  },
  skeletonTaskMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  skeletonBadge: {
    width: 60,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
  },
});

export default VisualizationWidget;
