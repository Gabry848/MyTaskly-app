import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisualizationModalProps, TaskListItem } from '../types';
import Task from '../../Task/Task';
import { Task as TaskType } from '../../../services/taskService';
import CalendarGrid from '../../Calendar/CalendarGrid';
import dayjs from 'dayjs';

/**
 * Modal full-screen per visualizzare liste di task/categorie/note
 * Include calendario in alto (solo per task) e lista scrollabile sotto
 */
const VisualizationModal: React.FC<VisualizationModalProps> = ({
  visible,
  widget,
  onClose,
  onItemPress,
  onCategoryPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const output = widget.toolOutput;

  if (!output) return null;

  // Determina il tipo di contenuto
  const isTaskList = output.type === 'task_list';
  const isCategoryList = output.type === 'category_list';
  const isNoteList = output.type === 'note_list';

  // Prepara i dati
  const items = isTaskList ? output.tasks : isCategoryList ? output.categories : output.notes;
  const title = isTaskList ? 'Task' : isCategoryList ? 'Categorie' : 'Note';

  console.log('[VisualizationModal] Rendering', {
    isTaskList,
    itemsCount: items?.length,
    outputType: output?.type,
    widgetStatus: widget.status,
    firstItem: items?.[0]
  });

  // Filtra task per data, ricerca, priorità e stato
  const filteredItems = useMemo(() => {
    if (!isTaskList || !output.tasks) return items;

    let filtered = output.tasks;

    // Filtra per data selezionata (controlla sia end_time che start_time)
    if (selectedDate) {
      filtered = filtered.filter((task: TaskListItem) => {
        const item = task as any;
        // Controlla tutti i possibili campi data
        const endTime = item.endTime || item.end_time || item.endTimeFormatted;
        const startTime = item.startTime || item.start_time || item.startTimeFormatted;
        
        // Se ha end_time, usa quello per il confronto
        if (endTime) {
          const taskDate = dayjs(endTime).format('YYYY-MM-DD');
          return taskDate === selectedDate;
        }
        // Altrimenti usa start_time se disponibile
        if (startTime) {
          const taskDate = dayjs(startTime).format('YYYY-MM-DD');
          return taskDate === selectedDate;
        }
        
        return false;
      });
    }

    // Filtra per ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((task: TaskListItem) =>
        task.title.toLowerCase().includes(query) ||
        (task.category_name && task.category_name.toLowerCase().includes(query))
      );
    }

    // Filtra per priorità
    if (priorityFilter) {
      filtered = filtered.filter((task: TaskListItem) =>
        task.priority === priorityFilter
      );
    }

    // Filtra per stato
    if (statusFilter === 'pending') {
      filtered = filtered.filter((task: TaskListItem) => {
        const item = task as any;
        const isCompleted = task.completed || item.status === 'Completato';
        return !isCompleted;
      });
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter((task: TaskListItem) => {
        const item = task as any;
        const isCompleted = task.completed || item.status === 'Completato';
        return isCompleted;
      });
    }

    return filtered;
  }, [selectedDate, searchQuery, priorityFilter, statusFilter, isTaskList, output.tasks, items]);

  const displayItems = filteredItems || items;

  // Debug filtro
  if (isTaskList && selectedDate) {
    console.log('[VisualizationModal] Filtro data attivo:', {
      selectedDate,
      totalTasks: output.tasks?.length,
      filteredTasks: filteredItems?.length,
      firstFilteredTask: filteredItems?.[0]
    });
  }

  // Ottieni colore priorità
  const getPriorityColor = (priority?: string): string => {
    const priorityColors: Record<string, string> = {
      'Alta': '#000000',
      'Media': '#333333',
      'Bassa': '#666666',
    };
    return priority ? (priorityColors[priority] || '#999999') : '#999999';
  };

  // Formatta la data
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
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

  // Converti TaskListItem a Task per TaskCard
  const convertToTask = (taskListItem: TaskListItem): TaskType => {
    const item = taskListItem as any;
    
    // Determina start_time e end_time dai vari formati possibili
    const startTime = item.startTime || item.start_time || item.startTimeFormatted;
    const endTime = item.endTime || item.end_time || item.endTimeFormatted || taskListItem.end_time;
    
    return {
      task_id: taskListItem.id,
      id: taskListItem.id,
      title: taskListItem.title,
      description: item.description || '',
      // Usa start_time se disponibile, altrimenti end_time, altrimenti data corrente
      start_time: startTime || endTime || new Date().toISOString(),
      // Usa end_time se disponibile, altrimenti stringa vuota
      end_time: endTime || '',
      category_id: item.category_id || item.categoryId || 0,
      category_name: taskListItem.category_name || taskListItem.category || item.category || '',
      priority: taskListItem.priority || item.priority || 'Media',
      status: taskListItem.status || item.status || (taskListItem.completed ? 'Completato' : 'In sospeso'),
      user_id: item.user_id || item.userId || 0,
      is_recurring: item.is_recurring || item.isRecurring || false,
      created_at: item.created_at || item.createdAt || new Date().toISOString(),
      updated_at: item.updated_at || item.updatedAt || new Date().toISOString(),
    };
  };

  // Renderizza un singolo item
  const renderItem = (item: any, index: number) => {
    if (isTaskList) {
      const taskListItem = item as TaskListItem;
      const task = convertToTask(taskListItem);

      return (
        <Task
          key={task.id || index}
          task={task}
          onTaskComplete={async (taskId: number) => {
            // Handle task completion
            if (onItemPress) {
              onItemPress({ ...taskListItem, completed: true }, 'task');
            }
          }}
          onTaskUncomplete={async (taskId: number) => {
            // Handle task uncomplete
            if (onItemPress) {
              onItemPress({ ...taskListItem, completed: false }, 'task');
            }
          }}
          onTaskEdit={(taskId: number, updatedTask: TaskType) => {
            // Handle task edit
            if (onItemPress) {
              onItemPress({ ...taskListItem, ...updatedTask }, 'task');
            }
          }}
          onTaskDelete={(taskId: number) => {
            // Handle task deletion
            if (onItemPress) {
              onItemPress(taskListItem, 'task');
            }
          }}
          isOwned={true}
          permissionLevel="READ_WRITE"
          hideCheckbox={false}
        />
      );
    }

    if (isCategoryList) {
      // Usa imageUrl solo se è un URL valido (inizia con http/https/file://)
      // Altrimenti lascia undefined per usare l'icona predefinita
      const validImageUrl = item.imageUrl || item.icon;
      const isValidUrl = validImageUrl && (
        validImageUrl.startsWith('http://') ||
        validImageUrl.startsWith('https://') ||
        validImageUrl.startsWith('file://')
      );

      return (
        <TouchableOpacity
          key={index}
          style={styles.categoryCard}
          activeOpacity={0.7}
          onPress={() => {
            console.log('[VisualizationModal] Category pressed:', item.name);
            console.log('[VisualizationModal] onCategoryPress available:', !!onCategoryPress);
            if (onCategoryPress) {
              onCategoryPress(item);
            } else {
              console.warn('[VisualizationModal] onCategoryPress is not defined!');
            }
          }}
        >
          <View style={styles.categoryIconContainer}>
            {isValidUrl ? (
              <Image source={{ uri: validImageUrl }} style={styles.categoryImage} />
            ) : (
              <Ionicons name="folder" size={32} color="#007AFF" />
            )}
          </View>
          <View style={styles.categoryTextContainer}>
            <Text style={styles.categoryTitle} numberOfLines={1}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={styles.categoryDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.categoryMetaContainer}>
              <View style={styles.categoryTaskCount}>
                <Ionicons name="list-outline" size={14} color="#666666" />
                <Text style={styles.categoryTaskCountText}>
                  {item.taskCount || item.task_count || 0} task
                </Text>
              </View>
              {item.isShared && (
                <View style={styles.categorySharedBadge}>
                  <Ionicons name="people-outline" size={14} color="#007AFF" />
                  <Text style={styles.categorySharedText}>Condiviso</Text>
                </View>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      );
    }

    if (isNoteList) {
      return (
        <TouchableOpacity
          key={index}
          style={styles.itemCard}
          activeOpacity={0.7}
          onPress={() => onItemPress && onItemPress(item, 'note')}
        >
          <View style={[styles.itemIconContainer, { backgroundColor: item.color || '#FFD60A' }]}>
            <Ionicons name="document-text" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.content && (
              <Text style={styles.itemSubtitle} numberOfLines={2}>
                {item.content}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* SEARCH BAR CON PULSANTE CALENDARIO (solo per task) */}
          {isTaskList && (
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#8E8E93" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cerca task per titolo o categoria..."
                  placeholderTextColor="#8E8E93"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                )}
              </View>
              {/* Pulsante Calendario */}
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => setShowCalendarModal(true)}
              >
                <Ionicons name="calendar-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* FILTRI (solo per task) */}
          {isTaskList && (
            <View style={styles.filtersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollContent}>
                {/* Filtro Stato */}
                <TouchableOpacity
                  style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
                  onPress={() => setStatusFilter('all')}
                >
                  <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
                    Tutti
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, statusFilter === 'pending' && styles.filterChipActive]}
                  onPress={() => setStatusFilter('pending')}
                >
                  <Text style={[styles.filterChipText, statusFilter === 'pending' && styles.filterChipTextActive]}>
                    In corso
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, statusFilter === 'completed' && styles.filterChipActive]}
                  onPress={() => setStatusFilter('completed')}
                >
                  <Text style={[styles.filterChipText, statusFilter === 'completed' && styles.filterChipTextActive]}>
                    Completati
                  </Text>
                </TouchableOpacity>

                <View style={styles.filterDivider} />

                {/* Filtro Priorità */}
                <TouchableOpacity
                  style={[styles.filterChip, priorityFilter === 'Alta' && styles.filterChipPriorityHigh]}
                  onPress={() => setPriorityFilter(priorityFilter === 'Alta' ? null : 'Alta')}
                >
                  <Text style={[styles.filterChipText, priorityFilter === 'Alta' && styles.filterChipTextActive]}>
                    Alta
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, priorityFilter === 'Media' && styles.filterChipPriorityMedium]}
                  onPress={() => setPriorityFilter(priorityFilter === 'Media' ? null : 'Media')}
                >
                  <Text style={[styles.filterChipText, priorityFilter === 'Media' && styles.filterChipTextActive]}>
                    Media
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, priorityFilter === 'Bassa' && styles.filterChipPriorityLow]}
                  onPress={() => setPriorityFilter(priorityFilter === 'Bassa' ? null : 'Bassa')}
                >
                  <Text style={[styles.filterChipText, priorityFilter === 'Bassa' && styles.filterChipTextActive]}>
                    Bassa
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Indicatore data selezionata */}
          {isTaskList && selectedDate && (
            <View style={styles.selectedDateIndicator}>
              <Text style={styles.selectedDateText}>
                Filtrato per: {dayjs(selectedDate).format('DD MMMM YYYY')}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <Ionicons name="close-circle" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          )}


          {/* LISTA ITEMS */}
          <View style={[styles.listContainer, isCategoryList && styles.categoryListContainer]}>
            {displayItems && displayItems.length > 0 ? (
              displayItems.map((item: any, index: number) => renderItem(item, index))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={64} color="#C7C7CC" />
                <Text style={styles.emptyText}>
                  {selectedDate
                    ? 'Nessun elemento per questa data'
                    : 'Nessun elemento trovato'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* MODAL CALENDARIO */}
      {isTaskList && (
        <Modal
          visible={showCalendarModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCalendarModal(false)}
        >
          <SafeAreaView style={styles.calendarModalContainer}>
            {/* Header del modal calendario */}
            <View style={styles.calendarModalHeader}>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <Ionicons name="close" size={28} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.calendarModalTitle}>Seleziona Data</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Calendario */}
            <View style={styles.calendarGridContainer}>
              <CalendarGrid
                selectedDate={calendarViewDate}
                tasks={output.tasks
                  ?.filter((task: TaskListItem) => {
                    const item = task as any;
                    // Includi task con end_time O start_time
                    const endTime = item.endTime || item.end_time || item.endTimeFormatted;
                    const startTime = item.startTime || item.start_time || item.startTimeFormatted;
                    return endTime || startTime;
                  })
                  .map((task: TaskListItem) => convertToTask(task)) || []}
                onSelectDate={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setShowCalendarModal(false);
                  }
                }}
                onPreviousMonth={() => {
                  const newDate = dayjs(calendarViewDate).subtract(1, 'month').format('YYYY-MM-DD');
                  setCalendarViewDate(newDate);
                }}
                onNextMonth={() => {
                  const newDate = dayjs(calendarViewDate).add(1, 'month').format('YYYY-MM-DD');
                  setCalendarViewDate(newDate);
                }}
              />
            </View>

            {/* Pulsante per rimuovere filtro */}
            {selectedDate && (
              <View style={styles.calendarModalFooter}>
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => {
                    setSelectedDate(null);
                    setShowCalendarModal(false);
                  }}
                >
                  <Text style={styles.clearFilterButtonText}>Mostra tutti i task</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E1E5E9',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  // Search bar
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
  },
  // Filtri
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    borderWidth: 1.5,
    borderColor: '#E1E5E9',
  },
  filterChipActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterChipPriorityHigh: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterChipPriorityMedium: {
    backgroundColor: '#333333',
    borderColor: '#333333',
  },
  filterChipPriorityLow: {
    backgroundColor: '#666666',
    borderColor: '#666666',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 4,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    paddingBottom: 16,
  },
  clearDateButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 12,
    backgroundColor: '#E5F1FF',
    borderRadius: 20,
  },
  clearDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#8E8E93',
    marginVertical: 2,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  categoryListContainer: {
    paddingHorizontal: 0, // Categories have their own margins
  },
  categoryCardWrapper: {
    marginBottom: 0,
  },
  // Stili per categorie/note (mantieni per retrocompatibilità)
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5F1FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  // Stili per il pulsante calendario
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stili per l'indicatore data selezionata
  selectedDateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
  },
  // Stili per il modal calendario
  calendarModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  calendarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
  },
  calendarGridContainer: {
    flex: 1,
    padding: 20,
  },
  calendarModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  clearFilterButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearFilterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  // Stili per le category card personalizzate nella chat
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: '#E1E5E9',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  categoryImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'System',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
    fontFamily: 'System',
  },
  categoryMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryTaskCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryTaskCountText: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'System',
  },
  categorySharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categorySharedText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default VisualizationModal;
