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

  const renderItem = useCallback(({ item }: { item: CalendarTask }) => {
    if ((item as any)._empty) {
      return (
        <View style={styles.emptyDay}>
          <Text style={styles.emptyText}>{t('calendar20.noEvents')}</Text>
        </View>
      );
    }

    const isCompleted = item.status?.toLowerCase() === 'completato' || item.status?.toLowerCase() === 'completed';
    const timeStr = item.isAllDay
      ? t('calendar20.allDay')
      : `${item.startDayjs.format('HH:mm')} - ${item.endDayjs.format('HH:mm')}`;

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
            size={20}
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
          <Text style={styles.taskTime}>{timeStr}</Text>
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
    </View>
  ), []);

  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={(item, index) => item.task_id || item.id || `empty-${index}`}
      stickySectionHeadersEnabled={true}
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
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  todayHeader: {
    backgroundColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#333333',
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  todayTitle: {
    color: '#000000',
    fontWeight: '500',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    marginRight: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  taskTime: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'System',
    marginTop: 2,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
    maxWidth: 80,
  },
  emptyDay: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
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
    paddingVertical: 20,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
    fontFamily: 'System',
  },
});

export default React.memo(AgendaView);
