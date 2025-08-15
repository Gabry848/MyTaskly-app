import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, Animated, Easing } from 'react-native';
import { styles } from './styles';
import { Task as TaskType, globalTasksRef } from './types';
import { TaskListHeader } from './TaskListHeader';
import eventEmitter, { EVENTS } from '../../src/utils/eventEmitter';
import { ActiveFilters } from './ActiveFilters';
import { FilterModal } from './FilterModal';
import { TaskSection } from './TaskSection';
import { AddTaskButton } from './AddTaskButton';
import { filterTasksByDay } from './TaskUtils';
import AddTask from '../AddTask';

interface TaskListContainerProps {
  categoryName: string;
  categoryId: string;
  Task: React.ComponentType<any>; // Componente Task
  taskService: {
    getTasks: (categoryId: string) => Promise<TaskType[]>;
    addTask: (task: any) => Promise<any>;
    deleteTask: (taskId: number | string) => Promise<void>;
    updateTask: (taskId: number | string, task: any) => Promise<any>;
    completeTask: (taskId: number | string) => Promise<void>;
    disCompleteTask: (taskId: number | string) => Promise<void>;
  };
}

export const TaskListContainer = ({
  categoryName,
  categoryId,
  Task,
  taskService
}: TaskListContainerProps) => {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [filtroImportanza, setFiltroImportanza] = useState("Tutte");
  const [filtroScadenza, setFiltroScadenza] = useState("Tutte");
  const [ordineScadenza, setOrdineScadenza] = useState("Recente");
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  
  // Stati per le sezioni collassabili
  const [todoSectionExpanded, setTodoSectionExpanded] = useState(true);
  const [completedSectionExpanded, setCompletedSectionExpanded] = useState(true);
  
  // Animated values per le animazioni di altezza
  const todoSectionHeight = useRef(new Animated.Value(1)).current;
  const completedSectionHeight = useRef(new Animated.Value(1)).current;

  // Initialize the global task adder function
  globalTasksRef.addTask = (newTask: TaskType, category: string) => {
    // Verify that it's a valid task with title
    if (!newTask || !newTask.title) {
      return;
    }
    
    // Ensure it has an ID - use task_id if available (from server response)
    const taskWithId = {
      ...newTask,
      id: newTask.id || newTask.task_id || Date.now()
    };
    
    // Update the local state directly if this is the current category
    if (category === categoryId) {
      setTasks(prevTasks => {
        // Check if task already exists
        const taskIndex = prevTasks.findIndex(
          task => task.id === taskWithId.id || 
                 (task.task_id && task.task_id === taskWithId.id) ||
                 (task.title === taskWithId.title && task.description === taskWithId.description)
        );
        
        if (taskIndex >= 0) {
          const updatedTasks = [...prevTasks];
          updatedTasks[taskIndex] = taskWithId;
          return updatedTasks;
        }
        
        return [...prevTasks, taskWithId];
      });
    }
    
    // Always update the global reference
    if (!globalTasksRef.tasks[category]) {
      globalTasksRef.tasks[category] = [];
    }
    
    // Check if task already exists in global ref
    const globalTaskIndex = globalTasksRef.tasks[category].findIndex(
      task => task.id === taskWithId.id || 
             (task.task_id && task.task_id === taskWithId.id) ||
             (task.title === taskWithId.title && task.description === taskWithId.description)
    );
    
    if (globalTaskIndex >= 0) {
      // Update existing task
      globalTasksRef.tasks[category][globalTaskIndex] = taskWithId;
    } else {
      // Add new task
      globalTasksRef.tasks[category].push(taskWithId);
    }
  };

  const fetchTasks = useCallback(async () => {
    try {
      const data = await taskService.getTasks(categoryId);
      setTasks(data);
      
      // Update global reference
      globalTasksRef.tasks[categoryName] = data;
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setIsLoading(false);
    }
  }, [categoryId, categoryName, taskService]);

  useEffect(() => {
    fetchTasks();
  }, [categoryId, fetchTasks]);

  // Update global reference when tasks state changes
  useEffect(() => {
    globalTasksRef.tasks[categoryName] = tasks;
  }, [tasks, categoryName]);

  // Setup listeners per aggiornamenti task in tempo reale
  useEffect(() => {
    const handleTaskAdded = (newTask: TaskType) => {
      // Solo aggiorna se il task appartiene a questa categoria
      if (newTask.category_name === categoryName || newTask.category_name === categoryId) {
        console.log('[TASK_LIST_CONTAINER] Task added event received for category:', categoryName, newTask.title);
        setTasks(prevTasks => {
          // Evita duplicati
          if (prevTasks.some(task => 
            (task.id === newTask.id) || 
            (task.task_id === newTask.task_id) ||
            (newTask.id && task.task_id === newTask.id) ||
            (newTask.task_id && task.id === newTask.task_id)
          )) {
            return prevTasks;
          }
          return [...prevTasks, newTask];
        });
      }
    };

    const handleTaskUpdated = (updatedTask: TaskType) => {
      console.log('[TASK_LIST_CONTAINER] Task updated event received for category:', categoryName, updatedTask.title);
      setTasks(prevTasks => {
        const newTasks = prevTasks.map(task => {
          const isMatch = (task.id === updatedTask.id) || 
                         (task.task_id === updatedTask.task_id) ||
                         (updatedTask.id && task.task_id === updatedTask.id) ||
                         (updatedTask.task_id && task.id === updatedTask.task_id);
          
          if (isMatch) {
            return { ...task, ...updatedTask };
          }
          return task;
        });
        
        // Se il task è stato spostato fuori da questa categoria, rimuovilo
        if (updatedTask.category_name && 
            updatedTask.category_name !== categoryName && 
            updatedTask.category_name !== categoryId) {
          return newTasks.filter(task => 
            task.id !== updatedTask.id && task.task_id !== updatedTask.task_id
          );
        }
        
        return newTasks;
      });
    };

    const handleTaskDeleted = (taskId: string | number) => {
      console.log('[TASK_LIST_CONTAINER] Task deleted event received for category:', categoryName, taskId);
      setTasks(prevTasks => 
        prevTasks.filter(task => 
          task.id !== taskId && task.task_id !== taskId
        )
      );
    };

    // Registra i listeners
    eventEmitter.on(EVENTS.TASK_ADDED, handleTaskAdded);
    eventEmitter.on(EVENTS.TASK_UPDATED, handleTaskUpdated);
    eventEmitter.on(EVENTS.TASK_DELETED, handleTaskDeleted);

    return () => {
      // Rimuovi i listeners
      eventEmitter.off(EVENTS.TASK_ADDED, handleTaskAdded);
      eventEmitter.off(EVENTS.TASK_UPDATED, handleTaskUpdated);
      eventEmitter.off(EVENTS.TASK_DELETED, handleTaskDeleted);
    };
  }, [categoryName, categoryId]);

  // Separiamo i task in completati e non completati
  const completedTasks = useMemo(() => {
    return tasks.filter(task => task.status === "Completato");
  }, [tasks]);
  
  const incompleteTasks = useMemo(() => {
    return tasks.filter(task => task.status !== "Completato");
  }, [tasks]);

  // Funzione per applicare i filtri e ordinare solo sui task non completati
  const listaFiltrata = useMemo(() => {
    // Prima filtra per importanza
    let filteredTasks = incompleteTasks.filter((task) => {
      const matchesImportanza =
        filtroImportanza === "Tutte" ||
        (filtroImportanza === "Alta" && task.priority === "Alta") ||
        (filtroImportanza === "Media" && task.priority === "Media") ||
        (filtroImportanza === "Bassa" && task.priority === "Bassa");
      
      return matchesImportanza;
    });
    
    // Poi applica il filtro per data
    if (filtroScadenza !== "Tutte") {
      filteredTasks = filterTasksByDay(filteredTasks, filtroScadenza);
    }
    
    // Infine ordina
    return filteredTasks.sort((a, b) => {
      // I task senza scadenza vanno sempre in fondo
      if (!a.end_time && !b.end_time) return 0;
      if (!a.end_time) return 1;
      if (!b.end_time) return -1;
      
      if (ordineScadenza === "Recente") {
        return new Date(b.end_time).getTime() - new Date(a.end_time).getTime();
      } else {
        return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
      }
    });
  }, [incompleteTasks, filtroImportanza, filtroScadenza, ordineScadenza]);

  const handleAddTask = async (
    title: string,
    description: string,
    dueDate: string,
    priority: number
  ) => {
    const priorityString = priority === 1 ? "Bassa" : priority === 2 ? "Media" : "Alta";
    
    const newTask: TaskType = {
      id: Date.now(),
      title,
      description: description || "", // Assicurarsi che description non sia null
      end_time: new Date(dueDate).toISOString(),
      priority: priorityString,
      completed: false,
      status: "In sospeso", // Impostare un valore predefinito per status
      start_time: new Date().toISOString() // Impostare start_time al momento attuale
    };
    
    try {
      // Attempt to save to backend
      const response = await taskService.addTask({
        ...newTask,
        category_name: categoryName,
      });
      
      // Check if the response contains status_code and task_id but not a complete task
      if (response && response.status_code && response.task_id && !response.title) {
        // Create a complete task object using the original data plus the ID from the server
        const finalTask: TaskType = {
          ...newTask,
          id: response.task_id,
          task_id: response.task_id,
          status_code: response.status_code
        };
        
        // Add to global reference and local state
        globalTasksRef.addTask(finalTask, categoryName);
      } else if (response && response.title) {
        // If server returns a complete task object
        globalTasksRef.addTask(response, categoryName);
      } else {
        // Use original task as fallback
        globalTasksRef.addTask(newTask, categoryName);
      }
    } catch (error) {
      console.error("Error adding task:", error);
      // Still add to local state even if backend fails
      globalTasksRef.addTask(newTask, categoryName);
      
      Alert.alert(
        "Attenzione",
        "Il task è stato aggiunto localmente ma c'è stato un errore nel salvataggio sul server."
      );
    }
  };

  // Funzione per gestire l'eliminazione del task
  const handleTaskDelete = async (taskId: number | string) => {
    try {
      // Aggiorniamo subito la lista locale per un feedback immediato
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      // Aggiorniamo anche la referenza globale
      if (globalTasksRef.tasks[categoryName]) {
        globalTasksRef.tasks[categoryName] = globalTasksRef.tasks[categoryName].filter(
          task => task.id !== taskId
        );
      }
      
      // Inviamo la richiesta di eliminazione al server in background
      await taskService.deleteTask(taskId);
    } catch (error) {
      console.error("Errore nell'eliminazione del task:", error);
      // Informiamo l'utente dell'errore ma non ripristiniamo il task
      Alert.alert(
        "Avviso",
        "Il task è stato rimosso localmente, ma c'è stato un errore durante l'eliminazione dal server."
      );
    }
  };

  // Funzione per gestire la modifica del task
  const handleTaskEdit = async (taskId: number | string, updatedTaskData: TaskType) => {
    try {
      // Prepara il task aggiornato mantenendo l'ID originale
      const taskToUpdate = {
        ...updatedTaskData,
        id: taskId
      };
      
      // Usa lo stesso meccanismo di addTask per aggiornare il task localmente
      globalTasksRef.addTask(taskToUpdate, categoryName);
      
      // Inviamo la richiesta di aggiornamento al server
      const response = await taskService.updateTask(taskId, updatedTaskData);
      
      // Se la risposta contiene dati aggiornati dal server, aggiorniamo lo stato con quei dati
      if (response && response.task_id) {
        const serverUpdatedTask = {
          ...response,
          id: taskId  // Mantieni l'ID originale per coerenza
        };
        
        // Aggiorna nuovamente con i dati del server
        globalTasksRef.addTask(serverUpdatedTask, categoryName);
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento del task:", error);
      
      // Mostra un avviso all'utente
      Alert.alert(
        "Errore di aggiornamento",
        "Si è verificato un problema durante l'aggiornamento del task. I dati potrebbero non essere sincronizzati con il server.",
        [{ text: "OK" }]
      );
      
      // Ricarica i dati dal server per mantenere la coerenza
      fetchTasks();
    }
  };

  // Funzione per aprire il form di aggiunta task
  const toggleForm = () => {
    setFormVisible(true);
  };

  // Funzione per chiudere il form di aggiunta task
  const handleCloseForm = () => {
    setFormVisible(false);
  };

  // Gestisce il toggle del completamento dei task
  const handleTaskComplete = async (taskId: number | string) => {
    try {
      await taskService.completeTask(taskId);
      
      // Aggiorna lo stato localmente
      setTasks(prevTasks => {
        return prevTasks.map(task => {
          if (task.id === taskId) {
            return { ...task, status: "Completato", completed: true };
          }
          return task;
        });
      });
      
      // Ricarica tutti i task per avere l'aggiornamento in tempo reale
      await fetchTasks();
    } catch (error) {
      console.error("Errore durante il completamento del task:", error);
      Alert.alert("Errore", "Impossibile completare il task. Riprova.");
    }
  };

  // Gestisce il ripristino di un task completato
  const handleTaskUncomplete = async (taskId: number | string) => {
    try {
      await taskService.disCompleteTask(taskId);
      
      // Aggiorna lo stato localmente
      setTasks(prevTasks => {
        return prevTasks.map(task => {
          if (task.id === taskId) {
            return { ...task, status: "In sospeso", completed: false };
          }
          return task;
        });
      });
      
      // Ricarica tutti i task per avere l'aggiornamento in tempo reale
      await fetchTasks();
    } catch (error) {
      console.error("Errore durante la riapertura del task:", error);
      Alert.alert("Errore", "Impossibile riaprire il task. Riprova.");
    }
  };

  // Funzione di animazione per le sezioni
  const toggleSection = (isExpanded: boolean, setExpanded: React.Dispatch<React.SetStateAction<boolean>>, heightValue: Animated.Value) => {
    setExpanded(!isExpanded);
    Animated.timing(heightValue, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false
    }).start();
  };

  return (
    <View style={styles.container}>
      <TaskListHeader 
        title={categoryName}
        onFilterPress={() => setModalVisible(true)}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#10e0e0" />
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {/* Modal dei filtri */}
          <FilterModal 
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            filtroImportanza={filtroImportanza}
            setFiltroImportanza={setFiltroImportanza}
            filtroScadenza={filtroScadenza}
            setFiltroScadenza={setFiltroScadenza}
            ordineScadenza={ordineScadenza}
            setOrdineScadenza={setOrdineScadenza}
          />

          {/* Visualizzazione filtri attivi */}
          <ActiveFilters 
            importanceFilter={filtroImportanza}
            deadlineFilter={filtroScadenza}
            onClearImportanceFilter={() => setFiltroImportanza("Tutte")}
            onClearDeadlineFilter={() => setFiltroScadenza("Tutte")}
          />

          {/* Sezione task non completati */}
          <TaskSection 
            title="Da fare"
            isExpanded={todoSectionExpanded}
            tasks={listaFiltrata}
            animatedHeight={todoSectionHeight}
            onToggle={() => toggleSection(todoSectionExpanded, setTodoSectionExpanded, todoSectionHeight)}
            renderTask={(item, index) => (
              <Task
                key={`task-${item.id || index}`}
                task={{
                  id: item.id || item.task_id || index,
                  title: item.title,
                  description: item.description,
                  priority: item.priority,
                  end_time: item.end_time,
                  completed: item.completed || false,
                  start_time: item.start_time || new Date().toISOString(),
                  status: item.status || "In sospeso"
                }}
                onTaskComplete={handleTaskComplete}
                onTaskDelete={handleTaskDelete}
                onTaskEdit={handleTaskEdit}
                onTaskUncomplete={handleTaskUncomplete}
              />
            )}
            emptyMessage="Non ci sono task da completare. Aggiungi un nuovo task!"
          />
          
          {/* Sezione task completati */}
          {completedTasks.length > 0 && (
            <TaskSection 
              title="Completati"
              isExpanded={completedSectionExpanded}
              tasks={completedTasks}
              animatedHeight={completedSectionHeight}
              onToggle={() => toggleSection(completedSectionExpanded, setCompletedSectionExpanded, completedSectionHeight)}
              renderTask={(item, index) => (
                <Task
                  key={`completed-task-${item.id || index}`}
                  task={{
                    id: item.id || item.task_id || index,
                    title: item.title,
                    description: item.description,
                    priority: item.priority,
                    end_time: item.end_time,
                    completed: true,
                    start_time: item.start_time || new Date().toISOString(),
                    status: "Completato"
                  }}
                  onTaskDelete={handleTaskDelete}
                  onTaskEdit={handleTaskEdit}
                  onTaskUncomplete={handleTaskUncomplete}
                />
              )}
              emptyMessage="Non ci sono task completati."
            />
          )}

          {/* Spazio per il pulsante flottante */}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
      
      <AddTaskButton onPress={toggleForm} />
      
      <AddTask 
        visible={formVisible} 
        onClose={handleCloseForm} 
        onSave={handleAddTask}
        categoryName={categoryName}
      />
    </View>
  );
};
