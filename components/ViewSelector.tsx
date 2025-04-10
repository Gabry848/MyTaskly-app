import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ViewSelectorProps {
  viewMode: 'categories' | 'calendar';
  onViewChange: (mode: 'categories' | 'calendar') => void;
}

const ViewSelector: React.FC<ViewSelectorProps> = ({ viewMode, onViewChange }) => {
  return (
    <View style={styles.viewSelectorContainer}>
      <TouchableOpacity
        style={[
          styles.viewSelectorButton,
          viewMode === 'categories' && styles.viewSelectorButtonActive
        ]}
        onPress={() => onViewChange('categories')}
      >
        <Ionicons 
          name="list" 
          size={20} 
          color={viewMode === 'categories' ? "#fff" : "#007bff"} 
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
        onPress={() => onViewChange('calendar')}
      >
        <Ionicons 
          name="calendar" 
          size={20} 
          color={viewMode === 'calendar' ? "#fff" : "#007bff"} 
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
    marginVertical: 10,
  },
  viewSelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007bff",
    marginHorizontal: 5,
  },
  viewSelectorButtonActive: {
    backgroundColor: "#007bff",
  },
  viewSelectorText: {
    marginLeft: 5,
    color: "#007bff",
  },
  viewSelectorTextActive: {
    color: "#fff",
  },
});

export default ViewSelector;