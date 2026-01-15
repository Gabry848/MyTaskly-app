import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskTableBubbleProps, TaskItem } from './types';

interface TaskListBubbleProps extends TaskTableBubbleProps {
  onViewAll?: (tasks: TaskItem[]) => void;
}

const TaskListBubble: React.FC<TaskListBubbleProps> = ({ message, style, onViewAll }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  // Animazione di entrata
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Funzione per estrarre il JSON dal messaggio
  const extractTasksFromMessage = (text: string): TaskItem[] => {
    try {
      // Trova l'inizio e la fine del JSON array
      const jsonStartIndex = text.indexOf('[');
      const jsonEndIndex = text.lastIndexOf(']') + 1;

      if (jsonStartIndex === -1 || jsonEndIndex === 0) {
        return [];
      }

      // Estrae la stringa JSON
      let jsonString = text.substring(jsonStartIndex, jsonEndIndex);

      // Pulisce la stringa JSON rimuovendo i caratteri di escape
      jsonString = jsonString.replace(/\\"/g, '"');
      jsonString = jsonString.replace(/\\n/g, '\n');
      jsonString = jsonString.replace(/\\t/g, '\t');
      jsonString = jsonString.replace(/\\\\/g, '\\');

      // Parse del JSON
      const parsedTasks = JSON.parse(jsonString);

      return Array.isArray(parsedTasks) ? parsedTasks : [];
    } catch (error) {
      console.error('Errore nell\'estrazione dei task dal messaggio:', error);

      // Tentativo alternativo: prova a fare un doppio parse se sembra essere una stringa JSON escaped
      try {
        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']') + 1;
        let rawJsonString = text.substring(jsonStart, jsonEnd);

        // Se contiene ancora escape, prova JSON.parse doppio
        if (rawJsonString.includes('\\"')) {
          const parsed = JSON.parse('"' + rawJsonString + '"');
          const parsedTasks = JSON.parse(parsed);
          return Array.isArray(parsedTasks) ? parsedTasks : [];
        }
      } catch (secondError) {
        console.error('Anche il tentativo alternativo è fallito:', secondError);
      }

      return [];
    }
  };

  useEffect(() => {
    const extractedTasks = extractTasksFromMessage(message);
    setTasks(extractedTasks);
  }, [message]);

  // Controlla se il messaggio indica "Nessun task trovato"
  const isEmptyTaskMessage = message.includes('📅 Nessun task trovato') ||
                            message.includes('Nessun task trovato') ||
                            message.includes('TASK PER LA DATA');

  // Se non ci sono task e il messaggio non è di tipo task, non mostrare nulla
  if ((!tasks || tasks.length === 0) && !isEmptyTaskMessage) {
    return null;
  }

  // Estrae il titolo dal messaggio se disponibile
  const extractTitle = (text: string): string => {
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim();
    if (firstLine && firstLine.startsWith('Ecco')) {
      return firstLine;
    }
    return 'Elenco Impegni';
  };

  const title = extractTitle(message);

  // Mostra max 3 task come preview
  const MAX_PREVIEW_TASKS = 3;
  const previewTasks = tasks.slice(0, MAX_PREVIEW_TASKS);
  const hasMoreTasks = tasks.length > MAX_PREVIEW_TASKS;

  // Ottieni colore priorità
  const getPriorityColor = (priority: string): string => {
    const priorityColors: Record<string, string> = {
      'Alta': '#000000',
      'Media': '#333333',
      'Bassa': '#666666',
    };
    return priorityColors[priority] || '#999999';
  };

  // Formatta la data
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isToday = date.toDateString() === today.toDateString();
      const isTomorrow = date.toDateString() === tomorrow.toDateString();

      if (isToday) {
        return `Oggi, ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (isTomorrow) {
        return `Domani, ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return date.toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch {
      return dateString;
    }
  };

  // Ottieni icona stato
  const getStatusIcon = (status: string) => {
    if (status === 'Completato') {
      return <Ionicons name="checkmark-circle" size={20} color="#34C759" />;
    }
    return <Ionicons name="ellipse-outline" size={20} color="#007AFF" />;
  };

  return (
    <Animated.View style={[
      styles.container,
      style,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {tasks.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{tasks.length}</Text>
          </View>
        )}
      </View>

      {/* Se non ci sono task, mostra messaggio */}
      {tasks.length === 0 ? (
        <View style={styles.emptyMessageContainer}>
          <Ionicons name="calendar-outline" size={48} color="#C7C7CC" />
          <Text style={styles.emptyMessage}>
            {message.includes('📅 Nessun task trovato')
              ? message.split('📅')[1]?.trim() || 'Nessun task trovato per questa data'
              : 'Nessun task trovato per questa data'
            }
          </Text>
        </View>
      ) : (
        <>
          {/* Preview Task Cards */}
          <View style={styles.taskCardsContainer}>
            {previewTasks.map((task, index) => {
              const priorityColor = getPriorityColor(task.priority);

              return (
                <View
                  key={task.task_id || index}
                  style={[
                    styles.taskCard,
                    { borderLeftColor: priorityColor, borderLeftWidth: 4 }
                  ]}
                >
                  <View style={styles.taskCardHeader}>
                    <View style={styles.taskTitleRow}>
                      {getStatusIcon(task.status)}
                      <Text style={styles.taskTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.taskCardMeta}>
                    {task.category && (
                      <View style={styles.categoryBadge}>
                        <Ionicons name="folder-outline" size={12} color="#666666" />
                        <Text style={styles.categoryText}>{task.category}</Text>
                      </View>
                    )}

                    {task.end_time && (
                      <View style={styles.timeBadge}>
                        <Ionicons name="time-outline" size={12} color="#666666" />
                        <Text style={styles.timeText}>{formatDate(task.end_time)}</Text>
                      </View>
                    )}
                  </View>

                  {task.priority && (
                    <View style={styles.priorityRow}>
                      <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                      <Text style={styles.priorityText}>{task.priority}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* View All Button */}
          {hasMoreTasks && (
            <TouchableOpacity
              style={styles.viewAllButton}
              activeOpacity={0.7}
              onPress={() => onViewAll && onViewAll(tasks)}
            >
              <Text style={styles.viewAllText}>
                Visualizza tutti ({tasks.length})
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          )}
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 20,
    borderColor: '#f0f0f0',
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
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
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  taskCardHeader: {
    marginBottom: 8,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'System',
    flex: 1,
  },
  taskCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
    fontFamily: 'System',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '300',
    fontFamily: 'System',
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '400',
    fontFamily: 'System',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
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
});

export default TaskListBubble;
