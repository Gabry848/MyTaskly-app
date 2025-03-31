import React, { useState, useEffect, useMemo } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Modal
} from "react-native";
import { Filter } from "lucide-react-native";
import Task from "../../../components/Task";
import { getTasks, addTask } from "../../services/taskService";
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import AddTaskButton from "../../../components/AddTaskButton";

type TaskListRouteProp = RouteProp<RootStackParamList, 'TaskList'>;

type Props = {
  route: TaskListRouteProp;
};

interface Task {
  title: string;
  image: string;
  description: string;
  priority: string;
  end_time: string;
}

export function TaskList({ route }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filtroImportanza, setFiltroImportanza] = useState("Tutte");
  const [filtroScadenza, setFiltroScadenza] = useState("Tutte");
  const [ordineScadenza, setOrdineScadenza] = useState("Recente");
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      const data = await getTasks(route.params.category_name);
      setTasks(data);
      setIsLoading(false);
    };

    fetchTasks();
  }, []);

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
    const newTask = {
      title,
      description,
      end_time: new Date(dueDate).toISOString(),
      category_name: route.params.category_name,
      priority: priority === 1 ? "Bassa" : priority === 2 ? "Media" : "Alta",
      completed: false,
      dueDate: dueDate,
    };
    try {
      const addedTask = await addTask(newTask);
      //setTasks((prevTasks) => [...prevTasks, addedTask]);
    } catch (error) {
      console.error("Errore nell'aggiunta del task:", error);
    }
  };

  // Funzione per generare il testo del filtro applicato
  const getFilterText = () => {
    let text = [];
    
    // Testo per il filtro importanza
    if (filtroImportanza !== "Tutte") {
      text.push(`Importanza: ${filtroImportanza}`);
    }
    
    // Testo per il filtro scadenza
    if (filtroScadenza !== "Tutte") {
      text.push(`Scadenza: ${filtroScadenza}`);
    }
    
    // Testo per l'ordine
    text.push(`Ordine: ${ordineScadenza}`);
    
    return text.length ? text.join(" • ") : "Nessun filtro attivo";
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
        <Text style={styles.title}>{route.params.category_name}</Text>
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
                
                {/* <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.applyButtonText}>Applica filtri</Text>
                  </TouchableOpacity>
                </View> */}
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
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <Task
                task={{
                  id: index,
                  title: item.title,
                  description: item.description,
                  priority: item.priority,
                  end_time: item.end_time,
                  completed: false
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
      <AddTaskButton onSave={handleAddTask} />
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
