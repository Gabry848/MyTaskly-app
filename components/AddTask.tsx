import React, { useState, useEffect } from "react";
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
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { addTaskToList } from "./TaskList/types";
import { getCategories } from '../src/services/taskService';
import dayjs from "dayjs";

type AddTaskProps = {
  visible: boolean;
  onClose: () => void;
  onSave?: (
    title: string,
    description: string,
    dueDate: string,
    priority: number,
    categoryName?: string
  ) => void;
  categoryName?: string;
  initialDate?: string; // Nuova prop per la data iniziale
  allowCategorySelection?: boolean; // Abilita campo categoria
};

const AddTask: React.FC<AddTaskProps> = ({ 
  visible, 
  onClose, 
  onSave, 
  categoryName,
  initialDate,
  allowCategorySelection = false,
}) => {
  const [categoriesOptions, setCategoriesOptions] = useState<{label:string,value:string}[]>([]);
  const [localCategory, setLocalCategory] = useState<string>(categoryName || "");
  const [categoryError, setCategoryError] = useState<string>("");
  const animationValue = useSharedValue(0);
  const [priority, setPriority] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [titleError, setTitleError] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");
  const [date, setDate] = useState(new Date());
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date'|'time'>('date');

  // Gestisce l'animazione all'apertura del modale
  useEffect(() => {
    if (visible) {
      animationValue.value = withSpring(1, { damping: 12 });
      
      // Se initialDate è fornito, imposta la data iniziale
      if (initialDate) {
        initializeWithDate(initialDate);
      }
    } else {
      animationValue.value = withSpring(0, { damping: 12 });
    }
  }, [visible, initialDate]);

  // Carica le categorie se necessario
  useEffect(() => {
    if (allowCategorySelection && visible) {
      getCategories()
        .then(data => {
          // assume data è array di oggetti con proprietà name
          setCategoriesOptions(data.map(cat => ({ label: cat.name, value: cat.name })));
        })
        .catch(err => console.error('Errore caricamento categorie:', err));
    }
  }, [allowCategorySelection, visible]);

  // Inizializza la data del task con quella fornita
  const initializeWithDate = (dateStr: string) => {
    const initialDateTime = dayjs(dateStr).hour(12).minute(0).second(0).toDate();
    setSelectedDateTime(initialDateTime);
    setDueDate(initialDateTime.toISOString());
    setDate(initialDateTime);
  };

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
    setLocalCategory(categoryName || "");
    setCategoryError("");
  };

  const handleSave = () => {
    let hasError = false;

    if (!title.trim()) {
      setTitleError("Il titolo è obbligatorio");
      hasError = true;
    }

    if (allowCategorySelection && !localCategory.trim()) {
      setCategoryError("La categoria è obbligatoria");
      hasError = true;
    }

    // La data di scadenza è ora opzionale, non aggiungiamo più la validazione

    if (hasError) {
      return;
    }

    const priorityString = priority === 1 ? "Bassa" : priority === 2 ? "Media" : "Alta";

    const taskObject = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim() || "", // Assicurarsi che description non sia mai null
      end_time: dueDate || null, // Se non c'è una data di scadenza, imposta null
      start_time: new Date().toISOString(),
      priority: priorityString,
      status: "In sospeso", // Aggiornato per coerenza con altri componenti
      category_name: allowCategorySelection ? localCategory : (categoryName || ""), // Aggiungere il nome della categoria
      user: "", // Campo richiesto dal server
      completed: false
    };

    try {
      if (onSave) {
        onSave(title, description, dueDate, priority, allowCategorySelection ? localCategory : categoryName);
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

  const hidePicker = () => setPickerVisible(false);
  const showDatepicker = () => { setPickerMode('date'); setPickerVisible(true); };
  const showTimepicker = () => { setPickerMode('time'); setPickerVisible(true); };

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
              <Ionicons name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            {allowCategorySelection && (
              <>
                <Text style={styles.inputLabel}>Categoria *</Text>
                <Dropdown
                  style={[styles.dropdown, categoryError ? styles.inputError : null]}
                  data={categoriesOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Seleziona categoria"
                  value={localCategory}
                  onChange={item => {
                    setLocalCategory(item.value);
                    if (item.value) setCategoryError("");
                  }}
                  selectedTextStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                />
                {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}
              </>
            )}
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
            
            <Text style={styles.inputLabel}>Data e ora di scadenza (opzionale)</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.dateButton]}
                onPress={showDatepicker}
              >
                <Text style={styles.datePickerText}>
                  {selectedDateTime ? selectedDateTime.toLocaleDateString('it-IT') : 'Nessuna scadenza'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.datePickerButton, styles.timeButton]}
                onPress={showTimepicker}
                disabled={!selectedDateTime}
              >
                <Text style={[styles.datePickerText, !selectedDateTime && styles.disabledText]}>
                  {selectedDateTime ? selectedDateTime.toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'}) : 'Seleziona ora'}
                </Text>
                <Ionicons name="time-outline" size={20} color={selectedDateTime ? "#666" : "#ccc"} />
              </TouchableOpacity>
            </View>
            
            {selectedDateTime && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => {
                  setSelectedDateTime(null);
                  setDueDate("");
                  setDateError("");
                }}
              >
                <Text style={styles.clearDateText}>Rimuovi scadenza</Text>
              </TouchableOpacity>
            )}
            
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
          <DateTimePickerModal
            isVisible={isPickerVisible}
            mode={pickerMode}
            date={selectedDateTime || date}
            onConfirm={(picked) => {
              if (pickerMode === 'date') onChange(null, picked);
              else onTimeChange(null, picked);
              hidePicker();
            }}
            onCancel={hidePicker}
            is24Hour={true}
          />
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#ffffff',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  formContent: {
    padding: 24,
  },
  formFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 12,
    color: '#000000',
    fontFamily: 'System',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    fontSize: 17,
    backgroundColor: '#ffffff',
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  textArea: {
    height: 120,
  },
  inputError: {
    borderColor: "#FF5252",
    backgroundColor: "#FFF8F8",
  },
  errorText: {
    color: "#FF5252",
    fontSize: 14,
    marginBottom: 12,
    marginTop: -8,
    fontFamily: 'System',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dateButton: {
    flex: 3,
    marginRight: 12,
  },
  timeButton: {
    flex: 2,
  },
  datePickerText: {
    fontSize: 17,
    color: '#000000',
    fontFamily: 'System',
    fontWeight: '400',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  priorityButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  priorityButtonLow: {
    borderColor: '#e1e5e9',
    backgroundColor: '#ffffff',
  },
  priorityButtonMedium: {
    borderColor: '#e1e5e9',
    backgroundColor: '#ffffff',
  },
  priorityButtonHigh: {
    borderColor: '#e1e5e9',
    backgroundColor: '#ffffff',
  },
  priorityButtonActive: {
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#f8f8f8',
  },
  priorityButtonText: {
    fontWeight: '400',
    fontSize: 16,
    color: '#666666',
    fontFamily: 'System',
  },
  priorityButtonTextActive: {
    fontWeight: '500',
    color: '#000000',
  },
  saveButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '400',
    fontSize: 17,
    fontFamily: 'System',
  },
  dropdown: {
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dropdownText: {
    fontSize: 17,
    color: '#000000',
    fontFamily: 'System',
    fontWeight: '400',
  },
  dropdownPlaceholder: {
    fontSize: 17,
    color: '#666666',
    fontFamily: 'System',
  },
  disabledText: {
    color: '#ccc',
  },
  clearDateButton: {
    alignSelf: 'center',
    marginTop: -12,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearDateText: {
    color: '#FF5252',
    fontSize: 14,
    fontFamily: 'System',
    textDecorationLine: 'underline',
  },
});

export default AddTask;