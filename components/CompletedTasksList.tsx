import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from "react-native";
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
  // Stato per gestire l'espansione della lista
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Stato per il conteggio dei task da mostrare
  const [visibleTasksCount, setVisibleTasksCount] = useState(3);
  
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
  
  // Gestisce il toggle dell'espansione
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Mostra tutti i task completati
  const handleViewAll = () => {
    setVisibleTasksCount(tasks.length);
  };
  
  // Filtro i task per essere sicuro che tutti abbiano un ID valido
  const safeVisibleTasks = isExpanded ? 
    (visibleTasksCount < tasks.length ? tasks.slice(0, visibleTasksCount) : tasks)
      .filter(task => task && task.id != null) // Filtro per task validi con ID definiti
    : [];
  
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
  
  // Se non ci sono task completati, non mostriamo la sezione
  if (!tasks || tasks.length === 0) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Completati di recente</Text>
          <Text style={styles.counterText}>{tasks.length}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={toggleExpand}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleButtonText}>
            {isExpanded ? "Chiudi" : "Mostra"}
          </Text>          <MaterialIcons 
            name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={20} 
            color="#000000" 
            style={{marginLeft: 4}}
          />
        </TouchableOpacity>
      </View>
      
      {isExpanded && (
        <>
          <FlatList
            data={safeVisibleTasks}
            renderItem={renderTaskItem}
            keyExtractor={(item) => (item.id !== undefined ? item.id.toString() : `task-${Math.random()}`)}
            scrollEnabled={false}
          />
          
          {tasks.length > visibleTasksCount && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={handleViewAll}
            >
              <Text style={styles.viewAllText}>
                Mostra tutti ({tasks.length})
              </Text>
            </TouchableOpacity>
          )}
          
          {tasks.length > 0 && tasks.length <= visibleTasksCount && (
            <Text style={styles.taskCountText}>
              {tasks.length} {tasks.length === 1 ? 'task completato' : 'task completati'}
            </Text>
          )}
        </>
      )}
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
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "400",
    color: "#000000",
    fontFamily: "System",
    letterSpacing: -0.3,
  },
  counterText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#ffffff",
    backgroundColor: "#000000",    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
    overflow: "hidden",
  },
  viewAllButton: {
    alignSelf: "center",
    paddingVertical: 8,
    marginTop: 8,
  },
  viewAllText: {
    color: "#000000",
    fontWeight: "400",
    fontSize: 15,
    fontFamily: "System",
  },
  taskCountText: {
    textAlign: "center",
    color: "#666666",
    fontSize: 14,
    marginTop: 8,
    fontFamily: "System",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  checkIconContainer: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 2,
    fontFamily: "System",
  },
  completedTime: {
    fontSize: 13,
    color: "#666666",
    fontFamily: "System",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 10,
    color: "#666666",
    fontSize: 15,
    fontFamily: "System",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e1e5e9",  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#000000",
    fontFamily: "System",
  },
});

export default CompletedTasksList;