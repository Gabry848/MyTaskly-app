import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TaskCountdownService, TaskCountdown } from '../../src/services/TaskCountdownService';

interface TaskCountdownBadgeProps {
  endTime: string | null;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'badge' | 'inline' | 'chip';
}

const TaskCountdownBadge: React.FC<TaskCountdownBadgeProps> = ({
  endTime,
  showIcon = true,
  size = 'medium',
  variant = 'badge',
}) => {
  const [countdown, setCountdown] = useState<TaskCountdown | null>(null);

  useEffect(() => {
    // Calcola il countdown iniziale
    const newCountdown = TaskCountdownService.calculateCountdown(endTime);
    setCountdown(newCountdown);

    // Se ha una scadenza, aggiorna il countdown ogni minuto
    if (endTime) {
      const interval = setInterval(() => {
        setCountdown(TaskCountdownService.calculateCountdown(endTime));
      }, 60000); // Aggiorna ogni minuto

      return () => clearInterval(interval);
    }
  }, [endTime]);

  if (!countdown || countdown.status === 'noDeadline') {
    return null;
  }

  const sizeStyles = {
    small: {
      container: { paddingHorizontal: 6, paddingVertical: 2 },
      text: { fontSize: 11 },
      icon: 14,
    },
    medium: {
      container: { paddingHorizontal: 8, paddingVertical: 4 },
      text: { fontSize: 12 },
      icon: 16,
    },
    large: {
      container: { paddingHorizontal: 10, paddingVertical: 6 },
      text: { fontSize: 13 },
      icon: 18,
    },
  };

  const currentSize = sizeStyles[size];

  if (variant === 'inline') {
    return (
      <View style={styles.inlineContainer}>
        {showIcon && (
          <MaterialIcons
            name={countdown.icon as any}
            size={currentSize.icon}
            color={countdown.color}
            style={{ marginRight: 4 }}
          />
        )}
        <Text
          style={[
            styles.inlineText,
            currentSize.text,
            { color: countdown.color },
          ]}
        >
          {countdown.label}
        </Text>
      </View>
    );
  }

  if (variant === 'chip') {
    return (
      <View
        style={[
          styles.chipContainer,
          currentSize.container,
          { backgroundColor: `${countdown.color}20`, borderColor: countdown.color },
        ]}
      >
        {showIcon && (
          <MaterialIcons
            name={countdown.icon as any}
            size={currentSize.icon}
            color={countdown.color}
            style={{ marginRight: 4 }}
          />
        )}
        <Text
          style={[
            styles.chipText,
            currentSize.text,
            { color: countdown.color },
          ]}
        >
          {countdown.label}
        </Text>
      </View>
    );
  }

  // Default: badge variant
  return (
    <View
      style={[
        styles.badgeContainer,
        currentSize.container,
        { backgroundColor: countdown.color },
      ]}
    >
      {showIcon && (
        <MaterialIcons
          name={countdown.icon as any}
          size={currentSize.icon}
          color="#fff"
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[styles.badgeText, currentSize.text]}>
        {countdown.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
  },
  chipText: {
    fontWeight: '500',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineText: {
    fontWeight: '500',
  },
});

export default TaskCountdownBadge;
