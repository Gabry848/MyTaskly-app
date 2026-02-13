import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CalendarTask } from './types';

interface EventChipProps {
  task: CalendarTask;
  onPress?: (task: CalendarTask) => void;
  onLongPress?: (task: CalendarTask) => void;
  isSpanning?: boolean;
  isStart?: boolean;
  isEnd?: boolean;
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

const EventChip: React.FC<EventChipProps> = ({ task, onPress, onLongPress, isSpanning, isStart = true, isEnd = true }) => {
  const baseColor = task.displayColor || '#3A3A3C';
  const isCompleted = task.status?.toLowerCase() === 'completato' || task.status?.toLowerCase() === 'completed';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(task)}
      onLongPress={() => onLongPress?.(task)}
      style={[
        styles.chip,
        {
          backgroundColor: hexToRgba(baseColor, 0.12),
          borderLeftColor: baseColor,
        },
        isSpanning && !isStart && styles.spanningLeft,
        isSpanning && !isEnd && styles.spanningRight,
        isCompleted && styles.completed,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: baseColor },
          isCompleted && styles.completedText,
        ]}
        numberOfLines={1}
      >
        {task.title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 2,
    minHeight: 20,
    justifyContent: 'center',
    borderLeftWidth: 3,
  },
  spanningLeft: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    marginLeft: -1,
    borderLeftWidth: 0,
  },
  spanningRight: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    marginRight: -1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  completed: {
    opacity: 0.4,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
});

export default React.memo(EventChip);
