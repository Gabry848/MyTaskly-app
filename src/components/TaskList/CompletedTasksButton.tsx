import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CompletedTasksButtonProps {
  count: number;
  onPress: () => void;
}

export const CompletedTasksButton: React.FC<CompletedTasksButtonProps> = ({ count, onPress }) => {
  const insets = useSafeAreaInsets();

  if (count === 0) return null;

  return (
    <TouchableOpacity
      style={[styles.container, { bottom: 20 + insets.bottom }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.inner}>
        <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
        <Text style={styles.text}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  inner: {
    backgroundColor: '#000000',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'System',
  },
});
