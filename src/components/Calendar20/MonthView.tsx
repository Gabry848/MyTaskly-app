import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { CalendarTask, DayData } from './types';
import EventChip from './EventChip';
import { useTranslation } from 'react-i18next';

dayjs.extend(isoWeek);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 32) / 7;
const MAX_CHIPS = 2;

interface MonthViewProps {
  currentDate: dayjs.Dayjs;
  tasks: CalendarTask[];
  onDatePress: (date: dayjs.Dayjs) => void;
  onTaskPress: (task: CalendarTask) => void;
  onTaskLongPress?: (task: CalendarTask) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  tasks,
  onDatePress,
  onTaskPress,
  onTaskLongPress,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const { t } = useTranslation();

  const swipeRef = useRef({ x: 0, swiped: false });
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 15 && Math.abs(gs.dy) < 30,
      onPanResponderGrant: (_, gs) => {
        swipeRef.current = { x: gs.x0, swiped: false };
      },
      onPanResponderRelease: (_, gs) => {
        if (swipeRef.current.swiped) return;
        if (gs.dx > 60) {
          swipeRef.current.swiped = true;
          onSwipeRight();
        } else if (gs.dx < -60) {
          swipeRef.current.swiped = true;
          onSwipeLeft();
        }
      },
    })
  ).current;

  const weeks = useMemo(() => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    // Start from Monday of the week containing the 1st
    const startDate = startOfMonth.startOf('isoWeek');
    // End on Sunday of the week containing the last day
    const endDate = endOfMonth.endOf('isoWeek');

    const today = dayjs();
    const result: DayData[][] = [];
    let current = startDate;

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      const week: DayData[] = [];
      for (let i = 0; i < 7; i++) {
        const dateStr = current.format('YYYY-MM-DD');
        const dayTasks = tasks.filter(task => {
          if (!task.endDayjs && !task.startDayjs) return false;
          // Multi-day/all-day tasks span across days
          if (task.isMultiDay || task.isAllDay) {
            return (
              current.isSame(task.startDayjs, 'day') ||
              current.isSame(task.endDayjs, 'day') ||
              (current.isAfter(task.startDayjs, 'day') && current.isBefore(task.endDayjs, 'day'))
            );
          }
          // Regular tasks only show on their start day
          return current.isSame(task.startDayjs, 'day');
        });

        week.push({
          date: current,
          dateString: dateStr,
          isCurrentMonth: current.month() === currentDate.month(),
          isToday: current.isSame(today, 'day'),
          tasks: dayTasks,
        });
        current = current.add(1, 'day');
      }
      result.push(week);
    }
    return result;
  }, [currentDate, tasks]);

  const dayHeaders = useMemo(() => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(d => t(`calendar.days.${d}`));
  }, [t]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Day headers */}
      <View style={styles.headerRow}>
        {dayHeaders.map((day, i) => (
          <View key={i} style={styles.headerCell}>
            <Text style={[styles.headerText, (i === 5 || i === 6) && styles.weekendHeader]}>
              {day.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>

      {/* Week rows */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            const extraCount = Math.max(0, day.tasks.length - MAX_CHIPS);
            return (
              <TouchableOpacity
                key={day.dateString}
                style={styles.dayCell}
                activeOpacity={0.6}
                onPress={() => onDatePress(day.date)}
              >
                <View style={[styles.dateCircle, day.isToday && styles.todayCircle]}>
                  <Text
                    style={[
                      styles.dateText,
                      !day.isCurrentMonth && styles.otherMonthText,
                      day.isToday && styles.todayText,
                      (di === 5 || di === 6) && day.isCurrentMonth && styles.weekendText,
                    ]}
                  >
                    {day.date.date()}
                  </Text>
                </View>
                <View style={styles.chipsContainer}>
                  {day.tasks.slice(0, MAX_CHIPS).map(task => (
                    <EventChip
                      key={task.task_id || task.id}
                      task={task}
                      onPress={onTaskPress}
                      onLongPress={onTaskLongPress}
                    />
                  ))}
                  {extraCount > 0 && (
                    <Text style={styles.moreText}>
                      {`+${extraCount}`}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  headerCell: {
    width: DAY_WIDTH,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'System',
  },
  weekendHeader: {
    color: '#999999',
  },
  weekRow: {
    flexDirection: 'row',
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 2,
  },
  dayCell: {
    width: DAY_WIDTH,
    paddingTop: 6,
    paddingHorizontal: 1,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  todayCircle: {
    backgroundColor: '#007AFF',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
  },
  otherMonthText: {
    color: '#cccccc',
  },
  todayText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  weekendText: {
    color: '#999999',
  },
  chipsContainer: {
    flex: 1,
  },
  moreText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'System',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default React.memo(MonthView);
