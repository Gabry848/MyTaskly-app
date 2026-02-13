import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarTask } from './types';

interface TimeBlockProps {
  task: CalendarTask;
  hourHeight: number;
  column: number;
  totalColumns: number;
  columnWidth: number;
  onPress?: (task: CalendarTask) => void;
  onLongPress?: (task: CalendarTask) => void;
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
  onLongPress,
}) => {
  const startHour = task.startDayjs.hour() + task.startDayjs.minute() / 60;
  const height = Math.max((task.durationMinutes / 60) * hourHeight, 24);
  const top = startHour * hourHeight;
  const width = columnWidth / totalColumns - 2;
  const left = column * (columnWidth / totalColumns) + 1;

  const isCompleted = task.status?.toLowerCase() === 'completato' || task.status?.toLowerCase() === 'completed';
  const baseColor = task.displayColor || '#3A3A3C';

  return (
    <View
      style={[
        styles.block,
        {
          top,
          height,
          left,
          width,
        },
        isCompleted && styles.completed,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress?.(task)}
        onLongPress={() => onLongPress?.(task)}
        style={[styles.touchable, { backgroundColor: hexToRgba(baseColor, 0.10) }]}
      >
        <Text style={[styles.title, { color: baseColor }, isCompleted && styles.completedText]} numberOfLines={1}>
          {task.title}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
  },
  touchable: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  completed: {
    opacity: 0.4,
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
});

export default React.memo(TimeBlock);
