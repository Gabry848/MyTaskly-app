import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from './styles';

export interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  color?: string;
}

export const FilterChip = ({ 
  label, 
  isSelected, 
  onPress, 
  color = '#000000' 
}: FilterChipProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        isSelected && { 
          backgroundColor: '#f8f8f8', 
          borderColor: color,
          borderWidth: 2 
        }
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.filterChipText,
        isSelected && { 
          color: color,
          fontWeight: '500'
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};
