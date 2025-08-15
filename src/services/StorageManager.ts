import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_KEYS } from './TaskCacheService';

interface StorageInfo {
  totalSize: number;
  keys: string[];
  usage: { [key: string]: number };
}

class StorageManager {
  private static instance: StorageManager;
  private maxCacheSize = 50 * 1024 * 1024; // 50MB limit
  private maxAge = 7 * 24 * 60 * 60 * 1000; // 7 giorni

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // Comprimi dati prima del salvataggio
  async compressData(data: any): Promise<string> {
    try {
      // Rimuovi proprietà null/undefined per ridurre dimensioni
      const cleanData = this.removeEmptyValues(data);
      
      // Serializza con ottimizzazioni
      return JSON.stringify(cleanData, (key, value) => {
        // Riduci precisione dei timestamp (secondi invece di millisecondi)
        if (key.includes('time') && typeof value === 'string') {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return Math.floor(date.getTime() / 1000);
          }
        }
        return value;
      });
    } catch (error) {
      console.error('[STORAGE] Errore nella compressione:', error);
      return JSON.stringify(data);
    }
  }

  // Decomprimi dati dopo il caricamento
  async decompressData(compressedData: string): Promise<any> {
    try {
      return JSON.parse(compressedData, (key, value) => {
        // Riconverti i timestamp compressi
        if (key.includes('time') && typeof value === 'number') {
          return new Date(value * 1000).toISOString();
        }
        return value;
      });
    } catch (error) {
      console.error('[STORAGE] Errore nella decompressione:', error);
      return JSON.parse(compressedData);
    }
  }

  // Rimuovi valori vuoti/null per ottimizzare spazio
  private removeEmptyValues(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeEmptyValues(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
      const cleaned: any = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value !== null && value !== undefined && value !== '') {
          cleaned[key] = this.removeEmptyValues(value);
        }
      });
      return cleaned;
    }
    
    return obj;
  }

  // Ottieni informazioni sull'utilizzo dello storage
  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const usage: { [key: string]: number } = {};
      let totalSize = 0;

      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            usage[key] = size;
            totalSize += size;
          }
        } catch (error) {
          console.warn(`[STORAGE] Errore nel calcolo dimensione per ${key}:`, error);
        }
      }

      return {
        totalSize,
        keys,
        usage
      };
    } catch (error) {
      console.error('[STORAGE] Errore nel calcolo info storage:', error);
      return { totalSize: 0, keys: [], usage: {} };
    }
  }

  // Pulisci dati vecchi automaticamente
  async cleanupOldData(maxAge: number = this.maxAge): Promise<void> {
    try {
      console.log('[STORAGE] Inizio pulizia dati vecchi...');
      const now = Date.now();
      const keys = await AsyncStorage.getAllKeys();
      
      const keysToRemove: string[] = [];

      for (const key of keys) {
        try {
          // Skip delle chiavi di sistema importanti
          if (this.isSystemKey(key)) {
            continue;
          }

          const value = await AsyncStorage.getItem(key);
          if (!value) continue;

          // Prova a parsare e controllare il timestamp
          const data = JSON.parse(value);
          if (data && data.timestamp && (now - data.timestamp) > maxAge) {
            keysToRemove.push(key);
          } else if (data && data.lastSync && (now - data.lastSync) > maxAge) {
            keysToRemove.push(key);
          }
        } catch {
          // Se non riesce a parsare, considera la chiave per la rimozione
          console.warn(`[STORAGE] Chiave ${key} non parsabile, marcata per rimozione`);
          if (!this.isSystemKey(key)) {
            keysToRemove.push(key);
          }
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`[STORAGE] Rimossi ${keysToRemove.length} elementi vecchi`);
      }
    } catch (error) {
      console.error('[STORAGE] Errore nella pulizia dati vecchi:', error);
    }
  }

  // Controlla se lo storage sta raggiungendo il limite
  async checkStorageLimit(): Promise<{
    isNearLimit: boolean;
    currentSize: number;
    maxSize: number;
    usage: number; // percentuale
  }> {
    try {
      const info = await this.getStorageInfo();
      const usage = (info.totalSize / this.maxCacheSize) * 100;
      
      return {
        isNearLimit: usage > 80, // Considera "vicino al limite" all'80%
        currentSize: info.totalSize,
        maxSize: this.maxCacheSize,
        usage
      };
    } catch (error) {
      console.error('[STORAGE] Errore nel controllo limite storage:', error);
      return {
        isNearLimit: false,
        currentSize: 0,
        maxSize: this.maxCacheSize,
        usage: 0
      };
    }
  }

  // Pulizia forzata per liberare spazio
  async forcedCleanup(): Promise<void> {
    try {
      console.log('[STORAGE] Inizio pulizia forzata...');
      
      // 1. Pulisci dati vecchi con soglia più aggressiva
      await this.cleanupOldData(24 * 60 * 60 * 1000); // 1 giorno invece di 7
      
      // 2. Rimuovi cache non essenziali
      const info = await this.getStorageInfo();
      const nonEssentialKeys = info.keys.filter(key => 
        !this.isEssentialKey(key) && !this.isSystemKey(key)
      );
      
      // 3. Rimuovi i file più grandi per primi
      const sortedKeys = nonEssentialKeys
        .map(key => ({ key, size: info.usage[key] || 0 }))
        .sort((a, b) => b.size - a.size)
        .slice(0, Math.floor(nonEssentialKeys.length / 2)) // Rimuovi solo metà
        .map(item => item.key);

      if (sortedKeys.length > 0) {
        await AsyncStorage.multiRemove(sortedKeys);
        console.log(`[STORAGE] Pulizia forzata: rimossi ${sortedKeys.length} elementi`);
      }
    } catch (error) {
      console.error('[STORAGE] Errore nella pulizia forzata:', error);
    }
  }

  // Salva dati con controllo automatico dello spazio
  async setItemSafely(key: string, value: string): Promise<boolean> {
    try {
      // Controlla spazio disponibile
      const limitInfo = await this.checkStorageLimit();
      
      if (limitInfo.isNearLimit) {
        console.warn('[STORAGE] Spazio limitato, avvio pulizia automatica...');
        await this.cleanupOldData();
        
        // Ricontrolla dopo la pulizia
        const newLimitInfo = await this.checkStorageLimit();
        if (newLimitInfo.usage > 90) {
          await this.forcedCleanup();
        }
      }

      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`[STORAGE] Errore nel salvataggio ${key}:`, error);
      return false;
    }
  }

  // Controlla se una chiave è di sistema (non deve essere rimossa)
  private isSystemKey(key: string): boolean {
    const systemKeys = [
      'USER_TOKEN',
      'USER_NAME',
      'USER_ID',
      'AUTH_TOKEN',
      'REFRESH_TOKEN'
    ];
    return systemKeys.some(sysKey => key.includes(sysKey));
  }

  // Controlla se una chiave è essenziale (deve essere preservata)
  private isEssentialKey(key: string): boolean {
    const essentialKeys = [
      CACHE_KEYS.TASKS_CACHE,
      CACHE_KEYS.CATEGORIES_CACHE,
      CACHE_KEYS.LAST_SYNC_TIMESTAMP
    ];
    return essentialKeys.includes(key);
  }

  // Reset completo dello storage (solo per debug/emergenza)
  async resetStorage(): Promise<void> {
    try {
      console.warn('[STORAGE] RESET COMPLETO DELLO STORAGE!');
      const allKeys = await AsyncStorage.getAllKeys();
      const nonSystemKeys = allKeys.filter(key => !this.isSystemKey(key));
      
      if (nonSystemKeys.length > 0) {
        await AsyncStorage.multiRemove(nonSystemKeys);
        console.log(`[STORAGE] Reset: rimossi ${nonSystemKeys.length} elementi`);
      }
    } catch (error) {
      console.error('[STORAGE] Errore nel reset storage:', error);
    }
  }

  // Ottieni report dettagliato dello storage
  async getStorageReport(): Promise<{
    summary: {
      totalSize: string;
      totalKeys: number;
      usage: string;
    };
    breakdown: {
      key: string;
      size: string;
      isSystem: boolean;
      isEssential: boolean;
    }[];
  }> {
    try {
      const info = await this.getStorageInfo();
      const limitInfo = await this.checkStorageLimit();

      const breakdown = info.keys.map(key => ({
        key,
        size: this.formatBytes(info.usage[key] || 0),
        isSystem: this.isSystemKey(key),
        isEssential: this.isEssentialKey(key)
      })).sort((a, b) => (info.usage[b.key] || 0) - (info.usage[a.key] || 0));

      return {
        summary: {
          totalSize: this.formatBytes(info.totalSize),
          totalKeys: info.keys.length,
          usage: `${limitInfo.usage.toFixed(1)}%`
        },
        breakdown
      };
    } catch (error) {
      console.error('[STORAGE] Errore nel report storage:', error);
      return {
        summary: { totalSize: '0 B', totalKeys: 0, usage: '0%' },
        breakdown: []
      };
    }
  }

  // Helper per formattare i byte in formato leggibile
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default StorageManager;