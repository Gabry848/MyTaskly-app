import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface CompletedTaskProps {
  id: number | string;
  title: string;
  completedDate: string;
}

interface CompletedTasksListProps {
  tasks: CompletedTaskProps[];
  onTaskPress: (taskId: number | string) => void;
}

const CompletedTasksList: React.FC<CompletedTasksListProps> = ({ 
  tasks, 
  onTaskPress 
}) => {
  // Formatta la data nel formato italiano
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  const renderTaskItem = ({ item }: { item: CompletedTaskProps }) => (
    <TouchableOpacity 
      style={styles.taskItem}
      onPress={() => onTaskPress(item.id)}
    >
      <View style={styles.checkIconContainer}>
        <MaterialIcons name="check-circle" size={20} color="#34C759" />
      </View>
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.completedTime}>
          Completato il {formatDate(item.completedDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Completati di recente</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Tutti</Text>
        </TouchableOpacity>
      </View>
      
      {tasks.length > 0 ? (
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="check-circle-outline" size={40} color="#C7C7CC" />
          <Text style={styles.emptyText}>Nessun task completato recentemente</Text>
        </View>
      )}
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
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  viewAllButton: {
    padding: 4,
  },
  viewAllText: {
    color: "#007AFF",
    fontWeight: "500",
    fontSize: 14,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  checkIconContainer: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  completedTime: {
    fontSize: 12,
    color: "#8E8E93",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 10,
    color: "#8E8E93",
    fontSize: 14,
  },
});

export default CompletedTasksList;