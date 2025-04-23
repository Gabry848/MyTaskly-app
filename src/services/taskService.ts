import axios from "axios";
import { getValidToken } from "./authService";
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
    const token = await getValidToken();
    if (!token) {
      return [];
    }

    if (category_name) {
      // ogni spazio viene sostituito con %20
      category_name = category_name.replace(/ /g, "%20");
      const response = await axios.get(`/tasks/${category_name}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(response.data);
      return response.data;
    }

    const response = await axios.get(`/tasks/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    return [];
  }
}

// funzione che restistuise gli utimi impegni
export async function getLastTask(last_n: number) {
  try {
    const token = await getValidToken();
    if (!token) {
      return [];
    }
    const response = await axios.get(`/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // restituisce gli ultimi n impegni
    let data = response.data.slice(-last_n);
    // ordina gli impegni in base alla data di fine
    data.sort((a: Task, b: Task) => {
      return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
    });
    return data;

  } catch (error) {
    console.log(error);
    return [];
  }
}
// funzione per ottenere tutti gli impegni
export async function getAllTasks() {
  try {
    const token = await getValidToken();
    if (!token) {
      return [];
    }
    const response = await axios.get(`/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    let data = response.data;
    data.sort((a: Task, b: Task) => {
      return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
    });
    return data;

  } catch (error) {
    console.log(error);
    return [];
  }
}

// Funzione per aggiornare un impegno esistente
export async function updateTask(
  taskId: string | number,
  updatedTask: Partial<Task>
) {
  try {
    const token = await getValidToken();
    if (!token) {
      return null;
    }
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
        Authorization: `Bearer ${token}`,
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
    const token = await getValidToken();
    if (!token) {
      return null;
    }
    const response = await axios.delete(`/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
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
    const token = await getValidToken();
    if (!token) {
      return null;
    }
    const username = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);

    // converti la priorita` da numero a stringa (1: bassa, 2: media, 3: alta)
    if (task.priority) {
      if (typeof task.priority === 'number') {
        task.priority = task.priority === 1 ? 'Bassa' : task.priority === 2 ? 'Media' : 'Alta';
      }
    }
    
    const data = {
      title: task.title,
      description: task.description || "",
      start_time: task.start_time || new Date().toISOString(), // Aggiunto con valore predefinito
      end_time: task.end_time,
      priority: task.priority,
      status: task.status || "In sospeso",
      category_name: task.category_name,
      user: task.user || username,
    };
    console.log("data: ", data);
    const response = await axios.post("/tasks", data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
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
    const token = await getValidToken();
    if (!token) {
      return null;
    }
    // Estrai solo le proprietà rilevanti per l'API
    const categoryData = {
      name: category.name,
      description: category.description || ""
    };
    
    console.log("Invio categoria al server:", categoryData);
    
    const response = await axios.post("/categories", categoryData, {
      headers: {
        Authorization: `Bearer ${token}`,
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
    const token = await getValidToken();
    if (!token) {
      return null;
    }
    const response = await axios.get(`/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Funzione per eliminare una categoria tramite il suo nome
export async function deleteCategory(categoryName: string) {
  try {
    const token = await getValidToken();
    if (!token) {
      return null;
    }
    console.log(categoryName)
    const response = await axios.delete(`/categories/${categoryName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
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
    const token = await getValidToken();
    if (!token) {
      return null;
    }
    const response = await axios.put(`/categories/${originalName}`, updatedCategory, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
