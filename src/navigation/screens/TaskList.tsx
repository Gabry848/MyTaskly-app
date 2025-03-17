import React, { useState, useEffect, useMemo } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Task from "../../../components/Task"; // Assicurati di avere un componente Card separato
import { getTasks, addTask } from "../../services/taskService"; // Importa la funzione getTasks e addTask
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types'; // Assicurati di avere un file types.ts con RootStackParamList
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
      completed: false, // Aggiungi il campo completed
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{route.params.category_name}</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <View style={styles.filtersContainer}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterTitle}>Importanza</Text>
              <Picker
                selectedValue={filtroImportanza}
                onValueChange={(itemValue) => setFiltroImportanza(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Tutte" value="Tutte" />
                <Picker.Item label="Alta" value="Alta" />
                <Picker.Item label="Media" value="Media" />
                <Picker.Item label="Bassa" value="Bassa" />
              </Picker>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterTitle}>Scadenza</Text>
              <Picker
                selectedValue={filtroScadenza}
                onValueChange={(itemValue) => setFiltroScadenza(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Tutte" value="Tutte" />
                <Picker.Item label="Domani" value="Domani" />
                <Picker.Item label="Dopodomani" value="Dopodomani" />
                <Picker.Item label="Fra 3 giorni" value="Fra 3 giorni" />
                <Picker.Item label="Fra 7 giorni" value="Fra 7 giorni" />
              </Picker>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterTitle}>Ordine</Text>
              <Picker
                selectedValue={ordineScadenza}
                onValueChange={(itemValue) => setOrdineScadenza(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Recente" value="Recente" />
                <Picker.Item label="Vecchio" value="Vecchio" />
              </Picker>
            </View>
          </View>

          {/* Visualizzazione filtro attivo */}
          <View style={styles.activeFilterContainer}>
            <Text style={styles.activeFilterText}>{getFilterText()}</Text>
          </View>

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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  filterGroup: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 2,
    borderBlockColor: 'black',
    borderWidth: 1,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  picker: {
    height: 40,
    width: "100%",
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#10e0e0',
    borderRadius: 10,
    paddingHorizontal: 8,
    elevation: 1,
    color: 'black',
  },
  activeFilterContainer: {
    backgroundColor: '#e6f7ff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#10e0e0',
  },
  activeFilterText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 13,
  },
});

export default TaskList;
