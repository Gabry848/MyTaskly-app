import axios from "./axiosInterceptor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/authConstants";
import TaskCacheService from './TaskCacheService';
import SyncManager from './SyncManager';

// Lazy initialization dei servizi per evitare problemi di caricamento
let cacheService: TaskCacheService | null = null;
let syncManager: SyncManager | null = null;

function getServices() {
  if (!cacheService) {
    cacheService = TaskCacheService.getInstance();
  }
  if (!syncManager) {
    syncManager = SyncManager.getInstance();
  }
  return { cacheService, syncManager };
}

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

// Funzione per ottenere tutti gli impegni filtrandoli per categoria (con cache)
export async function getTasks(category_name?: string, useCache: boolean = true) {
  try {
    // Se richiesto, prova prima dalla cache
    if (useCache) {
      const { cacheService } = getServices();
      const cachedTasks = await getServices().cacheService.getCachedTasks();
      if (cachedTasks.length > 0) {
        console.log('[TASK_SERVICE] Usando dati dalla cache');
        
        // Filtra per categoria se specificata
        if (category_name) {
          const filteredTasks = cachedTasks.filter(task => 
            task.category_name === category_name
          );
          
          // Avvia sync in background
          getServices().syncManager.addSyncOperation('GET_TASKS', { category_name });
          
          return filteredTasks;
        }
        
        // Avvia sync in background
        getServices().syncManager.addSyncOperation('GET_TASKS', {});
        
        return cachedTasks;
      }
    }
    
    // Fallback alla chiamata API diretta
    console.log('[TASK_SERVICE] Caricamento dalla API (cache vuota o disabilitata)');
    
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
    
    // In caso di errore, prova a restituire i dati cached come fallback
    if (useCache) {
      console.log('[TASK_SERVICE] Errore API, tentativo fallback cache');
      const cachedTasks = await getServices().cacheService.getCachedTasks();
      if (category_name) {
        return cachedTasks.filter(task => task.category_name === category_name);
      }
      return cachedTasks;
    }
    
    return [];
  }
}

// funzione che restistuise gli utimi impegni (con cache)
export async function getLastTask(last_n: number, useCache: boolean = true) {
  try {
    // Usa getAllTasks che ora funziona correttamente con cache
    const allTasks = await getAllTasks(useCache);
    
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
// funzione per ottenere tutti gli impegni (con cache)
export async function getAllTasks(useCache: boolean = true) {
  try {
    // Prova prima dalla cache se abilitata
    if (useCache) {
      const { cacheService } = getServices();
      const cachedTasks = await getServices().cacheService.getCachedTasks();
      if (cachedTasks.length > 0) {
        console.log('[TASK_SERVICE] getAllTasks: usando dati dalla cache');
        
        // Avvia sync in background
        getServices().syncManager.addSyncOperation('GET_TASKS', {});
        
        return cachedTasks;
      }
    }
    
    // Fallback alla logica originale
    console.log('[TASK_SERVICE] getAllTasks: caricamento dalla API');
    
    // Prima otteniamo tutte le categorie
    const categories = await getCategories(false); // Non usare cache per categorie in questo caso
    let allTasks: Task[] = [];
    
    if (categories && Array.isArray(categories)) {
      // Per ogni categoria, otteniamo i task
      for (const category of categories) {
        try {
          const categoryTasks = await getTasks(category.name, false); // Non usare cache per singole categorie
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
    
    // Salva nella cache se abbiamo ottenuto dati validi
    if (useCache && uniqueTasks.length > 0) {
      await getServices().cacheService.saveTasks(uniqueTasks, categories);
    }
    
    console.log("[getAllTasks] Task totali recuperati:", uniqueTasks.length);
    return uniqueTasks;

  } catch (error) {
    console.error("Errore nel recupero di tutti i task:", error);
    
    // Fallback alla cache in caso di errore
    if (useCache) {
      console.log('[TASK_SERVICE] Errore API, tentativo fallback cache in getAllTasks');
      const cachedTasks = await getServices().cacheService.getCachedTasks();
      return cachedTasks;
    }
    
    return [];
  }
}

// Funzione per aggiornare un impegno esistente (con cache e offline)
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

    // Aggiorna immediatamente la cache locale per UI reattiva
    const fullUpdatedTask = { ...updatedTask, id: taskId, task_id: taskId } as Task;
    await getServices().cacheService.updateTaskInCache(fullUpdatedTask);

    try {
      // Prova a inviare al server
      const response = await axios.put(`/tasks/${taskId}`, taskData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (networkError) {
      console.log('[TASK_SERVICE] Errore di rete, salvataggio offline per updateTask');
      
      // Salva la modifica offline
      await getServices().syncManager.saveOfflineChange('UPDATE', 'TASK', {
        id: taskId,
        task_id: taskId,
        ...taskData
      });
      
      // Restituisci i dati locali (la cache è già aggiornata)
      return fullUpdatedTask;
    }
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

// Funzione per eliminare un impegno (con cache e offline)
export async function deleteTask(taskId: string | number) {
  try {
    console.log("Eliminazione dell'impegno con ID:", taskId);
    
    // Rimuovi immediatamente dalla cache locale per UI reattiva
    await getServices().cacheService.removeTaskFromCache(taskId);
    
    try {
      // Prova a eliminare dal server
      const response = await axios.delete(`/tasks/${taskId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (networkError) {
      console.log('[TASK_SERVICE] Errore di rete, salvataggio offline per deleteTask');
      
      // Salva l'eliminazione offline
      await getServices().syncManager.saveOfflineChange('DELETE', 'TASK', {
        id: taskId,
        task_id: taskId
      });
      
      // Restituisci successo (la cache è già aggiornata)
      return { success: true, offline: true };
    }
  } catch (error) {
    throw error;
  }
}

// Funzione per aggiungere un nuovo impegno (con cache e offline)
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
    
    // Genera un ID temporaneo per il task locale
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempTask = { ...data, id: tempId, task_id: tempId };
    
    // Aggiungi immediatamente alla cache locale per UI reattiva
    await getServices().cacheService.updateTaskInCache(tempTask);
    
    console.log("data: ", data);
    console.log("Date formats - start_time:", data.start_time, "end_time:", data.end_time);
    console.log("Sending POST request to /tasks with headers:", {
      "Content-Type": "application/json",
    });
    
    try {
      // Prova a inviare al server
      const response = await axios.post("/tasks", data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("Task creation response:", response.data);
      
      // Aggiorna la cache con l'ID reale del server
      if (response.data && response.data.task_id) {
        const serverTask = { ...data, ...response.data };
        await getServices().cacheService.removeTaskFromCache(tempId); // Rimuovi il task temporaneo
        await getServices().cacheService.updateTaskInCache(serverTask); // Aggiungi quello con ID reale
      }
      
      return response.data;
    } catch (networkError) {
      console.log('[TASK_SERVICE] Errore di rete, salvataggio offline per addTask');
      
      // Salva l'aggiunta offline
      await getServices().syncManager.saveOfflineChange('CREATE', 'TASK', data);
      
      // Restituisci il task temporaneo (già in cache)
      return tempTask;
    }
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

// Funzione per ottenere tutte le categorie (con cache)
export async function getCategories(useCache: boolean = true) {
  try {
    // Prova prima dalla cache se abilitata
    if (useCache) {
      const cachedCategories = await getServices().cacheService.getCachedCategories();
      if (cachedCategories.length > 0) {
        console.log('[TASK_SERVICE] Usando categorie dalla cache');
        
        // Avvia sync in background
        getServices().syncManager.addSyncOperation('GET_TASKS', {});
        
        return cachedCategories;
      }
    }
    
    // Fallback alla chiamata API diretta
    console.log('[TASK_SERVICE] Caricamento categorie dalla API');
    const response = await axios.get(`/categories`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero delle categorie:", error);
    
    // In caso di errore, prova a restituire le categorie cached come fallback
    if (useCache) {
      console.log('[TASK_SERVICE] Errore API categorie, tentativo fallback cache');
      const cachedCategories = await getServices().cacheService.getCachedCategories();
      return cachedCategories;
    }
    
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
