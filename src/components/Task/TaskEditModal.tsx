import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from "@expo/vector-icons";
import { styles } from "./TaskStyles";
import { PrioritySelector, StatusSelector, DatePickerButton, TimePickerButton } from "./FormComponents";

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
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [dateType, setDateType] = useState('end'); // 'start' o 'end'

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
      });
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