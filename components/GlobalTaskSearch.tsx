import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import SearchBar from "./SearchBar";
import { getAllTasks, Task as TaskType } from "../src/services/taskService";
import Task from "./Task";

interface GlobalTaskSearchProps {
  visible: boolean;
  onClose: () => void;
}

const GlobalTaskSearch: React.FC<GlobalTaskSearchProps> = ({
  visible,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [allTasks, setAllTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Carica tutti i task quando il modal viene aperto
  useEffect(() => {
    if (visible && !hasLoaded) {
      loadAllTasks();
    }
  }, [visible]);

  const loadAllTasks = async () => {
    try {
      setLoading(true);
      const tasks = await getAllTasks();
      setAllTasks(tasks || []);
      setHasLoaded(true);
    } catch (error) {
      console.error("Errore nel caricamento dei task:", error);
      Alert.alert("Errore", "Impossibile caricare i task per la ricerca");
    } finally {
      setLoading(false);
    }
  };

  // Filtra i task in base alla query di ricerca
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return allTasks;
    }

    const query = searchQuery.toLowerCase().trim();
    return allTasks.filter(
      (task) =>
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.category_name?.toLowerCase().includes(query) ||
        task.priority?.toLowerCase().includes(query)
    );
  }, [allTasks, searchQuery]);

  const handleTaskPress = (task: TaskType) => {
    // Puoi personalizzare questa funzione per aprire i dettagli del task
    Alert.alert(
      task.title,
      `Categoria: ${task.category_name}\nStato: ${task.status}\nPriorità: ${task.priority}\nDescrizione: ${task.description || "Nessuna descrizione"}`
    );
  };

  const handleRefresh = () => {
    setHasLoaded(false);
    loadAllTasks();
  };

  const renderTaskItem = ({ item }: { item: TaskType }) => (
    <Task 
      task={item} 
      onTaskComplete={(taskId) => {
        // Aggiorna lo stato locale
        setAllTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: "Completato", completed: true } : task
        ));
      }}
      onTaskUncomplete={(taskId) => {
        // Aggiorna lo stato locale
        setAllTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: "In sospeso", completed: false } : task
        ));
      }}
      onTaskEdit={(taskId, updatedTask) => {
        // Aggiorna lo stato locale
        setAllTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
      }}
      onTaskDelete={(taskId) => {
        // Rimuovi il task dallo stato locale
        setAllTasks(prev => prev.filter(task => task.id !== taskId));
      }}
    />
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Caricamento task...</Text>
        </View>
      );
    }

    if (!hasLoaded) {
      return (
        <View style={styles.centerContainer}>
          <MaterialIcons name="search" size={48} color="#cccccc" />
          <Text style={styles.emptyText}>Caricamento in corso...</Text>
        </View>
      );
    }

    if (searchQuery.trim() && filteredTasks.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <MaterialIcons name="search-off" size={48} color="#cccccc" />
          <Text style={styles.emptyText}>
            Nessun task trovato per "{searchQuery}"
          </Text>
        </View>
      );
    }

    if (allTasks.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <MaterialIcons name="assignment" size={48} color="#cccccc" />
          <Text style={styles.emptyText}>Nessun task disponibile</Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="search" size={48} color="#cccccc" />
        <Text style={styles.emptyText}>
          Inizia a digitare per cercare tra i tuoi task
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Ricerca Task</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleRefresh} style={styles.actionButton}>
                <MaterialIcons name="refresh" size={24} color="#666666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.actionButton}>
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
          </View>
          
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Cerca per titolo, descrizione, categoria..."
          />
          
          {hasLoaded && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {searchQuery.trim() 
                  ? `${filteredTasks.length} di ${allTasks.length} task`
                  : `${allTasks.length} task totali`
                }
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {filteredTasks.length > 0 ? (
            <FlatList
              data={filteredTasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => 
                item.task_id?.toString() || 
                item.id?.toString() || 
                `task-${Math.random()}`
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            renderEmptyState()
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingTop: 60, // Per lo spazio della status bar
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "200",
    color: "#000000",
    fontFamily: "System",
    letterSpacing: -1.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  statsContainer: {
    marginTop: 12,
  },
  statsText: {
    fontSize: 14,
    color: "#666666",
    fontFamily: "System",
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginTop: 16,
    fontFamily: "System",
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
    marginTop: 16,
    fontFamily: "System",
  },
});

export default GlobalTaskSearch;
