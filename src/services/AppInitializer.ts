import { TaskCacheService } from './TaskCacheService';
import SyncManager from './SyncManager';
import StorageManager from './StorageManager';
import { getAllTasks, getCategories } from './taskService';

class AppInitializer {
  private static instance: AppInitializer;
  private initialized = false;
  
  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[APP_INIT] App già inizializzata');
      return;
    }

    try {
      console.log('[APP_INIT] Inizio inizializzazione app...');
      
      // 1. Inizializza i servizi
      const cacheService = TaskCacheService.getInstance();
      const syncManager = SyncManager.getInstance();
      const storageManager = StorageManager.getInstance();

      // 2. Controlla e pulisci storage se necessario
      const storageInfo = await storageManager.checkStorageLimit();
      if (storageInfo.isNearLimit) {
        console.log('[APP_INIT] Spazio storage limitato, pulizia automatica...');
        await storageManager.cleanupOldData();
      }

      // 3. Controlla se abbiamo dati in cache
      const hasCachedData = await cacheService.hasCachedData();
      
      if (!hasCachedData) {
        console.log('[APP_INIT] Nessun dato in cache, caricamento immediato...');
        // Avvia caricamento sincrono senza aspettare per non bloccare l'inizializzazione
        this.dataLoadPromise = this.loadDataSynchronously();
        this.dataLoadPromise.catch(error => 
          console.error('[APP_INIT] Errore caricamento dati:', error)
        );
      } else {
        console.log('[APP_INIT] Dati in cache presenti, verifica aggiornamento...');
        // I dati sono già disponibili dalla cache
        this.isDataLoaded = true;
        
        // Verifica se la cache è obsoleta
        const isCacheStale = await cacheService.isCacheStale();
        if (isCacheStale) {
          console.log('[APP_INIT] Cache obsoleta, aggiornamento sincrono in background');
          // Avvia sync sincrono per aggiornare i dati
          this.dataLoadPromise = this.loadDataSynchronously();
          this.dataLoadPromise.catch(error => 
            console.error('[APP_INIT] Errore aggiornamento dati:', error)
          );
        } else {
          console.log('[APP_INIT] Cache ancora valida, dati già disponibili');
        }
      }

      // 4. Controlla modifiche offline da sincronizzare
      const offlineChanges = await cacheService.getOfflineChanges();
      if (offlineChanges.length > 0) {
        console.log(`[APP_INIT] ${offlineChanges.length} modifiche offline da sincronizzare`);
        // Avvia sync per le modifiche offline
        syncManager.startSync().catch(error => 
          console.error('[APP_INIT] Errore sync offline changes:', error)
        );
      }

      // 5. Inizializza pulizie periodiche
      this.setupPeriodicMaintenance();

      this.initialized = true;
      console.log('[APP_INIT] Inizializzazione completata');
      
    } catch (error) {
      console.error('[APP_INIT] Errore nell\'inizializzazione:', error);
      // Non bloccare l'app anche se l'inizializzazione fallisce
    }
  }


  private async loadDataSynchronously(): Promise<void> {
    try {
      console.log('[APP_INIT] Inizio caricamento sincrono dati...');
      
      // Carica dati dal server in maniera sincrona
      const [tasks, categories] = await Promise.all([
        getAllTasks(false), // Non usare cache per caricamento iniziale
        getCategories(false)
      ]);

      // Salva nella cache immediatamente
      const cacheService = TaskCacheService.getInstance();
      await cacheService.saveTasks(tasks || [], categories || []);
      
      console.log(`[APP_INIT] Caricamento sincrono completato: ${(tasks || []).length} task e ${(categories || []).length} categorie`);
      
      // Notifica che i dati sono stati caricati
      this.notifyDataLoaded(tasks || [], categories || []);
      
    } catch (error) {
      console.error('[APP_INIT] Errore nel caricamento sincrono:', error);
      // In caso di errore, l'app continua a funzionare con dati vuoti o cached
      this.notifyDataLoaded([], []);
    }
  }

  private dataLoadPromise: Promise<void> | null = null;
  private isDataLoaded = false;

  private notifyDataLoaded(tasks: any[], categories: any[]): void {
    console.log('[APP_INIT] Dati caricati e disponibili per l\'app');
    this.isDataLoaded = true;
    // Qui potresti emettere un evento o chiamare callback se necessario
  }

  // Metodo per aspettare il caricamento dei dati se necessario
  async waitForDataLoad(timeout: number = 10000): Promise<boolean> {
    if (this.isDataLoaded) {
      return true;
    }

    if (!this.dataLoadPromise) {
      // Se non c'è un caricamento in corso, avvialo
      this.dataLoadPromise = this.loadDataSynchronously();
    }

    try {
      // Aspetta il caricamento con timeout
      await Promise.race([
        this.dataLoadPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      return this.isDataLoaded;
    } catch (error) {
      console.warn('[APP_INIT] Timeout o errore nell\'attesa dati:', error);
      return false;
    }
  }

  // Verifica se i dati sono stati caricati
  isDataReady(): boolean {
    return this.isDataLoaded;
  }

  private setupPeriodicMaintenance(): void {
    console.log('[APP_INIT] Setup manutenzione periodica');
    
    const storageManager = StorageManager.getInstance();
    
    // Pulizia storage ogni ora quando l'app è attiva
    setInterval(async () => {
      try {
        const storageInfo = await storageManager.checkStorageLimit();
        if (storageInfo.usage > 70) { // Se uso storage > 70%
          console.log('[MAINTENANCE] Avvio pulizia preventiva storage');
          await storageManager.cleanupOldData();
        }
      } catch (error) {
        console.error('[MAINTENANCE] Errore pulizia periodica:', error);
      }
    }, 60 * 60 * 1000); // 1 ora
  }

  async getInitializationStatus(): Promise<{
    initialized: boolean;
    cacheStats: {
      taskCount: number;
      categoryCount: number;
      lastSync: Date | null;
      offlineChanges: number;
      cacheSize: number;
    };
    storageStats: {
      totalSize: string;
      totalKeys: number;
      usage: string;
    };
  }> {
    const cacheService = TaskCacheService.getInstance();
    const storageManager = StorageManager.getInstance();
    
    const [cacheStats, storageReport] = await Promise.all([
      cacheService.getCacheStats(),
      storageManager.getStorageReport()
    ]);

    return {
      initialized: this.initialized,
      cacheStats,
      storageStats: storageReport.summary
    };
  }

  // Cleanup risorse quando l'app viene chiusa
  cleanup(): void {
    console.log('[APP_INIT] Cleanup risorse app');
    
    const syncManager = SyncManager.getInstance();
    syncManager.cleanup();
    
    this.initialized = false;
  }

  // Reset completo per debug/troubleshooting
  async reset(): Promise<void> {
    console.log('[APP_INIT] RESET COMPLETO DELL\'APP!');
    
    const cacheService = TaskCacheService.getInstance();
    const storageManager = StorageManager.getInstance();
    
    await cacheService.clearCache();
    await storageManager.resetStorage();
    
    this.initialized = false;
    
    // Reinizializza
    await this.initialize();
  }
}

export default AppInitializer;