import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppInitializer from '../src/services/AppInitializer';
import SyncManager from '../src/services/SyncManager';
import TaskCacheService from '../src/services/TaskCacheService';
import StorageManager from '../src/services/StorageManager';

interface CacheDebugPanelProps {
  visible: boolean;
  onClose: () => void;
}

interface AppStatus {
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
}

const CacheDebugPanel: React.FC<CacheDebugPanelProps> = ({ visible, onClose }) => {
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStatus = async () => {
    try {
      setIsRefreshing(true);
      const appInitializer = AppInitializer.getInstance();
      const status = await appInitializer.getInitializationStatus();
      // Aggiungi informazioni sul caricamento dati sincrono
      const statusWithDataLoad = {
        ...status,
        dataLoaded: appInitializer.isDataReady()
      };
      setAppStatus(statusWithDataLoad as any);
    } catch (error) {
      console.error('[DEBUG_PANEL] Errore refresh status:', error);
      Alert.alert('Errore', 'Impossibile aggiornare lo stato');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      refreshStatus();
    }
  }, [visible]);

  const handleClearCache = async () => {
    Alert.alert(
      'Pulisci Cache',
      'Sei sicuro di voler eliminare tutti i dati memorizzati nella cache?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Pulisci',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const cacheService = TaskCacheService.getInstance();
              await cacheService.clearCache();
              await refreshStatus();
              Alert.alert('Successo', 'Cache pulita correttamente');
            } catch (error) {
              console.error('[DEBUG_PANEL] Errore pulizia cache:', error);
              Alert.alert('Errore', 'Impossibile pulire la cache');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleForceSync = async () => {
    setIsLoading(true);
    try {
      const syncManager = SyncManager.getInstance();
      await syncManager.forceFullSync();
      await refreshStatus();
      Alert.alert('Successo', 'Sincronizzazione forzata completata');
    } catch (error) {
      console.error('[DEBUG_PANEL] Errore force sync:', error);
      Alert.alert('Errore', 'Errore durante la sincronizzazione');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetApp = async () => {
    Alert.alert(
      'Reset Applicazione',
      'ATTENZIONE: Questa operazione eliminerà tutti i dati locali e reinizializzerà l\'app. Continua?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const appInitializer = AppInitializer.getInstance();
              await appInitializer.reset();
              await refreshStatus();
              Alert.alert('Successo', 'App resetata e reinizializzata');
            } catch (error) {
              console.error('[DEBUG_PANEL] Errore reset app:', error);
              Alert.alert('Errore', 'Errore durante il reset');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCleanupStorage = async () => {
    setIsLoading(true);
    try {
      const storageManager = StorageManager.getInstance();
      await storageManager.cleanupOldData();
      await refreshStatus();
      Alert.alert('Successo', 'Pulizia storage completata');
    } catch (error) {
      console.error('[DEBUG_PANEL] Errore cleanup storage:', error);
      Alert.alert('Errore', 'Errore durante la pulizia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugListTasks = async () => {
    setIsLoading(true);
    try {
      const cacheService = TaskCacheService.getInstance();
      await cacheService.debugListCachedTasks();
      Alert.alert('Debug Completato', 'Controlla i log della console per vedere tutti i task in cache');
    } catch (error) {
      console.error('[DEBUG_PANEL] Errore debug list tasks:', error);
      Alert.alert('Errore', 'Errore durante il debug');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveGhostTask = async () => {
    Alert.prompt(
      'Rimuovi Task Fantasma',
      'Inserisci il titolo o ID del task da rimuovere:',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: async (taskIdentifier) => {
            if (!taskIdentifier) return;
            
            setIsLoading(true);
            try {
              const cacheService = TaskCacheService.getInstance();
              const removed = await cacheService.forceRemoveTaskFromCache(taskIdentifier.trim());
              
              if (removed) {
                await refreshStatus();
                Alert.alert('Successo', `Task "${taskIdentifier}" rimosso dalla cache`);
              } else {
                Alert.alert('Info', `Task "${taskIdentifier}" non trovato in cache`);
              }
            } catch (error) {
              console.error('[DEBUG_PANEL] Errore rimozione task fantasma:', error);
              Alert.alert('Errore', 'Errore durante la rimozione del task');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Cache & Storage</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666666" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshStatus} />
        }
      >
        {appStatus && (
          <>
            {/* Status Inizializzazione */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stato Inizializzazione</Text>
              <View style={styles.statusRow}>
                <Ionicons 
                  name={appStatus.initialized ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={appStatus.initialized ? "#4caf50" : "#f44336"} 
                />
                <Text style={styles.statusText}>
                  {appStatus.initialized ? 'Inizializzata' : 'Non inizializzata'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Ionicons 
                  name={(appStatus as any).dataLoaded ? "download" : "hourglass"} 
                  size={20} 
                  color={(appStatus as any).dataLoaded ? "#4caf50" : "#ff9800"} 
                />
                <Text style={styles.statusText}>
                  Dati: {(appStatus as any).dataLoaded ? 'Caricati' : 'In caricamento'}
                </Text>
              </View>
            </View>

            {/* Statistiche Cache */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cache</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Task in cache:</Text>
                <Text style={styles.statValue}>{appStatus.cacheStats.taskCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Categorie:</Text>
                <Text style={styles.statValue}>{appStatus.cacheStats.categoryCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Ultimo sync:</Text>
                <Text style={styles.statValue}>
                  {appStatus.cacheStats.lastSync 
                    ? appStatus.cacheStats.lastSync.toLocaleString() 
                    : 'Mai'}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Modifiche offline:</Text>
                <Text style={[styles.statValue, appStatus.cacheStats.offlineChanges > 0 && styles.warningText]}>
                  {appStatus.cacheStats.offlineChanges}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Dimensione cache:</Text>
                <Text style={styles.statValue}>
                  {(appStatus.cacheStats.cacheSize / 1024).toFixed(2)} KB
                </Text>
              </View>
            </View>

            {/* Statistiche Storage */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Storage</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Dimensione totale:</Text>
                <Text style={styles.statValue}>{appStatus.storageStats.totalSize}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Chiavi totali:</Text>
                <Text style={styles.statValue}>{appStatus.storageStats.totalKeys}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Utilizzo:</Text>
                <Text style={[
                  styles.statValue,
                  parseFloat(appStatus.storageStats.usage) > 80 && styles.warningText
                ]}>
                  {appStatus.storageStats.usage}
                </Text>
              </View>
            </View>

            {/* Azioni */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Azioni</Text>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleForceSync}
                disabled={isLoading}
              >
                <Ionicons name="sync" size={20} color="#2196F3" />
                <Text style={styles.actionText}>Forza Sincronizzazione</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCleanupStorage}
                disabled={isLoading}
              >
                <Ionicons name="trash-outline" size={20} color="#FF9800" />
                <Text style={styles.actionText}>Pulisci Storage Vecchio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleClearCache}
                disabled={isLoading}
              >
                <Ionicons name="refresh-outline" size={20} color="#f44336" />
                <Text style={styles.actionText}>Pulisci Cache</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDebugListTasks}
                disabled={isLoading}
              >
                <Ionicons name="list" size={20} color="#4CAF50" />
                <Text style={styles.actionText}>Debug Lista Task</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleRemoveGhostTask}
                disabled={isLoading}
              >
                <Ionicons name="remove-circle-outline" size={20} color="#9C27B0" />
                <Text style={styles.actionText}>Rimuovi Task Fantasma</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleResetApp}
                disabled={isLoading}
              >
                <Ionicons name="warning" size={20} color="#f44336" />
                <Text style={[styles.actionText, styles.dangerText]}>Reset Completo</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {!appStatus && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Caricamento statistiche...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  warningText: {
    color: '#ff6b6b',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dangerButton: {
    borderColor: '#ffcdd2',
    backgroundColor: '#ffebee',
  },
  actionText: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 10,
    fontWeight: '500',
  },
  dangerText: {
    color: '#f44336',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default CacheDebugPanel;