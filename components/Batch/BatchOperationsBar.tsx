import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BatchOperationService, BatchOperation } from '../../src/services/BatchOperationService';

interface BatchOperationsBarProps {
  selectedCount: number;
  onClose: () => void;
  taskService?: any;
  onOperationStart?: () => void;
  onOperationComplete?: (operation: BatchOperation, count: number) => void;
}

const BatchOperationsBar: React.FC<BatchOperationsBarProps> = ({
  selectedCount,
  onClose,
  taskService,
  onOperationStart,
  onOperationComplete,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBatchOperation = async (operation: BatchOperation, options?: any) => {
    if (!taskService) {
      Alert.alert('Errore', 'Servizio task non disponibile');
      return;
    }

    const selectedIds = BatchOperationService.getSelectedTaskIds();

    if (!selectedIds.length) {
      Alert.alert('Nessuna selezione', 'Seleziona almeno un task');
      return;
    }

    const operationLabels: Record<BatchOperation, string> = {
      delete: 'Elimina',
      complete: 'Completa',
      incomplete: 'Completa Annulla',
      changePriority: 'Cambia Priorità',
      changeCategory: 'Cambia Categoria',
    };

    Alert.alert(
      `Conferma ${operationLabels[operation]}`,
      `Sei sicuro di voler eseguire questa operazione su ${selectedIds.length} task?`,
      [
        { text: 'Annulla', onPress: () => {} },
        {
          text: 'Conferma',
          onPress: async () => {
            try {
              setIsProcessing(true);
              onOperationStart?.();

              await BatchOperationService.executeBatchOperation(
                operation,
                selectedIds,
                options,
                taskService
              );

              onOperationComplete?.(operation, selectedIds.length);
              onClose();

              Alert.alert(
                'Successo',
                `${operationLabels[operation]} completato su ${selectedIds.length} task`
              );
            } catch (error) {
              console.error('Errore batch operation:', error);
              Alert.alert('Errore', `Errore durante ${operationLabels[operation]}`);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header con conteggio e chiudi */}
      <View style={styles.header}>
        <View style={styles.selectionInfo}>
          <MaterialIcons name="check-circle" size={24} color="#FF6B35" />
          <Text style={styles.selectionText}>{selectedCount} selezionati</Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          disabled={isProcessing}
          style={styles.closeButton}
        >
          <MaterialIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Operations */}
      <View style={styles.operations}>
        <TouchableOpacity
          style={[styles.opButton, { borderColor: '#4CAF50' }]}
          onPress={() => handleBatchOperation('complete')}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <>
              <MaterialIcons name="check" size={20} color="#4CAF50" />
              <Text style={[styles.opButtonText, { color: '#4CAF50' }]}>Completa</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.opButton, { borderColor: '#FFC107' }]}
          onPress={() => handleBatchOperation('incomplete')}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFC107" />
          ) : (
            <>
              <MaterialIcons name="refresh" size={20} color="#FFC107" />
              <Text style={[styles.opButtonText, { color: '#FFC107' }]}>Annulla</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.opButton, { borderColor: '#F44336' }]}
          onPress={() => handleBatchOperation('delete')}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#F44336" />
          ) : (
            <>
              <MaterialIcons name="delete" size={20} color="#F44336" />
              <Text style={[styles.opButtonText, { color: '#F44336' }]}>Elimina</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  operations: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-around',
  },
  opButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 6,
  },
  opButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BatchOperationsBar;
