import React, { useState, useEffect, useMemo } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Card from "../../../components/Card"; // Assicurati di avere un componente Card separato
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
  descrizione: string;
  importanza: number;
  scadenza: string;
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

  // Funzione per applicare i filtri e ordinare
  const listaFiltrata = useMemo(() => {
    const filteredTasks = tasks.filter((task) => {
      const matchesImportanza =
        filtroImportanza === "Tutte" || task.importanza.toString() === filtroImportanza;
      const matchesScadenza =
        filtroScadenza === "Tutte" || task.scadenza === filtroScadenza;

      return matchesImportanza && matchesScadenza;
    });

    return filteredTasks.sort((a, b) => {
      if (ordineScadenza === "Recente") {
        return new Date(b.scadenza).getTime() - new Date(a.scadenza).getTime();
      } else {
        return new Date(a.scadenza).getTime() - new Date(b.scadenza).getTime();
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
      start_time: new Date().toISOString(),
      end_time: new Date(dueDate).toISOString(),
      category_id: route.params.category_name,
      priority: priority === 1 ? "Bassa" : priority === 2 ? "Media" : "Alta",
      status: "pending",
    };
    try {
      const addedTask = await addTask(newTask);
      setTasks((prevTasks) => [...prevTasks, addedTask]);
    } catch (error) {
      console.error("Errore nell'aggiunta del task:", error);
    }
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
                <Picker.Item label="Alta" value="1" />
                <Picker.Item label="Media" value="2" />
                <Picker.Item label="Bassa" value="3" />
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
                {tasks.map((task, index) => (
                  <Picker.Item key={index} label={task.scadenza} value={task.scadenza} />
                ))}
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

          <FlatList
            data={listaFiltrata}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <Card
                key={index}
                title={item.title}
                image={item.image}
                descrizione={item.descrizione}
                importanza={item.importanza}
                scadenza={item.scadenza}
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
    marginBottom: 10,
  },
  filterGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  picker: {
    height: 50,
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    elevation: 2,
  },
});

export default TaskList;
