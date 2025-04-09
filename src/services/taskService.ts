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
    let tasks = response.data.slice(-last_n);
    // Ordina gli impegni per data di scadenza
    response.data.sort((a: Task, b: Task) => {
      return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
    });
    return tasks;

  } catch (error) {
    console.log(error);
    return [];
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

    // Assicura che tutti i parametri richiesti siano inclusi
    const taskData = {
      title: updatedTask.title,
      description: updatedTask.description || "",
      start_time: updatedTask.start_time,
      end_time: updatedTask.end_time,
      priority: updatedTask.priority,
      status: updatedTask.status,
    };

    const response = await axios.put(`/tasks/${taskId}`, taskData, {
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
