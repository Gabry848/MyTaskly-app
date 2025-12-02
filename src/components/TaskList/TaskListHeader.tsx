import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

export interface TaskListHeaderProps {
  title: string;
  onFilterPress: () => void;
}

export const TaskListHeader = ({ title, onFilterPress }: TaskListHeaderProps) => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={onFilterPress}
      >
        <Ionicons name="options-outline" size={22} color="#666666" />
      </TouchableOpacity>
    </View>
  );
};
