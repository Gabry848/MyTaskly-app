import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { CalendarTask, OverlapColumn } from './types';
import TimeBlock from './TimeBlock';
import EventChip from './EventChip';
import { useTranslation } from 'react-i18next';

dayjs.extend(isoWeek);

const TIME_LABEL_WIDTH = 44;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - TIME_LABEL_WIDTH - 16) / 7;
const MIN_HOUR_HEIGHT = 40;
const MAX_HOUR_HEIGHT = 140;
const DEFAULT_HOUR_HEIGHT = 64;

interface WeekViewProps {
  currentDate: dayjs.Dayjs;
  tasks: CalendarTask[];
  onDatePress: (date: dayjs.Dayjs) => void;
  onTaskPress: (task: CalendarTask) => void;
  onTaskLongPress?: (task: CalendarTask) => void;
  onToggleComplete: (task: CalendarTask) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

function computeOverlapColumns(tasks: CalendarTask[]): OverlapColumn[] {
  if (tasks.length === 0) return [];
  const sorted = [...tasks].sort((a, b) => {
    const diff = a.startDayjs.valueOf() - b.startDayjs.valueOf();
    return diff !== 0 ? diff : b.durationMinutes - a.durationMinutes;
  });
  const columns: OverlapColumn[] = [];
  const endTimes: number[] = [];
  for (const task of sorted) {
    const start = task.startDayjs.valueOf();
    let placed = false;
    for (let col = 0; col < endTimes.length; col++) {
      if (start >= endTimes[col]) {
        endTimes[col] = task.endDayjs.valueOf();
        columns.push({ task, column: col, totalColumns: 0 });
        placed = true;
        break;
      }
    }
    if (!placed) {
      endTimes.push(task.endDayjs.valueOf());
      columns.push({ task, column: endTimes.length - 1, totalColumns: 0 });
    }
  }
  for (let i = 0; i < columns.length; i++) {
    const e = columns[i];
    const s = e.task.startDayjs.valueOf();
    const en = e.task.endDayjs.valueOf();
    let maxCol = e.column;
    for (let j = 0; j < columns.length; j++) {
      if (i === j) continue;
      const o = columns[j];
      if (o.task.startDayjs.valueOf() < en && o.task.endDayjs.valueOf() > s) {
        maxCol = Math.max(maxCol, o.column);
      }
    }
    e.totalColumns = maxCol + 1;
  }
  return columns;
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  tasks,
  onDatePress,
  onTaskPress,
  onTaskLongPress,
  onToggleComplete,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [hourHeight, setHourHeight] = useState(DEFAULT_HOUR_HEIGHT);

  // Pinch-to-zoom
  const initialDistance = useRef(0);
  const initialHeight = useRef(DEFAULT_HOUR_HEIGHT);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gs) => {
        // 2-finger pinch
        if (evt.nativeEvent.touches?.length === 2) return true;
        // Horizontal swipe
        return Math.abs(gs.dx) > 20 && Math.abs(gs.dy) < 20;
      },
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches?.length === 2) {
          const t1 = evt.nativeEvent.touches[0];
          const t2 = evt.nativeEvent.touches[1];
          initialDistance.current = Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);
          initialHeight.current = hourHeight;
        }
      },
      onPanResponderMove: (evt) => {
        if (evt.nativeEvent.touches?.length === 2) {
          const t1 = evt.nativeEvent.touches[0];
          const t2 = evt.nativeEvent.touches[1];
          const dist = Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);
          const scale = dist / (initialDistance.current || 1);
          const newHeight = Math.min(MAX_HOUR_HEIGHT, Math.max(MIN_HOUR_HEIGHT, initialHeight.current * scale));
          setHourHeight(newHeight);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) > 60 && Math.abs(gs.dy) < 40) {
          if (gs.dx > 0) onSwipeRight();
          else onSwipeLeft();
        }
      },
    })
  ).current;

  // Week days
  const weekDays = useMemo(() => {
    const startOfWeek = currentDate.startOf('isoWeek');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
  }, [currentDate]);

  // All-day tasks per day
  const allDayTasksByDay = useMemo(() => {
    return weekDays.map(day => {
      return tasks.filter(task => {
        if (!task.isAllDay) return false;
        // All-day tasks can span multiple days
        return (
          day.isSame(task.startDayjs, 'day') ||
          day.isSame(task.endDayjs, 'day') ||
          (day.isAfter(task.startDayjs, 'day') && day.isBefore(task.endDayjs, 'day'))
        );
      });
    });
  }, [weekDays, tasks]);

  const hasAllDay = allDayTasksByDay.some(d => d.length > 0);

  // Timed tasks per day - only show on start day
  const timedTasksByDay = useMemo(() => {
    return weekDays.map(day => {
      const dayTasks = tasks.filter(task => {
        if (task.isAllDay) return false;
        // Regular timed tasks only show on their start day
        return day.isSame(task.startDayjs, 'day');
      });
      return computeOverlapColumns(dayTasks);
    });
  }, [weekDays, tasks]);

  // Scroll to current time
  useEffect(() => {
    const now = dayjs();
    const offset = Math.max(0, (now.hour() - 1) * hourHeight);
    setTimeout(() => scrollRef.current?.scrollTo({ y: offset, animated: false }), 100);
  }, [currentDate, hourHeight]);

  const now = dayjs();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={styles.headerRow}>
        <View style={{ width: TIME_LABEL_WIDTH }} />
        {weekDays.map((day, i) => {
          const isToday = day.isSame(now, 'day');
          return (
            <View key={i} style={[styles.dayHeader, { width: COLUMN_WIDTH }]}>
              <Text style={[styles.dayName, isToday && styles.todayColor]}>
                {day.format('ddd').toUpperCase()}
              </Text>
              <View style={[styles.dateCircle, isToday && styles.todayCircle]}>
                <Text style={[styles.dateNum, isToday && styles.todayDateNum]}>
                  {day.date()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* All-day strip */}
      {hasAllDay && (
        <View style={styles.allDayRow}>
          <View style={[styles.allDayLabel, { width: TIME_LABEL_WIDTH }]}>
            <Text style={styles.allDayLabelText}>{t('calendar20.allDay')}</Text>
          </View>
          {weekDays.map((day, i) => (
            <View key={i} style={[styles.allDayCell, { width: COLUMN_WIDTH }]}>
              {allDayTasksByDay[i].map(task => (
                <EventChip key={task.task_id || task.id} task={task} onPress={onTaskPress} />
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Time grid */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        {...panResponder.panHandlers}
      >
        <View style={styles.gridContainer}>
          {/* Time labels */}
          <View style={{ width: TIME_LABEL_WIDTH }}>
            {hours.map(hour => (
              <View key={hour} style={{ height: hourHeight, justifyContent: 'flex-start' }}>
                <Text style={styles.timeLabel}>{hour.toString().padStart(2, '0')}:00</Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const isToday = day.isSame(now, 'day');
            const currentTimeTop = isToday ? (now.hour() + now.minute() / 60) * hourHeight : -1;

            return (
              <View
                key={dayIndex}
                style={[
                  styles.dayColumn,
                  { width: COLUMN_WIDTH, height: 24 * hourHeight },
                ]}
              >
                {/* Clickable time slots (every 30 minutes) */}
                {hours.map(hour => [0, 30].map(minute => {
                  const slotTime = day.hour(hour).minute(minute).second(0);
                  return (
                    <TouchableOpacity
                      key={`${hour}-${minute}`}
                      style={[styles.clickableSlot, { top: (hour + minute / 60) * hourHeight, height: hourHeight / 2 }]}
                      activeOpacity={0.1}
                      onPress={() => onDatePress(slotTime)}
                    />
                  );
                }))}

                {/* Hour lines */}
                {hours.map(hour => (
                  <View
                    key={hour}
                    style={[styles.hourLine, { top: hour * hourHeight }]}
                    pointerEvents="none"
                  />
                ))}

                {/* Time blocks */}
                {timedTasksByDay[dayIndex].map(({ task, column, totalColumns }) => (
                  <TimeBlock
                    key={task.task_id || task.id}
                    task={task}
                    hourHeight={hourHeight}
                    column={column}
                    totalColumns={totalColumns}
                    columnWidth={COLUMN_WIDTH - 2}
                    onPress={onTaskPress}
                    onLongPress={onTaskLongPress}
                    onToggleComplete={onToggleComplete}
                  />
                ))}

                {/* Current time */}
                {isToday && currentTimeTop >= 0 && (
                  <View style={[styles.currentTimeLine, { top: currentTimeTop }]} pointerEvents="none">
                    <View style={styles.currentTimeDot} />
                    <View style={styles.currentTimeBar} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  dayHeader: {
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'System',
  },
  todayColor: {
    color: '#007AFF',
  },
  dateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  todayCircle: {
    backgroundColor: '#007AFF',
  },
  dateNum: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
  },
  todayDateNum: {
    color: '#ffffff',
    fontWeight: '600',
  },
  allDayRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#fafafa',
  },
  allDayLabel: {
    justifyContent: 'center',
  },
  allDayLabelText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'System',
  },
  allDayCell: {
    paddingHorizontal: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  dayColumn: {
    position: 'relative',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#f0f0f0',
  },
  clickableSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e1e5e9',
  },
  timeLabel: {
    fontSize: 11,
    color: '#999999',
    fontFamily: 'System',
    marginTop: -5,
  },
  currentTimeLine: {
    position: 'absolute',
    left: -2,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
  },
  currentTimeBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#007AFF',
  },
});

export default React.memo(WeekView);
