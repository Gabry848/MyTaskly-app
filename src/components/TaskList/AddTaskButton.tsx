import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface AddTaskButtonProps {
  onPress: () => void;
}

export const AddTaskButton = ({ onPress }: AddTaskButtonProps) => {
  return (
    <TouchableOpacity style={styles.addButton} onPress={onPress}>
      <Ionicons name="add" size={28} color="#ffffff" />
    </TouchableOpacity>
  );
};
