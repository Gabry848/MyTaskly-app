import axios from "./axiosInterceptor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/authConstants";

// Definizione dell'interfaccia Task
export interface Task {
  title: string;
  description?: string;
  status: string; // Reso obbligatorio
  start_time?: string; // Aggiunto
  end_time?: string;
  priority?: string;
  category_name?: string;
  user?: string;
  [key: string]: any; // per proprietà aggiuntive
}

// Funzione per ottenere tutti gli impegni filtrandoli per categoria
export async function getTasks(category_name?: string) {
  try {
    if (category_name) {
      // ogni spazio viene sostituito con %20
      category_name = category_name.replace(/ /g, "%20");
      const response = await axios.get(`/tasks/${category_name}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response.data);
      return response.data;
    }

    const response = await axios.get(`/tasks/`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dei task:", error);
    return [];
  }
}

// funzione che restistuise gli utimi impegni
export async function getLastTask(last_n: number) {
  try {
    // Usa getAllTasks che ora funziona correttamente
    const allTasks = await getAllTasks();
    
    if (!Array.isArray(allTasks) || allTasks.length === 0) {
      return [];
    }
    
    // restituisce gli ultimi n impegni
    let data = allTasks.slice(-last_n);
    // ordina gli impegni in base alla data di fine
    data.sort((a: Task, b: Task) => {
      // I task senza scadenza vanno in fondo
      if (!a.end_time && !b.end_time) return 0;
      if (!a.end_time) return 1;
      if (!b.end_time) return -1;
      
      return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
    });
    return data;

  } catch (error) {
    console.error("Errore nel recupero degli ultimi task:", error);
    return [];
  }
}
// funzione per ottenere tutti gli impegni
export async function getAllTasks() {
  try {
    // Prima otteniamo tutte le categorie
    const categories = await getCategories();
    let allTasks: Task[] = [];
    
    if (categories && Array.isArray(categories)) {
      // Per ogni categoria, otteniamo i task
      for (const category of categories) {
        try {
          const categoryTasks = await getTasks(category.name);
          if (Array.isArray(categoryTasks)) {
            allTasks = allTasks.concat(categoryTasks);
          }
        } catch (error) {
          console.warn(`Errore nel recupero task per categoria ${category.name}:`, error);
        }
      }
    }
    
    // Rimuovi duplicati basandosi sull'ID del task
    const uniqueTasks = allTasks.filter((task, index, self) => 
      index === self.findIndex((t) => t.task_id === task.task_id)
    );
    
    // Ordina i task per data di fine
    uniqueTasks.sort((a: Task, b: Task) => {
      // I task senza scadenza vanno in fondo
      if (!a.end_time && !b.end_time) return 0;
      if (!a.end_time) return 1;
      if (!b.end_time) return -1;
      
      return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
    });
    
    console.log("[getAllTasks] Task totali recuperati:", uniqueTasks.length);
    return uniqueTasks;

  } catch (error) {
    console.error("Errore nel recupero di tutti i task:", error);
    return [];
  }
}

// Funzione per aggiornare un impegno esistente
export async function updateTask(
  taskId: string | number,
  updatedTask: Partial<Task>
) {
  try {
    const status = updatedTask.status;
    console.log(status)
    // Assicura che tutti i parametri richiesti siano inclusi
    // e che i valori nulli/undefined siano gestiti
    const taskData = {
      title: updatedTask.title,
      description: updatedTask.description || null, // Invia null se non definito
      start_time: updatedTask.start_time || null, // Invia null se non definito
      end_time: updatedTask.end_time || null,     // Invia null se non definito
      priority: updatedTask.priority || null,   // Invia null se non definito
      status: status,
      category_name: updatedTask.category_name || null // Invia null se non definito
    };

    console.log("Updating task with data:", taskData); // Log per debug

    const response = await axios.put(`/tasks/${taskId}`, taskData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating task:", error.response?.data || error.message); // Log dettagliato dell'errore
    throw error;
  }
}

// Funzione per segnare un task come completato
export async function completeTask(taskId: string | number) {
  try {
    // Recupera il task esistente per ottenere i dati attuali
    // Nota: questo richiede un endpoint GET /tasks/{taskId} che potrebbe non esistere.
    // Se non esiste, potresti dover passare tutti i dati necessari o modificare l'API.
    // Alternativamente, si può passare solo lo stato.
    // Qui assumiamo che l'API permetta di aggiornare solo lo stato.
    const updatedTaskData = {
      status: "Completato",
    };

    // Utilizza la funzione updateTask esistente
    const updatedTask = await updateTask(taskId, updatedTaskData);
    console.log("Task completato:", updatedTask);
    return updatedTask;
  } catch (error) {
    console.error("Errore nel completare il task:", error);
    throw error;
  }
}

//funzione per discompletare un task
export async function disCompleteTask(taskId: string | number) {
  try {
    // Recupera il task esistente per ottenere i dati attuali
    // Nota: questo richiede un endpoint GET /tasks/{taskId} che potrebbe non esistere.
    // Se non esiste, potresti dover passare tutti i dati necessari o modificare l'API.
    // Alternativamente, si può passare solo lo stato.
    // Qui assumiamo che l'API permetta di aggiornare solo lo stato.
    const updatedTaskData = {
      status: "In sospeso",
    };

    // Utilizza la funzione updateTask esistente
    const updatedTask = await updateTask(taskId, updatedTaskData);
    console.log("Task discompletato:", updatedTask);
    return updatedTask;
  } catch (error) {
    console.error("Errore nel discompletare il task:", error);
    throw error;
  }
}

// Funzione per eliminare un impegno
export async function deleteTask(taskId: string | number) {
  try {
    console.log("Eliminazione dell'impegno con ID:", taskId);
    const response = await axios.delete(`/tasks/${taskId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Funzione per aggiungere un nuovo impegno
export async function addTask(task: Task) {
  try {
    const username = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);

    // converti la priorita` da numero a stringa (1: bassa, 2: media, 3: alta)
    if (task.priority) {
      if (typeof task.priority === 'number') {
        task.priority = task.priority === 1 ? 'Bassa' : task.priority === 2 ? 'Media' : 'Alta';
      }
    }
    
    // Assicurati che le date siano nel formato corretto
    const startTime = task.start_time ? new Date(task.start_time) : new Date();
    const endTime = task.end_time ? new Date(task.end_time) : null;
    
    // Validazione: end_time deve essere successiva a start_time
    if (endTime && endTime <= startTime) {
      console.warn("⚠️ ATTENZIONE: end_time è precedente o uguale a start_time");
      console.warn("start_time:", startTime.toISOString());
      console.warn("end_time:", endTime.toISOString());
    }
    
    const data = {
      title: task.title,
      description: task.description || "",
      start_time: startTime.toISOString(),
      end_time: endTime ? endTime.toISOString() : null,
      priority: task.priority,
      status: task.status || "In sospeso",
      category_name: task.category_name,
      user: task.user || username,
    };
    console.log("data: ", data);
    console.log("Date formats - start_time:", data.start_time, "end_time:", data.end_time);
    console.log("Sending POST request to /tasks with headers:", {
      "Content-Type": "application/json",
    });
    const response = await axios.post("/tasks", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Task creation response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiunta del task:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      console.error("Response headers:", error.response.headers);
    }
    throw error;
  }
}

// Funzione per aggiungere una nuova categoria
export async function addCategory(category: {
  id?: string | number;  // Reso opzionale per compatibilità con l'oggetto passato
  name: string;
  description?: string;
}) {
  try {
    // Estrai solo le proprietà rilevanti per l'API
    const categoryData = {
      name: category.name,
      description: category.description || ""
    };
    
    console.log("Invio categoria al server:", categoryData);
    
    const response = await axios.post("/categories", categoryData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    // Aggiungi l'id alla risposta se non è presente
    const responseData = response.data;
    if (!responseData.id && category.id) {
      responseData.id = category.id;
    }
    
    console.log("Risposta dal server:", responseData);
    return responseData;
  } catch (error) {
    console.error("Errore in addCategory:", error);
    throw error;
  }
}

// Funzione per ottenere tutte le categorie
export async function getCategories() {
  try {
    const response = await axios.get(`/categories`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero delle categorie:", error);
    throw error;
  }
}

// Funzione per eliminare una categoria tramite il suo nome
export async function deleteCategory(categoryName: string) {
  try {
    console.log(categoryName)
    const response = await axios.delete(`/categories/${categoryName}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Errore nell'eliminazione della categoria:", error);
    throw error;
  }
}

// Funzione per aggiornare una categoria esistente
export async function updateCategory(
  originalName: string, 
  updatedCategory: { 
    name: string; 
    description?: string;
  }
) {
  try {
    const response = await axios.put(`/categories/${originalName}`, updatedCategory, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Errore nell'aggiornamento della categoria:", error);
    throw error;
  }
}
