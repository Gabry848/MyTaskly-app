import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Modal,
  SafeAreaView,
  Button,
} from "react-native";
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Badge from './Badge'; // Importa il componente Badge

type AddTaskButtonProps = {
  onSave?: (
    title: string,
    description: string,
    dueDate: string,
    priority: number
  ) => void;
};

const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onSave }) => {
  const [formVisible, setFormVisible] = useState(false);
  const animationValue = useSharedValue(0);
  const [priority, setPriority] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string>("");

  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);

  const toggleForm = () => {
    setFormVisible(true);
    animationValue.value = withSpring(1, { damping: 12 });
  };

  const handleCancel = () => {
    animationValue.value = withSpring(0, { damping: 12 });
    setTimeout(() => setFormVisible(false), 300);
  };

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    setDueDate(currentDate.toISOString().split('T')[0]);
  };

  const showMode = (currentMode: 'date' | 'time') => {
    DateTimePickerAndroid.open({
      value: date,
      onChange,
      mode: currentMode,
      is24Hour: true,
    });
  };

  const showDatepicker = () => {
    showMode('date');
  };

  const showTimepicker = () => {
    showMode('time');
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animationValue.value }],
    opacity: animationValue.value,
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={toggleForm}>
        <Text style={styles.addButtonText}>
          {formVisible ? "Close" : "Add Task"}
        </Text>
      </TouchableOpacity>

      <Modal visible={formVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.formContainer, animatedStyle]}>
            <KeyboardAvoidingView behavior="padding" style={styles.formContent}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter task title"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter task description"
                multiline
                value={description}
                onChangeText={setDescription}
              />
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Es. 2023-12-31"
                  value={dueDate}
                  onChangeText={setDueDate}
                />
                <TouchableOpacity
                  style={{
                    marginLeft: 8,
                    padding: 8,
                    backgroundColor: "#007BFF",
                    borderRadius: 4,
                  }}
                  onPress={showDatepicker} // Mostra il DatePicker
                >
                  <Text style={{ color: "#FFF" }}>Set Date</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityContainer}>
                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    priority === 1 && styles.selectedPriority,
                  ]}
                  onPress={() => setPriority(1)}
                >
                  <Text style={styles.priorityText}>Bassa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    priority === 2 && styles.selectedPriority,
                  ]}
                  onPress={() => setPriority(2)}
                >
                  <Text style={styles.priorityText}>Media</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    priority === 3 && styles.selectedPriority,
                  ]}
                  onPress={() => setPriority(3)}
                >
                  <Text style={styles.priorityText}>Alta</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => {
                    if (dueDate) {
                      setFormVisible(false);
                      animationValue.value = withSpring(0, { damping: 12 });
                      onSave?.(title, description, dueDate, priority);
                    }
                  }}
                >
                  <Text style={styles.submitButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "80%",
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    overflow: "hidden",
    padding: 16,
  },
  formContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  priorityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  priorityButton: {
    borderWidth: 1,
    borderColor: "#777",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  selectedPriority: {
    backgroundColor: "#007BFF",
    borderColor: "#007BFF",
  },
  priorityText: {
    fontSize: 16,
    color: "#333",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: "#28A745",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#DC3545",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
  },
  cancelButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddTaskButton;
