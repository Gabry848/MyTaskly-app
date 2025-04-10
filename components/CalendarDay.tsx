import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

interface CalendarDayProps {
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
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    borderRadius: 10,
  },
  calendarDayText: {
    fontSize: 16,
  },
  selectedDay: {
    backgroundColor: "#007bff",
    borderRadius: 10,
  },
  selectedDayText: {
    color: "#fff",
  },
  dayWithTaskText: {
    color: "#007bff",
  },
  emptyDay: {
    backgroundColor: "transparent",
    borderRadius: 10,
  },
  taskCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  taskCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CalendarDay;