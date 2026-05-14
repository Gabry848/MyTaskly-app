import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

export interface CalendarDayProps {
  day: string;
  date: string | null;
  isSelected: boolean;
  hasTask: boolean;
  taskCount: number;
  priorityColor: string;
  onSelectDate: (date: string | null) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  date,
  isSelected,
  hasTask,
  taskCount,
  priorityColor,
  onSelectDate
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.calendarDay,
        !date && styles.emptyDay,
        // Applica il colore di priorità solo se il giorno non è selezionato
        date && !isSelected && { backgroundColor: priorityColor },
        // Applica lo stile selectedDay solo se il giorno è selezionato
        isSelected && styles.selectedDay
      ]}
      onPress={() => onSelectDate(date)}
      disabled={!date}
    >
      <Text
        style={[
          styles.calendarDayText,
          isSelected && styles.selectedDayText,
          hasTask && !isSelected && styles.dayWithTaskText
        ]}
      >
        {day}
      </Text>
      
      {date && taskCount > 0 && (
        <View style={styles.taskCountBadge}>
          <Text style={styles.taskCountText}>
            {taskCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  calendarDay: {
    width: `${100 / 7}%`,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 3,
    borderRadius: 10,
    position: 'relative',
  },
  calendarDayText: {
    fontSize: 14,
    fontFamily: "System",
    fontWeight: "400",
    color: "#000000",
  },
  selectedDay: {
    backgroundColor: "#000000",
    borderRadius: 10,
  },
  selectedDayText: {
    color: "#ffffff",
    fontWeight: "500",
  },
  dayWithTaskText: {
    color: "#000000",
    fontWeight: "500",
  },
  emptyDay: {
    backgroundColor: "transparent",
    borderRadius: 10,
  },
  taskCountBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    backgroundColor: '#000000',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  taskCountText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '600',
    fontFamily: "System",
  },
});

export default CalendarDay;