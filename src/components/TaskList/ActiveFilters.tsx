import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from './styles';
import { useTranslation } from 'react-i18next';

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

  const { t } = useTranslation();

  // Mappa i filtri italiani ai valori tradotti
  const getTranslatedFilter = (filter: string, type: 'importance' | 'deadline'): string => {
    if (type === 'importance') {
      switch (filter) {
        case 'Alta': return t('taskList.filters.high');
        case 'Media': return t('taskList.filters.medium');
        case 'Bassa': return t('taskList.filters.low');
        default: return filter;
      }
    } else {
      switch (filter) {
        case 'Oggi': return t('taskList.filters.today');
        case 'Domani': return t('taskList.filters.tomorrow');
        case 'Dopodomani': return t('taskList.filters.dayAfterTomorrow');
        case 'Fra 3 giorni': return t('taskList.filters.in3Days');
        case 'Fra 7 giorni': return t('taskList.filters.in7Days');
        case 'Senza scadenza': return t('taskList.filters.noDeadline');
        default: return filter;
      }
    }
  };

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
              {getTranslatedFilter(importanceFilter, 'importance')}
            </Text>
          </TouchableOpacity>
        )}

        {deadlineFilter !== 'Tutte' && (
          <TouchableOpacity
            style={styles.activeChip}
            onPress={onClearDeadlineFilter}
          >
            <Text style={styles.activeChipText}>
              {getTranslatedFilter(deadlineFilter, 'deadline')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};
