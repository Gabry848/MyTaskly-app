import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export interface TaskSummaryProps {
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
          <MaterialIcons name="event" size={24} color="#000000" />
          <Text style={styles.summaryValue}>{todayTasks}</Text>
          <Text style={styles.summaryLabel}>Oggi</Text>
        </View>
        
        <View style={[styles.summaryItem, styles.overdueItem]}>
          <MaterialIcons name="event-busy" size={24} color="#666666" />
          <Text style={styles.summaryValue}>{overdueTasks}</Text>
          <Text style={styles.summaryLabel}>Scaduti</Text>
        </View>
        
        <View style={[styles.summaryItem, styles.completedItem]}>
          <MaterialIcons name="done-all" size={24} color="#999999" />
          <Text style={styles.summaryValue}>{completedThisWeek}</Text>
          <Text style={styles.summaryLabel}>Completati</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "400",
    marginBottom: 16,
    color: "#000000",
    fontFamily: "System",
    letterSpacing: -0.3,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  todayItem: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    marginRight: 8,
  },
  overdueItem: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginHorizontal: 4,
  },
  completedItem: {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    marginLeft: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "500",
    marginVertical: 4,
    color: "#000000",
    fontFamily: "System",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "400",
    fontFamily: "System",
  },
});

export default TaskSummary;