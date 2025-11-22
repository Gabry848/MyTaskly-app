import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { styles } from "./TaskStyles";
import { getDaysRemainingText, getDaysRemainingColor, getPriorityTextColor } from "./TaskUtils";

// Componente Checkbox riutilizzabile
export const Checkbox = ({ checked, onPress, isOptimistic = false }) => (
  <TouchableOpacity
    style={[
      styles.checkbox, 
      checked && styles.checkedBox,
      isOptimistic && styles.optimisticBox
    ]}
    onPress={onPress}
    disabled={isOptimistic}
  >
    {isOptimistic ? (
      <ActivityIndicator size="small" color="#fff" />
    ) : (
      checked && <MaterialIcons name="check" size={16} color="#fff" />
    )}
  </TouchableOpacity>
);

// Componente per visualizzare la data
export const DateDisplay = ({ date }) => {
  const { t } = useTranslation();

  if (!date) {
    return (
      <View style={styles.dateContainer}>
        <Ionicons name="calendar-clear-outline" size={14} color="#999999" />
        <Text style={[styles.dateText, { color: '#999999' }]}>{t('task.noDeadline')}</Text>
      </View>
    );
  }
  
  const formattedDate = new Date(date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  
  return (
    <View style={styles.dateContainer}>
      <Ionicons name="calendar-outline" size={14} color="#666666" />
      <Text style={styles.dateText}>{formattedDate}</Text>
    </View>
  );
};

// Componente per visualizzare i giorni rimanenti
export const DaysRemaining = ({ endDate }) => {
  const daysRemainingText = getDaysRemainingText(endDate);
  const daysRemainingColor = getDaysRemainingColor(endDate);
  
  return (
    <Text style={[styles.daysRemaining, { color: daysRemainingColor }]}>
      {daysRemainingText}
    </Text>
  );
};

// Componente per il titolo del task
export const TaskTitle = ({ title, completed, numberOfLines, priority }) => {
  const textColor = getPriorityTextColor(priority);
  
  return (
    <Text
      style={[
        styles.title, 
        completed && styles.completedText,
        !completed && { color: textColor }
      ]}
      numberOfLines={numberOfLines}
    >
      {title}
    </Text>
  );
};