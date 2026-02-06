import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarTask } from './types';

interface TimeBlockProps {
  task: CalendarTask;
  hourHeight: number;
  column: number;
  totalColumns: number;
  columnWidth: number;
  onPress?: (task: CalendarTask) => void;
  onToggleComplete?: (task: CalendarTask) => void;
}

const TimeBlock: React.FC<TimeBlockProps> = ({
  task,
  hourHeight,
  column,
  totalColumns,
  columnWidth,
  onPress,
  onToggleComplete,
}) => {
  const startHour = task.startDayjs.hour() + task.startDayjs.minute() / 60;
  const height = Math.max((task.durationMinutes / 60) * hourHeight, 20);
  const top = startHour * hourHeight;
  const width = columnWidth / totalColumns - 2;
  const left = column * (columnWidth / totalColumns) + 1;

  const isCompleted = task.status?.toLowerCase() === 'completato' || task.status?.toLowerCase() === 'completed';
  const bgColor = task.displayColor || '#007AFF';

  const startTime = task.startDayjs.format('HH:mm');
  const endTime = task.endDayjs.format('HH:mm');
  const showEndTime = height > 35;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress?.(task)}
      style={[
        styles.block,
        {
          top,
          height,
          left,
          width,
          backgroundColor: bgColor,
        },
        isCompleted && styles.completed,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleComplete?.(task);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={styles.checkboxArea}
          >
            <Ionicons
              name={isCompleted ? 'checkbox' : 'square-outline'}
              size={14}
              color="#ffffff"
            />
          </TouchableOpacity>
          <Text style={[styles.title, isCompleted && styles.completedText]} numberOfLines={1}>
            {task.title}
          </Text>
        </View>
        {showEndTime && (
          <Text style={styles.time}>{startTime} - {endTime}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(0,0,0,0.15)',
  },
  completed: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxArea: {
    marginRight: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'System',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  time: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'System',
    marginTop: 1,
  },
});

export default React.memo(TimeBlock);
