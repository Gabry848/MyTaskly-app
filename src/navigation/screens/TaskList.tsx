import React, { useState, useEffect, useMemo } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  Alert
} from "react-native";
import { Filter } from "lucide-react-native";
import Task from "../../../components/Task";
import { getTasks, addTask, deleteTask } from "../../services/taskService";
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import AddTaskButton from "../../../components/AddTaskButton";

type TaskListRouteProp = RouteProp<RootStackParamList, 'TaskList'>;

type Props = {
  route: TaskListRouteProp;
};

interface Task {
  id?: number | string;
  title: string;
  image?: string;
  description: string;
  priority: string;
  end_time: string;
  completed?: boolean;
  status_code?: number;
  task_id?: number;
}

// Create a global reference for tasks to share data between components
let globalTasksRef = {
  addTask: (task: Task, categoryName: string) => {},
  tasks: {} as Record<string, Task[]>, // Tasks grouped by category name
};

export function TaskList({ route }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filtroImportanza, setFiltroImportanza] = useState("Tutte");
  const [filtroScadenza, setFiltroScadenza] = useState("Tutte");
  const [ordineScadenza, setOrdineScadenza] = useState("Recente");
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const categoryName = route.params.category_name;

  // Initialize the global task adder function
  globalTasksRef.addTask = (newTask: Task, categoryName: string) => {
    console.log("globalTasksRef.addTask called with:", newTask, "for category:", categoryName);
    
    // Verify that it's a valid task with title
    if (!newTask || !newTask.title) {
      console.error("Invalid task:", newTask);
      return;
    }
    
    // Ensure it has an ID - use task_id if available (from server response)
    const taskWithId = {
      ...newTask,
      id: newTask.id || newTask.task_id || Date.now()
    };
    
    // Update the local state directly if this is the current category
    if (categoryName === route.params.category_name) {
      setTasks(prevTasks => {
        // Check if task already exists
        const exists = prevTasks.some(
          task => task.id === taskWithId.id || 
                 (task.title === taskWithId.title && task.description === taskWithId.description)
        );
        
        if (exists) {
          console.log("Task already exists, not adding:", taskWithId.title);
          return prevTasks;
        }
        
        console.log("Adding task directly to state:", taskWithId);
        return [...prevTasks, taskWithId];
      });
    }
    
    // Always update the global reference
    if (!globalTasksRef.tasks[categoryName]) {
      globalTasksRef.tasks[categoryName] = [];
    }
    
    // Check if task already exists in global ref
    const existsInGlobal = globalTasksRef.tasks[categoryName].some(
      task => task.id === taskWithId.id || 
             (task.title === taskWithId.title && task.description === taskWithId.description)
    );
    
    if (!existsInGlobal) {
      globalTasksRef.tasks[categoryName].push(taskWithId);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await getTasks(categoryName);
      setTasks(data);
      
      // Update global reference
      globalTasksRef.tasks[categoryName] = data;
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [categoryName]);

  // Update global reference when tasks state changes
  useEffect(() => {
    globalTasksRef.tasks[categoryName] = tasks;
  }, [tasks, categoryName]);

  // Funzione per calcolare la data futura
  const calculateFutureDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // Funzione per applicare i filtri e ordinare
  const listaFiltrata = useMemo(() => {
    const filteredTasks = tasks.filter((task) => {
      const matchesImportanza =
        filtroImportanza === "Tutte" ||
        (filtroImportanza === "Alta" && task.priority === "Alta") ||
        (filtroImportanza === "Media" && task.priority === "Media") ||
        (filtroImportanza === "Bassa" && task.priority === "Bassa");
      const matchesScadenza =
        filtroScadenza === "Tutte" ||
        (filtroScadenza === "Domani" && task.end_time === calculateFutureDate(1)) ||
        (filtroScadenza === "Dopodomani" && task.end_time === calculateFutureDate(2)) ||
        (filtroScadenza.startsWith("Fra") && task.end_time === calculateFutureDate(parseInt(filtroScadenza.split(' ')[1])));

      return matchesImportanza && matchesScadenza;
    });

    return filteredTasks.sort((a, b) => {
      if (ordineScadenza === "Recente") {
        return new Date(b.end_time).getTime() - new Date(a.end_time).getTime();
      } else {
        return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
      }
    });
  }, [tasks, filtroImportanza, filtroScadenza, ordineScadenza]);

  const handleAddTask = async (
    title: string,
    description: string,
    dueDate: string,
    priority: number
  ) => {
    const priorityString = priority === 1 ? "Bassa" : priority === 2 ? "Media" : "Alta";
    
    const newTask: Task = {
      id: Date.now(),
      title,
      description,
      end_time: new Date(dueDate).toISOString(),
      priority: priorityString,
      completed: false,
    };
    
    console.log("handleAddTask called with:", newTask);
    
    try {
      // Attempt to save to backend
      const response = await addTask({
        ...newTask,
        category_name: categoryName,
        dueDate: dueDate,
      });
      
      console.log("Server response:", response);
      
      // Check if the response contains status_code and task_id but not a complete task
      if (response && response.status_code && response.task_id && !response.title) {
        // Create a complete task object using the original data plus the ID from the server
        const finalTask: Task = {
          ...newTask,
          id: response.task_id,
          task_id: response.task_id,
          status_code: response.status_code
        };
        
        // Add to global reference and local state
        globalTasksRef.addTask(finalTask, categoryName);
        console.log("Task added successfully with server ID:", finalTask);
      } else if (response && response.title) {
        // If server returns a complete task object
        globalTasksRef.addTask(response, categoryName);
        console.log("Task added successfully with complete server response:", response);
      } else {
        // Use original task as fallback
        globalTasksRef.addTask(newTask, categoryName);
        console.log("Task added with local data only:", newTask);
      }
    } catch (error) {
      console.error("Error adding task:", error);
      // Still add to local state even if backend fails
      globalTasksRef.addTask(newTask, categoryName);
      
      Alert.alert(
        "Warning",
        "Task was added locally but there was an error saving to the server."
      );
    }
  };

  // Funzione per gestire l'eliminazione del task
  const handleTaskDelete = async (taskId: number) => {
    try {
      // Aggiorniamo subito la lista locale per un feedback immediato
      // L'animazione è già gestita nel componente Task
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      // Inviamo la richiesta di eliminazione al server in background
      await deleteTask(taskId);
      console.log(`Task ${taskId} successfully deleted from server`);
    } catch (error) {
      console.error("Errore nell'eliminazione del task:", error);
      // Informiamo l'utente dell'errore ma non ripristiniamo il task (optional)
      Alert.alert(
        "Avviso",
        "Il task è stato rimosso localmente, ma c'è stato un errore durante l'eliminazione dal server."
      );
    }
  };

  // Funzione per ottenere il colore in base alla priorità
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "Alta": return "#FF5252";
      case "Media": return "#FFC107";
      case "Bassa": return "#4CAF50";
      default: return "#10e0e0";
    }
  };

  // Componente per i chip dei filtri
  const FilterChip = ({ 
    label, 
    isSelected, 
    onPress, 
    color = '#10e0e0' 
  }: { 
    label: string, 
    isSelected: boolean, 
    onPress: () => void, 
    color?: string 
  }) => {
    return (
      <TouchableOpacity
        style={[
          styles.filterChip,
          isSelected && { backgroundColor: color, borderColor: color }
        ]}
        onPress={onPress}
      >
        <Text style={[
          styles.filterChipText,
          isSelected && { color: 'white' }
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{categoryName}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setModalVisible(true)}
        >
          <Filter width={22} height={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#10e0e0" />
      ) : (
        <>
          {/* Modal dei filtri */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filtra attività</Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.filterSection}>
                    <Text style={styles.filterTitle}>Importanza</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                      <FilterChip 
                        label="Tutte" 
                        isSelected={filtroImportanza === "Tutte"} 
                        onPress={() => setFiltroImportanza("Tutte")} 
                      />
                      <FilterChip 
                        label="Alta" 
                        isSelected={filtroImportanza === "Alta"} 
                        onPress={() => setFiltroImportanza("Alta")} 
                        color="#FF5252"
                      />
                      <FilterChip 
                        label="Media" 
                        isSelected={filtroImportanza === "Media"} 
                        onPress={() => setFiltroImportanza("Media")} 
                        color="#FFC107"
                      />
                      <FilterChip 
                        label="Bassa" 
                        isSelected={filtroImportanza === "Bassa"} 
                        onPress={() => setFiltroImportanza("Bassa")} 
                        color="#4CAF50"
                      />
                    </ScrollView>
                  </View>

                  <View style={styles.filterSection}>
                    <Text style={styles.filterTitle}>Scadenza</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                      <FilterChip 
                        label="Tutte" 
                        isSelected={filtroScadenza === "Tutte"} 
                        onPress={() => setFiltroScadenza("Tutte")} 
                      />
                      <FilterChip 
                        label="Domani" 
                        isSelected={filtroScadenza === "Domani"} 
                        onPress={() => setFiltroScadenza("Domani")} 
                      />
                      <FilterChip 
                        label="Dopodomani" 
                        isSelected={filtroScadenza === "Dopodomani"} 
                        onPress={() => setFiltroScadenza("Dopodomani")} 
                      />
                      <FilterChip 
                        label="Fra 3 giorni" 
                        isSelected={filtroScadenza === "Fra 3 giorni"} 
                        onPress={() => setFiltroScadenza("Fra 3 giorni")} 
                      />
                      <FilterChip 
                        label="Fra 7 giorni" 
                        isSelected={filtroScadenza === "Fra 7 giorni"} 
                        onPress={() => setFiltroScadenza("Fra 7 giorni")} 
                      />
                    </ScrollView>
                  </View>

                  <View style={styles.filterSection}>
                    <Text style={styles.filterTitle}>Ordine</Text>
                    <View style={styles.orderContainer}>
                      <TouchableOpacity
                        style={[
                          styles.orderButton,
                          ordineScadenza === "Recente" && styles.activeOrderButton
                        ]}
                        onPress={() => setOrdineScadenza("Recente")}
                      >
                        <Text style={[
                          styles.orderButtonText,
                          ordineScadenza === "Recente" && styles.activeOrderText
                        ]}>
                          Più recente prima
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.orderButton,
                          ordineScadenza === "Vecchio" && styles.activeOrderButton
                        ]}
                        onPress={() => setOrdineScadenza("Vecchio")}
                      >
                        <Text style={[
                          styles.orderButtonText,
                          ordineScadenza === "Vecchio" && styles.activeOrderText
                        ]}>
                          Più vecchio prima
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Visualizzazione filtri attivi */}
          {(filtroImportanza !== "Tutte" || filtroScadenza !== "Tutte") && (
            <View style={styles.activeFilterContainer}>
              <Text style={styles.activeFilterText}>Filtri attivi:</Text>
              <View style={styles.activeFilterChips}>
                {filtroImportanza !== "Tutte" && (
                  <View style={[styles.activeChip, { backgroundColor: getPriorityColor(filtroImportanza) }]}>
                    <Text style={styles.activeChipText}>{`Importanza: ${filtroImportanza}`}</Text>
                    <TouchableOpacity onPress={() => setFiltroImportanza("Tutte")}>
                      <Text style={styles.clearFilterButton}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {filtroScadenza !== "Tutte" && (
                  <View style={styles.activeChip}>
                    <Text style={styles.activeChipText}>{`Scadenza: ${filtroScadenza}`}</Text>
                    <TouchableOpacity onPress={() => setFiltroScadenza("Tutte")}>
                      <Text style={styles.clearFilterButton}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          <FlatList
            data={listaFiltrata}
            keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
            renderItem={({ item }) => (
              <Task
                task={{
                  id: typeof item.task_id === "string" ? parseInt(item.task_id, 10) : item.task_id || item.task_id,
                  title: item.title,
                  description: item.description,
                  priority: item.priority,
                  end_time: item.end_time,
                  completed: item.completed || false
                }}
                onTaskComplete={(taskId) => {
                  console.log(`Task ${taskId} completed`);
                  // Add logic to handle task completion
                }}
                onTaskDelete={handleTaskDelete}
                onTaskEdit={(taskId) => {
                  console.log(`Task ${taskId} edited`);
                  // Add logic to handle task editing
                }}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>Nessuna attività corrisponde ai filtri selezionati</Text>
              </View>
            }
          />
        </>
      )}
      <AddTaskButton onSave={handleAddTask} categoryName={categoryName} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: '#333',
    flex: 1,
  },
  filterButton: {
    backgroundColor: '#10e0e0',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  // Stili per il modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#10e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  closeButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 15,
    maxHeight: 400,
  },
  modalFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#10e0e0',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Stili per i filtri
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  filterSection: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  filterChip: {
    borderWidth: 1.5,
    borderColor: '#10e0e0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 10,
    backgroundColor: 'transparent',
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  filterChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  orderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 5,
  },
  orderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  activeOrderButton: {
    backgroundColor: '#10e0e0',
    borderColor: '#10e0e0',
  },
  orderButtonText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  activeOrderText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Stili per i filtri attivi
  activeFilterContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  activeFilterText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 10,
  },
  activeFilterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10e0e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  activeChipText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 8,
  },
  clearFilterButton: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  emptyListContainer: {
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 224, 224, 0.05)',
    borderRadius: 10,
    margin: 10,
  },
  emptyListText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  }
});

export default TaskList;

// Export the global function for adding tasks
export const addTaskToList = (task: Task, categoryName: string) => {
  console.log("addTaskToList called directly with:", task, "for category:", categoryName);
  globalTasksRef.addTask(task, categoryName);
};
