import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
      <Text style={styles.activeFilterText}>Filtri attivi:</Text>
      <View style={styles.activeFilterChips}>
        {importanceFilter !== 'Tutte' && (
          <TouchableOpacity 
            style={styles.activeChip}
            onPress={onClearImportanceFilter}
          >
            <Text style={styles.activeChipText}>
              Importanza: {importanceFilter}
            </Text>
            <Text style={styles.clearFilterButton}>×</Text>
          </TouchableOpacity>
        )}
        
        {deadlineFilter !== 'Tutte' && (
          <TouchableOpacity 
            style={styles.activeChip}
            onPress={onClearDeadlineFilter}
          >
            <Text style={styles.activeChipText}>
              Scadenza: {deadlineFilter}
            </Text>
            <Text style={styles.clearFilterButton}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
