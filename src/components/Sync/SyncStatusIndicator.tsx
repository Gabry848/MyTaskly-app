import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SyncManager, { SyncStatus } from '../../services/SyncManager';

export interface SyncStatusIndicatorProps {
  compact?: boolean;
  showWhenOnline?: boolean;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  compact = false,
  showWhenOnline = false
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const syncManager = SyncManager.getInstance();

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

  if (!syncStatus) {
    return null;
  }

  // Mostra sempre quando offline, in sync o con modifiche pendenti
  // Mostra online solo se esplicitamente richiesto
  const shouldShow = !syncStatus.isOnline || 
                    syncStatus.isSyncing || 
                    syncStatus.pendingChanges > 0 ||
                    showWhenOnline;

  if (!shouldShow) {
    return null;
  }

  const renderIndicator = () => {
    if (syncStatus.isSyncing) {
      return (
        <View style={[styles.container, styles.syncingContainer, compact && styles.compact]}>
          <ActivityIndicator size={compact ? "small" : "small"} color="#666666" />
          <Text style={[styles.text, compact && styles.compactText]}>
            {compact ? 'Sync...' : 'Sincronizzando...'}
          </Text>
        </View>
      );
    }

    if (!syncStatus.isOnline) {
      return (
        <View style={[styles.container, styles.offlineContainer, compact && styles.compact]}>
          <Ionicons name="cloud-offline-outline" size={compact ? 14 : 16} color="#ff6b6b" />
          <Text style={[styles.text, styles.offlineText, compact && styles.compactText]}>
            {compact ? 'Offline' : 'Modalità offline'}
          </Text>
        </View>
      );
    }

    if (syncStatus.pendingChanges > 0) {
      return (
        <View style={[styles.container, styles.pendingContainer, compact && styles.compact]}>
          <Ionicons name="sync-outline" size={compact ? 14 : 16} color="#ffa726" />
          <Text style={[styles.text, styles.pendingText, compact && styles.compactText]}>
            {compact ? `${syncStatus.pendingChanges}` : `${syncStatus.pendingChanges} da sincronizzare`}
          </Text>
        </View>
      );
    }

    if (showWhenOnline) {
      return (
        <View style={[styles.container, styles.onlineContainer, compact && styles.compact]}>
          <Ionicons name="checkmark-circle-outline" size={compact ? 14 : 16} color="#4caf50" />
          <Text style={[styles.text, styles.onlineText, compact && styles.compactText]}>
            {compact ? 'OK' : 'Sincronizzato'}
          </Text>
        </View>
      );
    }

    return null;
  };

  return renderIndicator();
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 13,
    marginLeft: 6,
    fontFamily: 'System',
    fontWeight: '300',
  },
  compactText: {
    fontSize: 12,
    marginLeft: 4,
  },
  syncingContainer: {
    backgroundColor: '#f0f0f0',
  },
  offlineContainer: {
    backgroundColor: '#ffebee',
  },
  offlineText: {
    color: '#ff6b6b',
  },
  pendingContainer: {
    backgroundColor: '#fff3e0',
  },
  pendingText: {
    color: '#ffa726',
  },
  onlineContainer: {
    backgroundColor: '#e8f5e8',
  },
  onlineText: {
    color: '#4caf50',
  },
});

export default SyncStatusIndicator;