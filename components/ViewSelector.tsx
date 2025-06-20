import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ViewModeType = 'categories' | 'calendar';

interface ViewSelectorProps {
  viewMode: ViewModeType;
  onViewModeChange: (mode: ViewModeType) => void;
}

const ViewSelector: React.FC<ViewSelectorProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <View style={styles.viewSelectorContainer}>
      <TouchableOpacity
        style={[
          styles.viewSelectorButton,
          viewMode === 'categories' && styles.viewSelectorButtonActive
        ]}
        onPress={() => onViewModeChange('categories')}
      >        <Ionicons 
          name="list" 
          size={20} 
          color={viewMode === 'categories' ? "#ffffff" : "#000000"} 
        />
        <Text style={[
          styles.viewSelectorText,
          viewMode === 'categories' && styles.viewSelectorTextActive
        ]}>Categorie</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.viewSelectorButton,
          viewMode === 'calendar' && styles.viewSelectorButtonActive
        ]}
        onPress={() => onViewModeChange('calendar')}
      >        <Ionicons 
          name="calendar" 
          size={20} 
          color={viewMode === 'calendar' ? "#ffffff" : "#000000"} 
        />
        <Text style={[
          styles.viewSelectorText,
          viewMode === 'calendar' && styles.viewSelectorTextActive
        ]}>Calendario</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  viewSelectorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 15, // Aumentato per dare più respiro
    paddingHorizontal: 20,
  },
  viewSelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12, // Aumentato per coerenza con Home20
    paddingHorizontal: 24, // Aumentato per coerenza con Home20
    borderRadius: 30, // Cambiato da 20 a 30 per coerenza con Home20
    borderWidth: 1.5, // Aumentato per coerenza con Home20
    borderColor: "#e1e5e9", // Stesso colore del bordo dell'input di Home20
    marginHorizontal: 8, // Aumentato per più spazio
    backgroundColor: "#ffffff", // Sfondo bianco
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08, // Stesso valore di Home20
    shadowRadius: 12, // Stesso valore di Home20
    elevation: 3, // Stesso valore di Home20
  },
  viewSelectorButtonActive: {
    backgroundColor: "#000000", // Cambiato da #007bff a #000000 per coerenza con Home20
    borderColor: "#000000",
  },
  viewSelectorText: {
    marginLeft: 8, // Aumentato per più spazio
    color: "#000000", // Cambiato da #007bff a #000000 per coerenza con Home20
    fontSize: 16, // Aggiunto per specificare la dimensione
    fontFamily: "System", // Stesso font di Home20
    fontWeight: "400", // Stesso peso di Home20
  },
  viewSelectorTextActive: {
    color: "#ffffff", // Cambiato da #fff a #ffffff per coerenza
    fontWeight: "500", // Leggermente più grassetto quando attivo
  },
});

export default ViewSelector;