import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import dayjs from 'dayjs';
import { Task, getAllTasks, addTask } from '../src/services/taskService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import CalendarGrid from './CalendarGrid';
import TaskCard from './TaskCard';
import AddTask from './AddTask';
import AddTaskButton from './AddTaskButton';
import { addTaskToList } from './TaskList/types';

const CalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);

  // Funzione per caricare gli impegni
  const fetchTasks = useCallback(async () => {
    try {
      console.log("[CALENDAR] Inizio caricamento task...");
      const tasksData = await getAllTasks();
      console.log("[CALENDAR] Task ricevuti:", tasksData);
      if (Array.isArray(tasksData)) {
        setTasks(tasksData);
        console.log("[CALENDAR] Task impostati correttamente:", tasksData.length, "task");
      } else {
        console.warn("[CALENDAR] I dati ricevuti non sono un array:", tasksData);
      }
    } catch (error) {
      console.error("[CALENDAR] Errore nel recupero degli impegni:", error);
      if (error.response) {
        console.error("[CALENDAR] Dettagli errore:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
    }
  }, []);

  // Carica gli impegni quando il componente si monta
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Aggiorna gli impegni quando la schermata riceve il focus
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  // Naviga al mese precedente
  const goToPreviousMonth = () => {
    const newDate = dayjs(selectedDate).subtract(1, 'month').format('YYYY-MM-DD');
    setSelectedDate(newDate);
  };
  
  // Naviga al mese successivo
  const goToNextMonth = () => {
    const newDate = dayjs(selectedDate).add(1, 'month').format('YYYY-MM-DD');
    setSelectedDate(newDate);
  };
  
  // Seleziona una data specifica
  const selectDate = (date: string | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Ottieni gli impegni per la data selezionata
  const getTasksForSelectedDate = () => {
    return tasks.filter(task => {
      const taskDate = task.end_time ? 
        dayjs(task.end_time).format('YYYY-MM-DD') : null;
      return taskDate === selectedDate;
    });
  };

  // Gestisce il click su una task
  const handleTaskPress = (task: Task) => {
    console.log("Task selezionato:", task);
    // Qui puoi implementare la navigazione ai dettagli della task
  };

  // Gestisce l'apertura del form per aggiungere un task
  const handleAddTask = () => {
    setShowAddTask(true);
  };

  // Gestisce la chiusura del form
  const handleCloseAddTask = () => {
    setShowAddTask(false);
  };

  // Gestisce il salvataggio di un nuovo task
  const handleSaveTask = async (
    title: string,
    description: string,
    dueDate: string,
    priority: number,
    categoryNameParam?: string
  ) => {
    const priorityString = priority === 1 ? "Bassa" : priority === 2 ? "Media" : "Alta";
    // Costruisci nuovo task con data di inizio dal calendario
    const category = categoryNameParam || "Calendario";
    const newTask = {
      id: Date.now(),
      title: title.trim(),
      description: description || "",
      start_time: dayjs(selectedDate).toISOString(),
      end_time: new Date(dueDate).toISOString(),
      priority: priorityString,
      status: "In sospeso",
      category_name: category,
    };
    try {
      const response = await addTask({ ...newTask, category_name: category });
      if (response && response.status_code && response.task_id && !response.title) {
        const finalTask = { ...newTask, id: response.task_id, task_id: response.task_id, status_code: response.status_code };
        addTaskToList(finalTask, category);
      } else if (response && response.title) {
        addTaskToList(response, category);
      } else {
        addTaskToList(newTask, category);
      }
      setShowAddTask(false);
    } catch (error) {
      console.error("Errore aggiunta task nel calendario:", error);
      addTaskToList(newTask, category);
      Alert.alert(
        "Attenzione",
        "Task aggiunto localmente ma errore nel salvataggio sul server."
      );
      setShowAddTask(false);
    }
  };  return (
    <View style={styles.calendarContainer}>
      {/* Griglia del calendario */}
      <CalendarGrid
        selectedDate={selectedDate}
        tasks={tasks}
        onSelectDate={selectDate}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
      />
      
      {/* Intestazione con titolo e pulsante per aggiungere task */}
      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateTitle}>
          Impegni del {dayjs(selectedDate).format('DD MMMM YYYY')}
        </Text>
        <AddTaskButton onPress={handleAddTask} />
      </View>
      
      <ScrollView style={styles.taskList}>
        {getTasksForSelectedDate().length > 0 ? (
          getTasksForSelectedDate().map((task) => (
            <TaskCard 
              key={task.id || `task-${task.title}-${task.start_time}`} 
              task={task} 
              onPress={handleTaskPress}
            />
          ))
        ) : (          <View style={styles.noTasksContainer}>
            <Ionicons name="calendar-outline" size={48} color="#cccccc" />
            <Text style={styles.noTasksText}>
              Nessun impegno per questa data
            </Text>
            <AddTaskButton onPress={handleAddTask} />
          </View>
        )}
      </ScrollView>

      {/* Componente AddTask con selezione categorie abilitata */}
      <AddTask 
        visible={showAddTask} 
        onClose={handleCloseAddTask}
        onSave={handleSaveTask}
        allowCategorySelection={true}
        categoryName="Calendario"
        initialDate={selectedDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  selectedDateHeader: {
    marginTop: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: "300",
    color: "#000000",
    fontFamily: "System",
    letterSpacing: -0.5,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 5,
  },
  noTasksContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  noTasksText: {
    fontSize: 16,
    color: "#999999",
    marginTop: 15,
    marginBottom: 25,
    textAlign: "center",
    fontFamily: "System",
    fontWeight: "300",
  },
  addButton: {
    backgroundColor: "#000000",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addTaskButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  addTaskButtonText: {
    color: "#ffffff",
    fontWeight: "500",
    fontSize: 15,
    fontFamily: "System",
  }
});

export default CalendarView;