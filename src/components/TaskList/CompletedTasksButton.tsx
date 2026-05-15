import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, elevation } from '../../theme/tokens';

interface CompletedTasksButtonProps {
  count: number;
  onPress: () => void;
}

export const CompletedTasksButton: React.FC<CompletedTasksButtonProps> = ({ count, onPress }) => {
  if (count === 0) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialIcons name="check-circle-outline" size={16} color={colors.textSecondary} />
      <Text style={styles.text}>
        {count} {count === 1 ? 'completato' : 'completati'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
    gap: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
});