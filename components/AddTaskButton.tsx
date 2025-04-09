import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import AddTask from "./AddTask";

type AddTaskButtonProps = {
  onSave?: (
    title: string,
    description: string,
    dueDate: string,
    priority: number
  ) => void;
  categoryName?: string;
};

const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onSave, categoryName }) => {
  const [formVisible, setFormVisible] = useState(false);

  const toggleForm = () => {
    setFormVisible(true);
  };

  const handleClose = () => {
    setFormVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={toggleForm}>
        <Image source={require('../src/assets/plus.png')} style={styles.addButtonIcon} />
      </TouchableOpacity>

      <AddTask 
        visible={formVisible} 
        onClose={handleClose} 
        onSave={onSave}
        categoryName={categoryName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  addButton: {
    backgroundColor: "#10e0e0",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonIcon: {
    width: 28,
    height: 28,
  },
});

export default AddTaskButton;
