import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';

interface AddTaskButtonProps {
  onPress: () => void;
}

const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.controlsContainer}
      onPress={onPress}
    >
      <Text style={styles.addButtonText}>Aggiungi</Text>
      <MaterialIcons name="add-task" size={18} color="#000000" style={styles.icon} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0", // Stesso colore del send button di Home20
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20, // Stesso stile dei bottoni di Home20
    borderWidth: 1.5,
    borderColor: "#e1e5e9", // Stesso colore del bordo dell'input di Home20
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addButtonText: {
    color: '#000000', // Nero come Home20
    fontWeight: '400', // Più leggero per coerenza con Home20
    fontSize: 14,
    fontFamily: "System",
  },
  icon: {
    marginLeft: 6,
  },
});

export default AddTaskButton;
