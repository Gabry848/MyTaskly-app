import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, getAllTasks } from '../services/taskService';
import { TaskCacheService } from '../services/TaskCacheService';
import SyncManager, { SyncStatus } from '../services/SyncManager';

/**
 * Return type for useTaskCache hook
 */
export interface UseTaskCacheReturn {
  /** Cached tasks */
  tasks: Task[];
  /** Whether tasks are loading */
  isLoading: boolean;
  /** Current sync status */
  syncStatus: SyncStatus | null;
  /** Refresh tasks from cache */
  refreshTasks: () => Promise<void>;
  /** Get cache statistics */
  getCachedStats: () => Promise<{
    taskCount: number;
    categoryCount: number;
    lastSync: Date | null;
    offlineChanges: number;
    cacheSize: number;
  }>;
  /** Clear the cache */
  clearCache: () => Promise<void>;
  /** Force synchronization */
  forceSync: () => Promise<void>;
}

export const useTaskCache = (): UseTaskCacheReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  
  const cacheService = useRef(TaskCacheService.getInstance()).current;
  const syncManager = useRef(SyncManager.getInstance()).current;

  // Setup sync status listener
  useEffect(() => {
    const handleSyncStatus = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    syncManager.addSyncListener(handleSyncStatus);
    syncManager.getSyncStatus().then(setSyncStatus);

    return () => {
      syncManager.removeSyncListener(handleSyncStatus);
    };
  }, [syncManager]);

  // Carica i task con cache
  const refreshTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Prima carica dalla cache per UI immediata
      const cachedTasks = await cacheService.getCachedTasks();
      if (cachedTasks.length > 0) {
        setTasks(cachedTasks);
        setIsLoading(false); // UI immediatamente reattiva
      }

      // Poi carica dal server/cache con sync background
      const allTasks = await getAllTasks(true);
      if (Array.isArray(allTasks)) {
        setTasks(allTasks);
      }
    } catch (error) {
      console.error('[useTaskCache] Errore nel caricamento task:', error);
      
      // Fallback alla cache in caso di errore
      const cachedTasks = await cacheService.getCachedTasks();
      if (cachedTasks.length > 0) {
        setTasks(cachedTasks);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cacheService]);

  // Caricamento iniziale
  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  // Ottieni statistiche cache
  const getCachedStats = useCallback(async () => {
    return await cacheService.getCacheStats();
  }, [cacheService]);

  // Pulisci cache
  const clearCache = useCallback(async () => {
    await cacheService.clearCache();
    setTasks([]);
    await refreshTasks();
  }, [cacheService, refreshTasks]);

  // Forza sincronizzazione completa
  const forceSync = useCallback(async () => {
    await syncManager.forceFullSync();
    await refreshTasks();
  }, [syncManager, refreshTasks]);

  return {
    tasks,
    isLoading,
    syncStatus,
    refreshTasks,
    getCachedStats,
    clearCache,
    forceSync
  };
};