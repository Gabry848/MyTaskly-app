import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { styles } from "./TaskStyles";
import { PrioritySelector, StatusSelector, DatePickerButton, TimePickerButton } from "./FormComponents";

const DURATION_PRESETS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 ora", value: 60 },
  { label: "2 ore", value: 120 },
  { label: "4 ore", value: 240 },
];

// Componente per il modal di modifica
const TaskEditModal = ({ 
  visible, 
  task, 
  onClose, 
  onSave 
}) => {
  const [editedTask, setEditedTask] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    priority: "",
    status: "",
    duration_minutes: null as number | null,
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [dateType, setDateType] = useState('end'); // 'start' o 'end'
  const [customDuration, setCustomDuration] = useState<string>("");

  // Quando il modale diventa visibile, inizializza i campi
  useEffect(() => {
    if (visible && task) {
      setEditedTask({
        title: task.title,
        description: task.description || "",
        start_time: task.start_time || new Date().toISOString(),
        end_time: task.end_time,
        priority: task.priority,
        status: task.status || "In sospeso",
        duration_minutes: task.duration_minutes ?? null,
      });
      setCustomDuration(task.duration_minutes ? String(task.duration_minutes) : "");
    }
  }, [visible, task]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    
    if (selectedDate) {
      const currentDate = dateType === 'end' 
        ? (editedTask.end_time ? new Date(editedTask.end_time) : new Date())
        : (editedTask.start_time ? new Date(editedTask.start_time) : new Date());
      
      if (pickerMode === 'date') {
        currentDate.setFullYear(selectedDate.getFullYear());
        currentDate.setMonth(selectedDate.getMonth());
        currentDate.setDate(selectedDate.getDate());
      } else {
        currentDate.setHours(selectedDate.getHours());
        currentDate.setMinutes(selectedDate.getMinutes());
      }
      
      if (dateType === 'end') {
        setEditedTask({...editedTask, end_time: currentDate.toISOString()});
      } else {
        setEditedTask({...editedTask, start_time: currentDate.toISOString()});
      }
    }
  };

  const openDatePicker = (type) => {
    setDateType(type);
    setPickerMode('date');
    setShowDatePicker(true);
  };

  const openTimePicker = (type) => {
    setDateType(type);
    setPickerMode('time');
    setShowTimePicker(true);
  };

  const handleSave = () => {
    if (!editedTask.title.trim()) {
      Alert.alert("Errore", "Il titolo è obbligatorio");
      return;
    }
    
    onSave(editedTask);
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.editModalOverlay}>
        <View style={styles.editModalContainer}>
          <View style={styles.editModalHeader}>
            <Text style={styles.editModalTitle}>Modifica Task</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.editModalContent}>
            <Text style={styles.inputLabel}>Titolo *</Text>
            <TextInput
              style={styles.input}
              value={editedTask.title}
              onChangeText={(text) => setEditedTask({...editedTask, title: text})}
              placeholder="Titolo del task"
            />
            
            <Text style={styles.inputLabel}>Descrizione</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editedTask.description}
              onChangeText={(text) => setEditedTask({...editedTask, description: text})}
              placeholder="Descrizione del task"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <Text style={styles.inputLabel}>Data di inizio</Text>
            <DatePickerButton 
              value={editedTask.start_time}
              onPress={() => openDatePicker('start')}
              placeholder="Seleziona data di inizio"
            />
            
            <Text style={styles.inputLabel}>Data e ora di scadenza (opzionale)</Text>
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateButton}>
                <DatePickerButton 
                  value={editedTask.end_time}
                  onPress={() => openDatePicker('end')}
                  placeholder="Nessuna scadenza"
                />
              </View>
              
              <View style={styles.timeButton}>
                <TimePickerButton 
                  value={editedTask.end_time}
                  onPress={() => editedTask.end_time ? openTimePicker('end') : null}
                  placeholder="Seleziona ora"
                />
              </View>
            </View>
            
            {editedTask.end_time && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => setEditedTask({...editedTask, end_time: null})}
              >
                <Text style={styles.clearDateText}>Rimuovi scadenza</Text>
              </TouchableOpacity>
            )}
            
            {showDatePicker && (
              <DateTimePicker
                value={dateType === 'end' 
                  ? (editedTask.end_time ? new Date(editedTask.end_time) : new Date())
                  : (editedTask.start_time ? new Date(editedTask.start_time) : new Date())}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            
            {showTimePicker && (
              <DateTimePicker
                value={dateType === 'end' 
                  ? (editedTask.end_time ? new Date(editedTask.end_time) : new Date())
                  : (editedTask.start_time ? new Date(editedTask.start_time) : new Date())}
                mode="time"
                display="default"
                onChange={handleDateChange}
                is24Hour={true}
              />
            )}
            
            <Text style={styles.inputLabel}>Priorità</Text>
            <PrioritySelector 
              value={editedTask.priority} 
              onChange={(priority) => setEditedTask({...editedTask, priority})} 
            />

            <Text style={styles.inputLabel}>Stato</Text>
            <StatusSelector 
              value={editedTask.status} 
              onChange={(status) => setEditedTask({...editedTask, status})} 
            />

            <Text style={styles.inputLabel}>Durata stimata (opzionale)</Text>
            <View style={styles.durationContainer}>
              {DURATION_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.durationChip,
                    editedTask.duration_minutes === preset.value && styles.durationChipActive,
                  ]}
                  onPress={() => {
                    if (editedTask.duration_minutes === preset.value) {
                      setEditedTask({...editedTask, duration_minutes: null});
                      setCustomDuration("");
                    } else {
                      setEditedTask({...editedTask, duration_minutes: preset.value});
                      setCustomDuration("");
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      editedTask.duration_minutes === preset.value && styles.durationChipTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customDurationRow}>
              <TextInput
                style={styles.customDurationInput}
                placeholder="Personalizzata (minuti)"
                keyboardType="numeric"
                value={customDuration}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, "");
                  setCustomDuration(numericText);
                  const val = parseInt(numericText, 10);
                  if (val >= 1 && val <= 10080) {
                    setEditedTask({...editedTask, duration_minutes: val});
                  } else if (numericText === "") {
                    setEditedTask({...editedTask, duration_minutes: null});
                  }
                }}
              />
              {editedTask.duration_minutes && (
                <TouchableOpacity
                  style={styles.clearDurationButton}
                  onPress={() => {
                    setEditedTask({...editedTask, duration_minutes: null});
                    setCustomDuration("");
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
          
          <View style={styles.editModalFooter}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Salva Modifiche</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TaskEditModal;