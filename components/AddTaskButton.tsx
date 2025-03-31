import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Modal,
  Image,
} from "react-native";
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

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
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [titleError, setTitleError] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");

  const [date, setDate] = useState(new Date());

  const toggleForm = () => {
    setFormVisible(true);
    animationValue.value = withSpring(1, { damping: 12 });
  };

  const handleCancel = () => {
    animationValue.value = withSpring(0, { damping: 12 });
    setTimeout(() => setFormVisible(false), 300);
  };

  const handleSave = () => {
    let hasError = false;
    
    // Verifica che il titolo esista
    if (!title.trim()) {
      setTitleError("Il titolo è obbligatorio");
      hasError = true;
    }
    
    // Verifica che la data di scadenza sia stata impostata
    if (!dueDate) {
      setDateError("La data di scadenza è obbligatoria");
      hasError = true;
    }
    
    if (hasError) {
      return;
    }
    
    setFormVisible(false);
    animationValue.value = withSpring(0, { damping: 12 });
    onSave?.(title, description, dueDate, priority);
    
    // Reset form
    setTitle("");
    setDescription("");
    setDueDate("");
    setSelectedDateTime(null);
    setPriority(1);
    setTitleError("");
    setDateError("");
  };

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    
    if (selectedDateTime) {
      const newDateTime = new Date(currentDate);
      newDateTime.setHours(selectedDateTime.getHours(), selectedDateTime.getMinutes());
      setSelectedDateTime(newDateTime);
      setDueDate(newDateTime.toISOString());
    } else {
      setSelectedDateTime(currentDate);
      setDueDate(currentDate.toISOString());
    }
    setDateError("");
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || date;
    
    if (selectedDateTime) {
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setHours(currentTime.getHours(), currentTime.getMinutes());
      setSelectedDateTime(newDateTime);
      setDueDate(newDateTime.toISOString());
    } else {
      setSelectedDateTime(currentTime);
      setDueDate(currentTime.toISOString());
    }
    setDateError("");
  };

  const showMode = (currentMode: 'date' | 'time', changeHandler: (event: any, date?: Date) => void) => {
    DateTimePickerAndroid.open({
      value: selectedDateTime || date,
      onChange: changeHandler,
      mode: currentMode,
      is24Hour: true,
    });
  };

  const showDatepicker = () => {
    showMode('date', onChange);
  };

  const showTimepicker = () => {
    showMode('time', onTimeChange);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animationValue.value }],
    opacity: animationValue.value,
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={toggleForm}>
        <Image source={require('../src/assets/plus.png')} style={styles.addButtonIcon} />
      </TouchableOpacity>

      <Modal visible={formVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.formContainer, animatedStyle]}>
            <KeyboardAvoidingView behavior="padding" style={styles.formContent}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={[styles.input, titleError ? styles.inputError : null]}
                placeholder="Enter task title"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (text.trim()) setTitleError("");
                }}
              />
              {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter task description"
                multiline
                value={description}
                onChangeText={setDescription}
              />
              
              <Text style={styles.label}>Due Date & Time</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={showDatepicker}
                >
                  <Text style={styles.dateTimeButtonText}>Set Date</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={showTimepicker}
                >
                  <Text style={styles.dateTimeButtonText}>Set Time</Text>
                </TouchableOpacity>
              </View>
              
              {selectedDateTime && (
                <Text style={styles.selectedDateTime}>
                  {selectedDateTime.toLocaleDateString()} {selectedDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              )}
              
              {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}

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
                  onPress={handleSave}
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
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  addButton: {
    backgroundColor: "#007BFF",
    width: 50,
    height: 50,
    borderRadius: 25,
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
  inputError: {
    borderColor: "#DC3545",
    backgroundColor: "#FFF8F8",
  },
  errorText: {
    color: "#DC3545",
    fontSize: 12,
    marginBottom: 8,
    marginTop: -8,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateTimeButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  dateTimeButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  selectedDateTime: {
    marginBottom: 12,
    backgroundColor: "#E8F0FE",
    padding: 8,
    borderRadius: 4,
    textAlign: "center",
    color: "#333",
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
