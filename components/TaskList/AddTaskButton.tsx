import React from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { styles } from './styles';

interface AddTaskButtonProps {
  onPress: () => void;
}

export const AddTaskButton = ({ onPress }: AddTaskButtonProps) => {
  return (
    <TouchableOpacity style={styles.addButton} onPress={onPress}>
      <Image 
        source={require('../../src/assets/plus.png')} 
        style={styles.addButtonIcon} 
      />
    </TouchableOpacity>
  );
};
