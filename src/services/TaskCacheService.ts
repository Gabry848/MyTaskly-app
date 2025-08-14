import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from './taskService';
import { STORAGE_KEYS } from '../constants/authConstants';

// Estendi STORAGE_KEYS per includere le nuove chiavi
export const CACHE_KEYS = {
  ...STORAGE_KEYS,
  TASKS_CACHE: 'tasks_cache',
  CATEGORIES_CACHE: 'categories_cache',
  LAST_SYNC_TIMESTAMP: 'last_sync_timestamp',
  OFFLINE_CHANGES: 'offline_changes',
  CACHE_VERSION: 'cache_version'
};

export interface Category {
  id?: string | number;
  name: string;
  description?: string;
}

export interface TasksCache {
  tasks: Task[];
  categories: Category[];
  lastSync: number;
  version: number;
}

export interface OfflineChange {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'TASK' | 'CATEGORY';
  data: any;
  timestamp: number;
}

class TaskCacheService {
  private static instance: TaskCacheService;
  private currentCacheVersion = 1;

  static getInstance(): TaskCacheService {
    if (!TaskCacheService.instance) {
      TaskCacheService.instance = new TaskCacheService();
    }
    return TaskCacheService.instance;
  }

  // Carica i task dalla cache AsyncStorage
  async getCachedTasks(): Promise<Task[]> {
    try {
      console.log('[CACHE] Caricamento task dalla cache...');
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.TASKS_CACHE);
      
      if (!cachedData) {
        console.log('[CACHE] Nessun dato in cache trovato');
        return [];
      }

      const cache: TasksCache = JSON.parse(cachedData);
      
      // Verifica la versione della cache
      if (cache.version !== this.currentCacheVersion) {
        console.log('[CACHE] Versione cache obsoleta, pulizia...');
        await this.clearCache();
        return [];
      }

      console.log(`[CACHE] Caricati ${cache.tasks.length} task dalla cache`);
      
      // Log dettagliato di ogni task in cache per debug
      cache.tasks.forEach((task, index) => {
        console.log(`[CACHE] Task ${index + 1}: titolo="${task.title}", categoria="${task.category_name}", status="${task.status}"`);
      });
      
      return cache.tasks || [];
    } catch (error) {
      console.error('[CACHE] Errore nel caricamento dalla cache:', error);
      return [];
    }
  }

  // Carica le categorie dalla cache
  async getCachedCategories(): Promise<Category[]> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.TASKS_CACHE);
      
      if (!cachedData) {
        return [];
      }

      const cache: TasksCache = JSON.parse(cachedData);
      return cache.categories || [];
    } catch (error) {
      console.error('[CACHE] Errore nel caricamento categorie dalla cache:', error);
      return [];
    }
  }

  // Salva i task nella cache
  async saveTasks(tasks: Task[], categories: Category[] = []): Promise<void> {
    try {
      console.log(`[CACHE] Salvando ${tasks.length} task in cache...`);
      
      // Log di ogni task prima del salvataggio
      tasks.forEach((task, index) => {
        console.log(`[CACHE] Salvando Task ${index + 1}: titolo="${task.title}", categoria="${task.category_name}", status="${task.status}"`);
        if (task.category_name === undefined || task.category_name === "undefined") {
          console.warn(`[CACHE] ⚠️ ATTENZIONE: Task "${task.title}" ha category_name undefined!`);
        }
      });
      
      const cache: TasksCache = {
        tasks,
        categories,
        lastSync: Date.now(),
        version: this.currentCacheVersion
      };

      await AsyncStorage.setItem(CACHE_KEYS.TASKS_CACHE, JSON.stringify(cache));
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC_TIMESTAMP, cache.lastSync.toString());
      
      console.log(`[CACHE] Salvati ${tasks.length} task e ${categories.length} categorie in cache`);
    } catch (error) {
      console.error('[CACHE] Errore nel salvataggio in cache:', error);
    }
  }

  // Salva singolo task nella cache (per aggiornamenti)
  async updateTaskInCache(updatedTask: Task): Promise<void> {
    try {
      console.log(`[CACHE] Aggiornando task in cache: "${updatedTask.title}", categoria="${updatedTask.category_name}"`);
      
      // Warn se il task ha category_name undefined
      if (!updatedTask.category_name || updatedTask.category_name === 'undefined') {
        console.warn(`[CACHE] ⚠️ ATTENZIONE: Tentativo di salvare task "${updatedTask.title}" con category_name undefined!`);
      }
      
      const cachedTasks = await this.getCachedTasks();
      const taskIndex = cachedTasks.findIndex(task => 
        task.task_id === updatedTask.task_id || task.id === updatedTask.id
      );

      if (taskIndex !== -1) {
        cachedTasks[taskIndex] = updatedTask;
        console.log(`[CACHE] Task esistente aggiornato all'indice ${taskIndex}`);
      } else {
        cachedTasks.push(updatedTask);
        console.log(`[CACHE] Nuovo task aggiunto alla cache`);
      }

      const categories = await this.getCachedCategories();
      await this.saveTasks(cachedTasks, categories);
    } catch (error) {
      console.error('[CACHE] Errore nell\'aggiornamento task in cache:', error);
    }
  }

  // Rimuovi task dalla cache
  async removeTaskFromCache(taskId: string | number): Promise<void> {
    try {
      const cachedTasks = await this.getCachedTasks();
      const filteredTasks = cachedTasks.filter(task => 
        task.task_id !== taskId && task.id !== taskId
      );

      const categories = await this.getCachedCategories();
      await this.saveTasks(filteredTasks, categories);
    } catch (error) {
      console.error('[CACHE] Errore nella rimozione task dalla cache:', error);
    }
  }

  // Ottieni timestamp dell'ultima sincronizzazione
  async getLastSyncTimestamp(): Promise<number> {
    try {
      const timestamp = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC_TIMESTAMP);
      return timestamp ? parseInt(timestamp, 10) : 0;
    } catch (error) {
      console.error('[CACHE] Errore nel recupero timestamp sync:', error);
      return 0;
    }
  }

  // Salva una modifica offline per la sincronizzazione futura
  async saveOfflineChange(change: OfflineChange): Promise<void> {
    try {
      const existingChanges = await this.getOfflineChanges();
      existingChanges.push(change);
      
      await AsyncStorage.setItem(CACHE_KEYS.OFFLINE_CHANGES, JSON.stringify(existingChanges));
      console.log('[CACHE] Modifica offline salvata:', change.type, change.entityType);
    } catch (error) {
      console.error('[CACHE] Errore nel salvataggio modifica offline:', error);
    }
  }

  // Ottieni tutte le modifiche offline pendenti
  async getOfflineChanges(): Promise<OfflineChange[]> {
    try {
      const changesData = await AsyncStorage.getItem(CACHE_KEYS.OFFLINE_CHANGES);
      return changesData ? JSON.parse(changesData) : [];
    } catch (error) {
      console.error('[CACHE] Errore nel recupero modifiche offline:', error);
      return [];
    }
  }

  // Pulisci le modifiche offline dopo la sincronizzazione
  async clearOfflineChanges(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.OFFLINE_CHANGES);
      console.log('[CACHE] Modifiche offline pulite');
    } catch (error) {
      console.error('[CACHE] Errore nella pulizia modifiche offline:', error);
    }
  }

  // Verifica se ci sono dati in cache
  async hasCachedData(): Promise<boolean> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.TASKS_CACHE);
      return !!cachedData;
    } catch (error) {
      console.error('[CACHE] Errore nella verifica cache:', error);
      return false;
    }
  }

  // Pulisci completamente la cache
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        CACHE_KEYS.TASKS_CACHE,
        CACHE_KEYS.CATEGORIES_CACHE,
        CACHE_KEYS.LAST_SYNC_TIMESTAMP,
        CACHE_KEYS.OFFLINE_CHANGES
      ]);
      console.log('[CACHE] Cache completamente pulita');
    } catch (error) {
      console.error('[CACHE] Errore nella pulizia cache:', error);
    }
  }

  // Controlla e pulisce la cache se i task hanno category_name corrotti
  async checkAndFixCorruptedCache(): Promise<boolean> {
    try {
      const cachedTasks = await this.getCachedTasks();
      const corruptedTasks = cachedTasks.filter(task => 
        !task.category_name || task.category_name === 'undefined'
      );
      
      if (corruptedTasks.length > 0) {
        console.log(`[CACHE] 🔧 Trovati ${corruptedTasks.length} task con category_name corrotto, pulizia cache...`);
        await this.clearCache();
        return true; // Indica che la cache è stata pulita
      }
      return false; // Indica che la cache è ok
    } catch (error) {
      console.error('[CACHE] Errore nel controllo della cache corrotta:', error);
      return false;
    }
  }

  // Ottieni statistiche della cache
  async getCacheStats(): Promise<{
    taskCount: number;
    categoryCount: number;
    lastSync: Date | null;
    offlineChanges: number;
    cacheSize: number;
  }> {
    try {
      const tasks = await this.getCachedTasks();
      const categories = await this.getCachedCategories();
      const lastSyncTimestamp = await this.getLastSyncTimestamp();
      const offlineChanges = await this.getOfflineChanges();
      
      // Calcola dimensione approssimativa della cache
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.TASKS_CACHE);
      const cacheSize = cachedData ? new Blob([cachedData]).size : 0;

      return {
        taskCount: tasks.length,
        categoryCount: categories.length,
        lastSync: lastSyncTimestamp ? new Date(lastSyncTimestamp) : null,
        offlineChanges: offlineChanges.length,
        cacheSize
      };
    } catch (error) {
      console.error('[CACHE] Errore nel calcolo statistiche cache:', error);
      return {
        taskCount: 0,
        categoryCount: 0,
        lastSync: null,
        offlineChanges: 0,
        cacheSize: 0
      };
    }
  }

  // Verifica se la cache è obsoleta (oltre 1 ora)
  async isCacheStale(maxAge: number = 3600000): Promise<boolean> { // 1 ora default
    const lastSync = await this.getLastSyncTimestamp();
    const now = Date.now();
    return (now - lastSync) > maxAge;
  }
}

export default TaskCacheService;
export { TaskCacheService };