import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./TaskStyles";

// Componente per selezionare la priorità
export const PrioritySelector = ({ value, onChange }) => {
  return (
    <View style={styles.priorityContainer}>
      <TouchableOpacity 
        style={[
          styles.priorityButton, 
          styles.priorityButtonLow,
          value === "Bassa" && styles.priorityButtonActive
        ]}
        onPress={() => onChange("Bassa")}
      >
        <Text style={[
          styles.priorityButtonText,
          value === "Bassa" && styles.priorityButtonTextActive
        ]}>Bassa</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.priorityButton, 
          styles.priorityButtonMedium,
          value === "Media" && styles.priorityButtonActive
        ]}
        onPress={() => onChange("Media")}
      >
        <Text style={[
          styles.priorityButtonText,
          value === "Media" && styles.priorityButtonTextActive
        ]}>Media</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.priorityButton, 
          styles.priorityButtonHigh,
          value === "Alta" && styles.priorityButtonActive
        ]}
        onPress={() => onChange("Alta")}
      >
        <Text style={[
          styles.priorityButtonText,
          value === "Alta" && styles.priorityButtonTextActive
        ]}>Alta</Text>
      </TouchableOpacity>
    </View>
  );
};

// Componente per selezionare lo stato
export const StatusSelector = ({ value, onChange }) => {
  return (
    <View style={styles.statusContainer}>
      <TouchableOpacity 
        style={[
          styles.priorityButton, 
          styles.statusButtonPending,
          value === "In sospeso" && styles.priorityButtonActive
        ]}
        onPress={() => onChange("In sospeso")}
      >
        <Text style={[
          styles.priorityButtonText,
          value === "In sospeso" && styles.priorityButtonTextActive
        ]}>In sospeso</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.priorityButton, 
          styles.statusButtonInProgress,
          value === "In corso" && styles.priorityButtonActive
        ]}
        onPress={() => onChange("In corso")}
      >
        <Text style={[
          styles.priorityButtonText,
          value === "In corso" && styles.priorityButtonTextActive
        ]}>In corso</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.priorityButton, 
          styles.statusButtonCompleted,
          value === "Completato" && styles.priorityButtonActive
        ]}
        onPress={() => onChange("Completato")}
      >
        <Text style={[
          styles.priorityButtonText,
          value === "Completato" && styles.priorityButtonTextActive
        ]}>Completato</Text>
      </TouchableOpacity>
    </View>
  );
};

// Componente per selezionare una data
export const DatePickerButton = ({ value, onPress, placeholder, iconName = "calendar-outline" }: { value?: string; onPress: () => void; placeholder: string; iconName?: "calendar-outline" | "time-outline" }) => {
  const formattedDate = value 
    ? new Date(value).toLocaleDateString('it-IT') 
    : placeholder;
    
  return (
    <TouchableOpacity 
      style={styles.datePickerButton}
      onPress={onPress}
    >
      <Text style={styles.datePickerText}>{formattedDate}</Text>
      <Ionicons name={iconName} size={20} color="#666" />
    </TouchableOpacity>
  );
};

// Componente per selezionare un'ora
export const TimePickerButton = ({ value, onPress, placeholder }) => {
  const formattedTime = value 
    ? new Date(value).toLocaleTimeString('it-IT', {
        hour: '2-digit', 
        minute: '2-digit'
      }) 
    : placeholder;
    
  return (
    <TouchableOpacity 
      style={styles.datePickerButton}
      onPress={onPress}
    >
      <Text style={styles.datePickerText}>{formattedTime}</Text>
      <Ionicons name="time-outline" size={20} color="#666" />
    </TouchableOpacity>
  );
};