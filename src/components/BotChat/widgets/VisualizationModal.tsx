import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { VisualizationModalProps, TaskListItem } from '../types';
import Category from '../../Category/Category';

/**
 * Modal full-screen per visualizzare liste di task/categorie/note
 * Include calendario in alto (solo per task) e lista scrollabile sotto
 */
const VisualizationModal: React.FC<VisualizationModalProps> = ({
  visible,
  widget,
  onClose,
  onItemPress,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const output = widget.toolOutput;

  if (!output) return null;

  // Determina il tipo di contenuto
  const isTaskList = output.type === 'task_list';
  const isCategoryList = output.type === 'category_list';
  const isNoteList = output.type === 'note_list';

  // Prepara i dati
  const items = isTaskList ? output.tasks : isCategoryList ? output.categories : output.notes;
  const title = isTaskList ? 'Task' : isCategoryList ? 'Categorie' : 'Note';

  // Marca le date sul calendario (solo per task)
  const markedDates = useMemo(() => {
    if (!isTaskList || !output.tasks) return {};

    const marked: any = {};
    output.tasks.forEach((task: TaskListItem) => {
      if (task.end_time) {
        const dateKey = task.end_time.split('T')[0]; // Formato YYYY-MM-DD
        if (!marked[dateKey]) {
          marked[dateKey] = {
            marked: true,
            dots: [{ color: '#007AFF' }],
          };
        }
      }
    });

    // Aggiungi selezione corrente
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#007AFF',
      };
    }

    return marked;
  }, [isTaskList, output.tasks, selectedDate]);

  // Filtra task per data selezionata
  const filteredItems = useMemo(() => {
    if (!selectedDate || !isTaskList || !output.tasks) return items;

    return output.tasks.filter((task: TaskListItem) => {
      if (!task.end_time) return false;
      return task.end_time.startsWith(selectedDate);
    });
  }, [selectedDate, isTaskList, output.tasks, items]);

  const displayItems = selectedDate ? filteredItems : items;

  // Renderizza un singolo item
  const renderItem = (item: any, index: number) => {
    if (isTaskList) {
      const task = item as TaskListItem;
      return (
        <TouchableOpacity
          key={index}
          style={styles.itemCard}
          activeOpacity={0.7}
          onPress={() => onItemPress && onItemPress(task, 'task')}
        >
          <View style={styles.itemIconContainer}>
            <Ionicons
              name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={task.completed ? '#34C759' : '#007AFF'}
            />
          </View>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {task.title}
            </Text>
            {task.end_time && (
              <Text style={styles.itemSubtitle}>
                {new Date(task.end_time).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
            {task.category_name && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{task.category_name}</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
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
        <View key={index} style={styles.categoryCardWrapper}>
          <Category
            title={item.name}
            description={item.description}
            imageUrl={isValidUrl ? validImageUrl : undefined}
            taskCount={item.taskCount || item.task_count || 0}
            categoryId={item.id}
            isShared={item.isShared || false}
            isOwned={item.isOwned !== undefined ? item.isOwned : true}
            ownerName={item.ownerName}
            permissionLevel={item.permissionLevel || "READ_WRITE"}
          />
        </View>
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
          {/* CALENDARIO (solo per task) */}
          {isTaskList && (
            <View style={styles.calendarContainer}>
              <Calendar
                markedDates={markedDates}
                onDayPress={(day) => {
                  setSelectedDate(day.dateString === selectedDate ? null : day.dateString);
                }}
                theme={{
                  todayTextColor: '#007AFF',
                  selectedDayBackgroundColor: '#007AFF',
                  selectedDayTextColor: '#FFFFFF',
                  arrowColor: '#007AFF',
                  monthTextColor: '#000000',
                  textMonthFontSize: 18,
                  textMonthFontWeight: '600',
                }}
                markingType="multi-dot"
              />
              {selectedDate && (
                <Pressable
                  style={styles.clearDateButton}
                  onPress={() => setSelectedDate(null)}
                >
                  <Text style={styles.clearDateText}>Mostra tutti</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* SUMMARY */}
          {output.summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                Totale: {output.summary.total} elementi
              </Text>
              {output.summary.pending !== undefined && (
                <Text style={styles.summaryText}>
                  In sospeso: {output.summary.pending}
                </Text>
              )}
              {output.summary.completed !== undefined && (
                <Text style={styles.summaryText}>
                  Completati: {output.summary.completed}
                </Text>
              )}
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
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
});

export default VisualizationModal;
