import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from './styles';

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  color?: string;
}

export const FilterChip = ({ 
  label, 
  isSelected, 
  onPress, 
  color = '#10e0e0' 
}: FilterChipProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        isSelected && { backgroundColor: color, borderColor: color }
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.filterChipText,
        isSelected && { color: 'white' }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};
