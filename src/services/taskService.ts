import axios from "axios";
import { getValidToken } from "./authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/authConstants";

// Definizione dell'interfaccia Task
export interface Task {
  title: string;
  description?: string;
  status?: string;
  end_time?: string;
  priority?: string;
  category_name?: string;
  user?: string; // aggiunto
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
      end_time: task.end_time,
      priority: task.priority,
      status: task.status || "In sospeso",
      category_name: task.category_name,
      user: task.user || username,
    };
    console.log(data);
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
    const response = await axios.put(`/tasks/${taskId}`, updatedTask, {
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
  name: string;
  description?: string;
}) {
  try {
    const token = await getValidToken();
    if (!token) {
      return null;
    }
    const response = await axios.post("/categories", category, {
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
