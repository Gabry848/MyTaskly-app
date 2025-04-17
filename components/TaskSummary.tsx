import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface TaskSummaryProps {
  todayTasks: number;
  overdueTasks: number;
  completedThisWeek: number;
}

const TaskSummary: React.FC<TaskSummaryProps> = ({ 
  todayTasks, 
  overdueTasks, 
  completedThisWeek 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Riepilogo</Text>
      
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryItem, styles.todayItem]}>
          <MaterialIcons name="event" size={24} color="#007AFF" />
          <Text style={styles.summaryValue}>{todayTasks}</Text>
          <Text style={styles.summaryLabel}>Oggi</Text>
        </View>
        
        <View style={[styles.summaryItem, styles.overdueItem]}>
          <MaterialIcons name="event-busy" size={24} color="#FF3B30" />
          <Text style={styles.summaryValue}>{overdueTasks}</Text>
          <Text style={styles.summaryLabel}>Scaduti</Text>
        </View>
        
        <View style={[styles.summaryItem, styles.completedItem]}>
          <MaterialIcons name="done-all" size={24} color="#34C759" />
          <Text style={styles.summaryValue}>{completedThisWeek}</Text>
          <Text style={styles.summaryLabel}>Completati</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
  },
  todayItem: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    marginRight: 8,
  },
  overdueItem: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    marginHorizontal: 4,
  },
  completedItem: {
    backgroundColor: "rgba(52, 199, 89, 0.1)",
    marginLeft: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    marginVertical: 4,
    color: "#333",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
});

export default TaskSummary;