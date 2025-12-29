import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./TaskStyles";
import { useTranslation } from "react-i18next";
import { RecurrencePattern } from "../../types/recurringTask";

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

// Componente per selezionare il pattern di ricorrenza
export const PatternSelector = ({
  value,
  onChange
}: {
  value: RecurrencePattern;
  onChange: (pattern: RecurrencePattern) => void
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.priorityContainer}>
      <TouchableOpacity
        style={[
          styles.priorityButton,
          styles.priorityButtonLow,
          value === "daily" && styles.priorityButtonActive
        ]}
        onPress={() => onChange("daily")}
      >
        <Text style={[
          styles.priorityButtonText,
          value === "daily" && styles.priorityButtonTextActive
        ]}>{t('recurring.patterns.daily')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.priorityButton,
          styles.priorityButtonMedium,
          value === "weekly" && styles.priorityButtonActive
        ]}
        onPress={() => onChange("weekly")}
      >
        <Text style={[
          styles.priorityButtonText,
          value === "weekly" && styles.priorityButtonTextActive
        ]}>{t('recurring.patterns.weekly')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.priorityButton,
          styles.priorityButtonHigh,
          value === "monthly" && styles.priorityButtonActive
        ]}
        onPress={() => onChange("monthly")}
      >
        <Text style={[
          styles.priorityButtonText,
          value === "monthly" && styles.priorityButtonTextActive
        ]}>{t('recurring.patterns.monthly')}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Componente per selezionare i giorni della settimana
export const DaysOfWeekSelector = ({
  value = [],
  onChange
}: {
  value: number[];
  onChange: (days: number[]) => void
}) => {
  const { t } = useTranslation();

  const daysOfWeek = [
    { value: 1, label: t('recurring.daysOfWeek.monday') },
    { value: 2, label: t('recurring.daysOfWeek.tuesday') },
    { value: 3, label: t('recurring.daysOfWeek.wednesday') },
    { value: 4, label: t('recurring.daysOfWeek.thursday') },
    { value: 5, label: t('recurring.daysOfWeek.friday') },
    { value: 6, label: t('recurring.daysOfWeek.saturday') },
    { value: 7, label: t('recurring.daysOfWeek.sunday') },
  ];

  const toggleDay = (day: number) => {
    const newValue = value.includes(day)
      ? value.filter(d => d !== day)
      : [...value, day].sort();
    onChange(newValue);
  };

  return (
    <View style={styles.daysOfWeekContainer}>
      {daysOfWeek.map(day => (
        <TouchableOpacity
          key={day.value}
          style={[
            styles.dayButton,
            value.includes(day.value) && styles.dayButtonActive
          ]}
          onPress={() => toggleDay(day.value)}
        >
          <Text style={[
            styles.dayButtonText,
            value.includes(day.value) && styles.dayButtonTextActive
          ]}>{day.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Componente per input numerico con +/- buttons
export const NumberInput = ({
  value,
  onChange,
  min = 1,
  max = 365,
  placeholder
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}) => {
  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleTextChange = (text: string) => {
    const num = parseInt(text);
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num);
    }
  };

  return (
    <View style={styles.numberInputContainer}>
      <TouchableOpacity
        style={styles.numberButton}
        onPress={decrement}
        disabled={value <= min}
      >
        <Ionicons name="remove" size={20} color={value <= min ? "#ccc" : "#000"} />
      </TouchableOpacity>

      <TextInput
        style={styles.numberInputField}
        value={value.toString()}
        onChangeText={handleTextChange}
        keyboardType="numeric"
        placeholder={placeholder}
      />

      <TouchableOpacity
        style={styles.numberButton}
        onPress={increment}
        disabled={value >= max}
      >
        <Ionicons name="add" size={20} color={value >= max ? "#ccc" : "#000"} />
      </TouchableOpacity>
    </View>
  );
};