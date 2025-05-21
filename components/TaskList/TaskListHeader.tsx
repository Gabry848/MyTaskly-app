import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';

// Assicurati di avere il componente Filter, o importalo dal percorso corretto
// import { Filter } from '...'; // Importa il componente Filter

interface TaskListHeaderProps {
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
        {/* Assicurati di avere il componente Filter */}
        {/* <Filter width={22} height={22} color="#fff" /> */}
        
        {/* Puoi usare questo placeholder finché non trovi il componente Filter */}
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>F</Text>
      </TouchableOpacity>
    </View>
  );
};
