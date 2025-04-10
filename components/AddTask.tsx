import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { addTaskToList } from "../src/navigation/screens/TaskList";

type AddTaskProps = {
  visible: boolean;
  onClose: () => void;
  onSave?: (
    title: string,
    description: string,
    dueDate: string,
    priority: number
  ) => void;
  categoryName?: string;
};

const AddTask: React.FC<AddTaskProps> = ({ visible, onClose, onSave, categoryName }) => {
  const animationValue = useSharedValue(0);
  const [priority, setPriority] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [titleError, setTitleError] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");
  const [date, setDate] = useState(new Date());

  // Gestisce l'animazione all'apertura del modale
  React.useEffect(() => {
    if (visible) {
      animationValue.value = withSpring(1, { damping: 12 });
    } else {
      animationValue.value = withSpring(0, { damping: 12 });
    }
  }, [visible]);

  const handleCancel = () => {
    // Prima animiamo la chiusura, poi chiamiamo onClose
    animationValue.value = withSpring(0, { damping: 12 });
    setTimeout(() => onClose(), 300);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setSelectedDateTime(null);
    setPriority(1);
    setTitleError("");
    setDateError("");
  };

  const handleSave = () => {
    let hasError = false;

    if (!title.trim()) {
      setTitleError("Il titolo è obbligatorio");
      hasError = true;
    }

    if (!dueDate) {
      setDateError("La data di scadenza è obbligatoria");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const priorityString = priority === 1 ? "Bassa" : priority === 2 ? "Media" : "Alta";

    const taskObject = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim() || "", // Assicurarsi che description non sia mai null
      end_time: dueDate,
      start_time: new Date().toISOString(),
      priority: priorityString,
      status: "In sospeso", // Aggiornato per coerenza con altri componenti
      category_name: categoryName || "", // Aggiungere il nome della categoria
      user: "", // Campo richiesto dal server
      completed: false
    };

    try {
      if (onSave) {
        onSave(title, description, dueDate, priority);
      }

      if (categoryName && (!onSave || (onSave && categoryName))) {
        console.log("Direct call to addTaskToList from AddTask with category:", categoryName);
        addTaskToList(taskObject, categoryName);
      }
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "Failed to save task");
    } finally {
      resetForm();
      handleCancel();
    }
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
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.formContainer, animatedStyle]}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Aggiungi Task</Text>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            <Text style={styles.inputLabel}>Titolo *</Text>
            <TextInput
              style={[styles.input, titleError ? styles.inputError : null]}
              placeholder="Inserisci il titolo"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (text.trim()) setTitleError("");
              }}
            />
            {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}

            <Text style={styles.inputLabel}>Descrizione</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Inserisci la descrizione"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
            
            <Text style={styles.inputLabel}>Data e ora di scadenza</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.dateButton]}
                onPress={showDatepicker}
              >
                <Text style={styles.datePickerText}>
                  {selectedDateTime ? selectedDateTime.toLocaleDateString('it-IT') : 'Seleziona data'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.datePickerButton, styles.timeButton]}
                onPress={showTimepicker}
              >
                <Text style={styles.datePickerText}>
                  {selectedDateTime ? selectedDateTime.toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'}) : 'Seleziona ora'}
                </Text>
                <Ionicons name="time-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}

            <Text style={styles.inputLabel}>Priorità</Text>
            <View style={styles.priorityContainer}>
              <TouchableOpacity
                style={[
                  styles.priorityButton,
                  styles.priorityButtonLow,
                  priority === 1 && styles.priorityButtonActive
                ]}
                onPress={() => setPriority(1)}
              >
                <Text style={[
                  styles.priorityButtonText,
                  priority === 1 && styles.priorityButtonTextActive
                ]}>Bassa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.priorityButton,
                  styles.priorityButtonMedium,
                  priority === 2 && styles.priorityButtonActive
                ]}
                onPress={() => setPriority(2)}
              >
                <Text style={[
                  styles.priorityButtonText,
                  priority === 2 && styles.priorityButtonTextActive
                ]}>Media</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.priorityButton,
                  styles.priorityButtonHigh,
                  priority === 3 && styles.priorityButtonActive
                ]}
                onPress={() => setPriority(3)}
              >
                <Text style={[
                  styles.priorityButtonText,
                  priority === 3 && styles.priorityButtonTextActive
                ]}>Alta</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.formFooter}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Salva</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#10e0e0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContent: {
    padding: 16,
  },
  formFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
  },
  inputError: {
    borderColor: "#FF5252",
    backgroundColor: "#FFF8F8",
  },
  errorText: {
    color: "#FF5252",
    fontSize: 12,
    marginBottom: 8,
    marginTop: -8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateButton: {
    flex: 3,
    marginRight: 8,
  },
  timeButton: {
    flex: 2,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
  },
  priorityButtonLow: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  priorityButtonMedium: {
    borderColor: '#FFC107',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  priorityButtonHigh: {
    borderColor: '#FF5252',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  priorityButtonActive: {
    borderWidth: 2,
  },
  priorityButtonText: {
    fontWeight: '600',
  },
  priorityButtonTextActive: {
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#10e0e0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddTask;