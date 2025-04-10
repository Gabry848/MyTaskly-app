import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { Task, getAllTasks } from '../src/services/taskService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import CalendarGrid from './CalendarGrid';
import TaskCard from './TaskCard';

const CalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [tasks, setTasks] = useState<Task[]>([]);

  // Funzione per caricare gli impegni
  const fetchTasks = useCallback(async () => {
    try {
      const tasksData = await getAllTasks();
      if (Array.isArray(tasksData)) {
        setTasks(tasksData);
      }
    } catch (error) {
      console.error("Errore nel recupero degli impegni:", error);
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
      const taskDate = task.start_time ? 
        dayjs(task.start_time).format('YYYY-MM-DD') : null;
      return taskDate === selectedDate;
    });
  };

  // Gestisce il click su una task
  const handleTaskPress = (task: Task) => {
    console.log("Task selezionato:", task);
    // Qui puoi implementare la navigazione ai dettagli della task
  };

  return (
    <View style={styles.calendarContainer}>
      {/* Griglia del calendario */}
      <CalendarGrid
        selectedDate={selectedDate}
        tasks={tasks}
        onSelectDate={selectDate}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
      />
      
      {/* Lista degli impegni per la data selezionata */}
      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateTitle}>
          Impegni del {dayjs(selectedDate).format('DD MMMM YYYY')}
        </Text>
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
        ) : (
          <View style={styles.noTasksContainer}>
            <Ionicons name="calendar-outline" size={50} color="#ccc" />
            <Text style={styles.noTasksText}>
              Nessun impegno per questa data
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    flex: 1,
    padding: 10,
  },
  selectedDateHeader: {
    marginTop: 10,
    marginBottom: 5,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  taskList: {
    flex: 1,
  },
  noTasksContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  noTasksText: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 10,
  },
});

export default CalendarView;