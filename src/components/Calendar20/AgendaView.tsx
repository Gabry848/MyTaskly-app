import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { CalendarTask } from './types';
import { useTranslation } from 'react-i18next';

const INITIAL_DAYS = 30;
const LOAD_MORE_DAYS = 30;

interface AgendaViewProps {
  currentDate: dayjs.Dayjs;
  tasks: CalendarTask[];
  onDatePress: (date: dayjs.Dayjs) => void;
  onTaskPress: (task: CalendarTask) => void;
  onToggleComplete: (task: CalendarTask) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

interface AgendaSection {
  title: string;
  date: dayjs.Dayjs;
  isToday: boolean;
  data: CalendarTask[];
}

const AgendaView: React.FC<AgendaViewProps> = ({
  currentDate,
  tasks,
  onDatePress,
  onTaskPress,
  onToggleComplete,
}) => {
  const { t } = useTranslation();
  const [daysToShow, setDaysToShow] = useState(INITIAL_DAYS);

  const sections = useMemo((): AgendaSection[] => {
    const today = dayjs();
    const result: AgendaSection[] = [];

    for (let i = 0; i < daysToShow; i++) {
      const day = currentDate.add(i, 'day');
      const dayStr = day.format('YYYY-MM-DD');
      const dayTasks = tasks.filter(task => {
        return (
          day.isSame(task.startDayjs, 'day') ||
          day.isSame(task.endDayjs, 'day') ||
          (day.isAfter(task.startDayjs, 'day') && day.isBefore(task.endDayjs, 'day'))
        );
      });

      // Sort by time
      const sorted = [...dayTasks].sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return a.startDayjs.valueOf() - b.startDayjs.valueOf();
      });

      const isToday = day.isSame(today, 'day');
      const title = isToday
        ? `${t('calendar20.today')} - ${day.format('ddd, D MMM')}`
        : day.format('ddd, D MMMM YYYY');

      result.push({
        title,
        date: day,
        isToday,
        data: sorted.length > 0 ? sorted : [{ _empty: true } as any],
      });
    }

    return result;
  }, [currentDate, tasks, daysToShow, t]);

  const loadMore = useCallback(() => {
    setDaysToShow(prev => prev + LOAD_MORE_DAYS);
  }, []);

  const renderItem = useCallback(({ item, section }: { item: CalendarTask; section: AgendaSection }) => {
    if ((item as any)._empty) {
      return (
        <TouchableOpacity
          style={styles.emptyDay}
          activeOpacity={0.7}
          onPress={() => onDatePress(section.date.hour(12).minute(0).second(0))}
        >
          <Text style={styles.emptyText}>{t('calendar20.noEvents')}</Text>
          <Ionicons name="add-circle-outline" size={20} color="#cccccc" style={{ marginTop: 4 }} />
        </TouchableOpacity>
      );
    }

    const isCompleted = item.status?.toLowerCase() === 'completato' || item.status?.toLowerCase() === 'completed';
    const timeStr = item.isAllDay
      ? t('calendar20.allDay')
      : `${item.startDayjs.format('HH:mm')} - ${item.endDayjs.format('HH:mm')}`;

    // Format duration from server data if available
    const durationStr = (() => {
      const mins = item.duration_minutes;
      if (!mins || mins <= 0) return null;
      if (mins < 60) return `${mins} min`;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (m === 0) return h === 1 ? '1 ora' : `${h} ore`;
      return `${h}h ${m}min`;
    })();

    return (
      <TouchableOpacity
        style={styles.taskRow}
        activeOpacity={0.7}
        onPress={() => onTaskPress(item)}
      >
        <TouchableOpacity
          onPress={() => onToggleComplete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.checkbox}
        >
          <Ionicons
            name={isCompleted ? 'checkbox' : 'square-outline'}
            size={22}
            color={isCompleted ? '#999' : item.displayColor}
          />
        </TouchableOpacity>

        <View style={[styles.colorDot, { backgroundColor: item.displayColor }]} />

        <View style={styles.taskContent}>
          <Text
            style={[styles.taskTitle, isCompleted && styles.completedTitle]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={styles.taskTimeRow}>
            <Text style={styles.taskTime}>{timeStr}</Text>
            {durationStr && (
              <View style={styles.durationBadge}>
                <Ionicons name="hourglass-outline" size={12} color="#666" />
                <Text style={styles.durationText}>{durationStr}</Text>
              </View>
            )}
          </View>
        </View>

        {item.category_name && (
          <Text style={[styles.categoryBadge, { color: item.displayColor }]} numberOfLines={1}>
            {item.category_name}
          </Text>
        )}
      </TouchableOpacity>
    );
  }, [onTaskPress, onToggleComplete, t]);

  const renderSectionHeader = useCallback(({ section }: { section: AgendaSection }) => (
    <View style={[styles.sectionHeader, section.isToday && styles.todayHeader]}>
      <Text style={[styles.sectionTitle, section.isToday && styles.todayTitle]}>
        {section.title}
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => onDatePress(section.date.hour(12).minute(0).second(0))}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="add-circle-outline" size={24} color="#000000" />
      </TouchableOpacity>
    </View>
  ), [onDatePress]);

  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={(item, index) => item.task_id || item.id || `empty-${index}`}
      stickySectionHeadersEnabled={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
          <Ionicons name="chevron-down" size={20} color="#000000" />
          <Text style={styles.loadMoreText}>Load more</Text>
        </TouchableOpacity>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 80,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  todayHeader: {
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '300',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  todayTitle: {
    color: '#000000',
    fontWeight: '500',
  },
  addButton: {
    padding: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 14,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  taskTime: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'System',
    marginTop: 4,
  },
  categoryBadge: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'System',
    maxWidth: 90,
  },
  emptyDay: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#cccccc',
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
    fontFamily: 'System',
  },
  taskTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'System',
    fontWeight: '400',
  },
});

export default React.memo(AgendaView);
