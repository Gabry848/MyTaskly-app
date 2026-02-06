import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import dayjs from 'dayjs';
import { CalendarTask, OverlapColumn } from './types';
import TimeBlock from './TimeBlock';
import EventChip from './EventChip';
import { useTranslation } from 'react-i18next';

const HOUR_HEIGHT = 60;
const TIME_LABEL_WIDTH = 48;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = SCREEN_WIDTH - TIME_LABEL_WIDTH - 12;

interface DayViewProps {
  currentDate: dayjs.Dayjs;
  tasks: CalendarTask[];
  onDatePress: (date: dayjs.Dayjs) => void;
  onTaskPress: (task: CalendarTask) => void;
  onToggleComplete: (task: CalendarTask) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

function computeOverlapColumns(tasks: CalendarTask[]): OverlapColumn[] {
  if (tasks.length === 0) return [];

  const sorted = [...tasks].sort((a, b) => {
    const diff = a.startDayjs.valueOf() - b.startDayjs.valueOf();
    if (diff !== 0) return diff;
    return b.durationMinutes - a.durationMinutes;
  });

  const columns: OverlapColumn[] = [];
  const endTimes: number[] = []; // tracks end time per column

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

  // Compute totalColumns for each group of overlapping events
  // Simple approach: set totalColumns to max column + 1 among overlapping peers
  for (let i = 0; i < columns.length; i++) {
    const entry = columns[i];
    const taskStart = entry.task.startDayjs.valueOf();
    const taskEnd = entry.task.endDayjs.valueOf();

    let maxCol = entry.column;
    for (let j = 0; j < columns.length; j++) {
      if (i === j) continue;
      const other = columns[j];
      const otherStart = other.task.startDayjs.valueOf();
      const otherEnd = other.task.endDayjs.valueOf();
      // Overlaps?
      if (otherStart < taskEnd && otherEnd > taskStart) {
        maxCol = Math.max(maxCol, other.column);
      }
    }
    entry.totalColumns = maxCol + 1;
  }

  return columns;
}

const DayView: React.FC<DayViewProps> = ({
  currentDate,
  tasks,
  onTaskPress,
  onToggleComplete,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);

  // Scroll to current time on mount
  useEffect(() => {
    const now = dayjs();
    if (currentDate.isSame(now, 'day')) {
      const offset = Math.max(0, (now.hour() - 1) * HOUR_HEIGHT);
      setTimeout(() => scrollRef.current?.scrollTo({ y: offset, animated: false }), 100);
    } else {
      setTimeout(() => scrollRef.current?.scrollTo({ y: 7 * HOUR_HEIGHT, animated: false }), 100);
    }
  }, [currentDate]);

  const swipeRef = useRef({ swiped: false });
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 20 && Math.abs(gs.dy) < 20,
      onPanResponderGrant: () => {
        swipeRef.current.swiped = false;
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

  const dayTasks = useMemo(() => {
    return tasks.filter(task => {
      return (
        currentDate.isSame(task.startDayjs, 'day') ||
        currentDate.isSame(task.endDayjs, 'day') ||
        (currentDate.isAfter(task.startDayjs, 'day') && currentDate.isBefore(task.endDayjs, 'day'))
      );
    });
  }, [tasks, currentDate]);

  const allDayTasks = useMemo(() => dayTasks.filter(t => t.isAllDay), [dayTasks]);
  const timedTasks = useMemo(() => dayTasks.filter(t => !t.isAllDay), [dayTasks]);
  const overlapColumns = useMemo(() => computeOverlapColumns(timedTasks), [timedTasks]);

  const now = dayjs();
  const isToday = currentDate.isSame(now, 'day');
  const currentTimeTop = isToday ? (now.hour() + now.minute() / 60) * HOUR_HEIGHT : -1;

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* All-day events */}
      {allDayTasks.length > 0 && (
        <View style={styles.allDayContainer}>
          <Text style={styles.allDayLabel}>{t('calendar20.allDay')}</Text>
          <View style={styles.allDayChips}>
            {allDayTasks.map(task => (
              <EventChip key={task.task_id || task.id} task={task} onPress={onTaskPress} />
            ))}
          </View>
        </View>
      )}

      <ScrollView ref={scrollRef} style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {/* Time labels */}
          <View style={styles.timeColumn}>
            {hours.map(hour => (
              <View key={hour} style={[styles.timeSlot, { height: HOUR_HEIGHT }]}>
                <Text style={styles.timeLabel}>
                  {hour.toString().padStart(2, '0')}:00
                </Text>
              </View>
            ))}
          </View>

          {/* Events column */}
          <View style={styles.eventsColumn}>
            {/* Hour grid lines */}
            {hours.map(hour => (
              <View key={hour} style={[styles.hourLine, { top: hour * HOUR_HEIGHT }]} />
            ))}

            {/* Time blocks */}
            {overlapColumns.map(({ task, column, totalColumns }) => (
              <TimeBlock
                key={task.task_id || task.id}
                task={task}
                hourHeight={HOUR_HEIGHT}
                column={column}
                totalColumns={totalColumns}
                columnWidth={COLUMN_WIDTH}
                onPress={onTaskPress}
                onToggleComplete={onToggleComplete}
              />
            ))}

            {/* Current time indicator */}
            {isToday && currentTimeTop >= 0 && (
              <View style={[styles.currentTimeLine, { top: currentTimeTop }]}>
                <View style={styles.currentTimeDot} />
                <View style={styles.currentTimeBar} />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  allDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#fafafa',
  },
  allDayLabel: {
    width: TIME_LABEL_WIDTH - 12,
    fontSize: 10,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'System',
  },
  allDayChips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: 6,
  },
  timeColumn: {
    width: TIME_LABEL_WIDTH,
  },
  timeSlot: {
    justifyContent: 'flex-start',
  },
  timeLabel: {
    fontSize: 11,
    color: '#999999',
    fontFamily: 'System',
    fontWeight: '400',
    marginTop: -6,
  },
  eventsColumn: {
    flex: 1,
    height: 24 * HOUR_HEIGHT,
    position: 'relative',
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e1e5e9',
  },
  currentTimeLine: {
    position: 'absolute',
    left: -6,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EA4335',
  },
  currentTimeBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#EA4335',
  },
});

export default React.memo(DayView);
