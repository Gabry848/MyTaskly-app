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

/**
 * Converts a hex color to an rgba string with the given alpha.
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  const height = Math.max((task.durationMinutes / 60) * hourHeight, 24);
  const top = startHour * hourHeight;
  const width = columnWidth / totalColumns - 2;
  const left = column * (columnWidth / totalColumns) + 1;

  const isCompleted = task.status?.toLowerCase() === 'completato' || task.status?.toLowerCase() === 'completed';
  const baseColor = task.displayColor || '#3A3A3C';

  const startTime = task.startDayjs.format('HH:mm');
  const endTime = task.endDayjs.format('HH:mm');
  const showEndTime = height > 40;

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
          backgroundColor: hexToRgba(baseColor, 0.10),
          borderLeftColor: baseColor,
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
              color={baseColor}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: baseColor }, isCompleted && styles.completedText]} numberOfLines={1}>
            {task.title}
          </Text>
        </View>
        {showEndTime && (
          <Text style={[styles.time, { color: hexToRgba(baseColor, 0.6) }]}>{startTime} - {endTime}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
    borderLeftWidth: 3,
  },
  completed: {
    opacity: 0.4,
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
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'System',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  time: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 2,
  },
});

export default React.memo(TimeBlock);
