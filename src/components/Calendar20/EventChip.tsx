import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CalendarTask } from './types';

interface EventChipProps {
  task: CalendarTask;
  onPress?: (task: CalendarTask) => void;
  isSpanning?: boolean;
  isStart?: boolean;
  isEnd?: boolean;
}

const EventChip: React.FC<EventChipProps> = ({ task, onPress, isSpanning, isStart = true, isEnd = true }) => {
  const bgColor = task.displayColor || '#007AFF';
  const isCompleted = task.status?.toLowerCase() === 'completato' || task.status?.toLowerCase() === 'completed';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(task)}
      style={[
        styles.chip,
        { backgroundColor: bgColor },
        isSpanning && !isStart && styles.spanningLeft,
        isSpanning && !isEnd && styles.spanningRight,
        isCompleted && styles.completed,
      ]}
    >
      <Text style={[styles.chipText, isCompleted && styles.completedText]} numberOfLines={1}>
        {task.title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 1,
    minHeight: 18,
    justifyContent: 'center',
  },
  spanningLeft: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    marginLeft: -1,
  },
  spanningRight: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    marginRight: -1,
  },
  chipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'System',
  },
  completed: {
    opacity: 0.5,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
});

export default React.memo(EventChip);
