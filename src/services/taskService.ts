import axios from 'axios';
import { getValidToken } from "./authService";

// Definizione dell'interfaccia Task
export interface Task {
  id?: string | number;
  title: string;
  description?: string;
  completed?: boolean;
  dueDate?: string;
  priority?: string;
  [key: string]: any; // per proprietà aggiuntive
}

// Funzione per ottenere tutti gli impegni
export async function getTasks() {
  try {
    const token = await getValidToken();
    if (!token) {
      console.error('Token non valido o scaduto');
      return [];
    }
    const response = await axios.get('/tasks', {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero degli impegni:', error);
    return [];
  }
}

// Funzione per aggiungere un nuovo impegno
export async function addTask(task: Task) {
  try {
    const token = await getValidToken();
    if (!token) {
      console.error('Token non valido o scaduto');
      return null;
    }
    const response = await axios.post('/tasks', task, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiunta dell\'impegno:', error);
    throw error;
  }
}

// Funzione per aggiornare un impegno esistente
export async function updateTask(taskId: string | number, updatedTask: Partial<Task>) {
  try {
    const token = await getValidToken();
    if (!token) {
      console.error('Token non valido o scaduto');
      return null;
    }
    const response = await axios.put(`/tasks/${taskId}`, updatedTask, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'impegno:', error);
    throw error;
  }
}

// Funzione per eliminare un impegno
export async function deleteTask(taskId: string | number) {
  try {
    const token = await getValidToken();
    if (!token) {
      console.error('Token non valido o scaduto');
      return null;
    }
    const response = await axios.delete(`/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'impegno:', error);
    throw error;
  }
}

// Funzione per aggiungere una nuova categoria
export async function addCategory(category: { name: string; description?: string }) {
  try {
    const token = await getValidToken();
    if (!token) {
      console.error('Token non valido o scaduto');
      return null;
    }
    const response = await axios.post('/categories', category, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiunta della categoria:', error);
    throw error;
  }
}

// Funzione per ottenere tutte le categorie
export async function getCategories() {
  try {
    const token = await getValidToken();
    if (!token) {
      console.error('Token non valido o scaduto');
      return null;
    }
    const response = await axios.get(`/categories/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero della categoria:', error);
    throw error;
  }
}

// Funzione per eliminare una categoria tramite il suo nome
export async function deleteCategory(categoryName: string) {
  try {
    const token = await getValidToken();
    if (!token) {
      console.error('Token non valido o scaduto');
      return null;
    }
    const response = await axios.delete(`/categories/${categoryName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'eliminazione della categoria:', error);
    throw error;
  }
}