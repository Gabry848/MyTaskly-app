import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from './styles';

export interface ActiveFiltersProps {
  importanceFilter: string;
  deadlineFilter: string;
  onClearImportanceFilter: () => void;
  onClearDeadlineFilter: () => void;
}

export const ActiveFilters = ({ 
  importanceFilter, 
  deadlineFilter, 
  onClearImportanceFilter, 
  onClearDeadlineFilter 
}: ActiveFiltersProps) => {
  
  // Se non c'è nessun filtro attivo, non renderizzare il componente
  if (importanceFilter === 'Tutte' && deadlineFilter === 'Tutte') {
    return null;
  }
  
  return (
    <View style={styles.activeFilterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.activeFilterChips}
      >
        {importanceFilter !== 'Tutte' && (
          <TouchableOpacity 
            style={styles.activeChip}
            onPress={onClearImportanceFilter}
          >
            <Text style={styles.activeChipText}>
              {importanceFilter}
            </Text>
          </TouchableOpacity>
        )}
        
        {deadlineFilter !== 'Tutte' && (
          <TouchableOpacity 
            style={styles.activeChip}
            onPress={onClearDeadlineFilter}
          >
            <Text style={styles.activeChipText}>
              {deadlineFilter}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};
