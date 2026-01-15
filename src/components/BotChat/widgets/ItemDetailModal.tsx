import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemDetailModalProps } from '../types';
import * as taskService from '../../../services/taskService';

/**
 * Modal di dettaglio per task/categoria/nota con azioni (Complete, Edit, Delete, Reschedule)
 */
const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  visible,
  item,
  itemType,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Handler per completare un task
  const handleCompleteTask = async () => {
    if (itemType !== 'task') return;

    setIsLoading(true);
    try {
      await taskService.updateTask(item.task_id, {
        ...item,
        status: item.completed ? 'pending' : 'completed',
      });
      Alert.alert('Successo', `Task ${item.completed ? 'riaperto' : 'completato'}`);
      onClose();
    } catch (error: any) {
      Alert.alert('Errore', error.message || 'Impossibile aggiornare il task');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler per eliminare un item
  const handleDelete = () => {
    Alert.alert(
      'Conferma eliminazione',
      `Sei sicuro di voler eliminare ${itemType === 'task' ? 'questo task' : itemType === 'category' ? 'questa categoria' : 'questa nota'}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              if (itemType === 'task') {
                await taskService.deleteTask(item.task_id);
              }
              // TODO: Implementa delete per categorie e note se necessario
              Alert.alert('Successo', 'Elemento eliminato');
              onClose();
            } catch (error: any) {
              Alert.alert('Errore', error.message || 'Impossibile eliminare');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Renderizza i dettagli in base al tipo
  const renderDetails = () => {
    if (itemType === 'task') {
      return (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={20} color="#8E8E93" />
            <Text style={styles.detailLabel}>Titolo</Text>
          </View>
          <Text style={styles.detailValue}>{item.title}</Text>

          {item.description && (
            <>
              <View style={[styles.detailRow, styles.detailRowSpacing]}>
                <Ionicons name="list-outline" size={20} color="#8E8E93" />
                <Text style={styles.detailLabel}>Descrizione</Text>
              </View>
              <Text style={styles.detailValue}>{item.description}</Text>
            </>
          )}

          {item.end_time && (
            <>
              <View style={[styles.detailRow, styles.detailRowSpacing]}>
                <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
                <Text style={styles.detailLabel}>Scadenza</Text>
              </View>
              <Text style={styles.detailValue}>
                {new Date(item.end_time).toLocaleString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </>
          )}

          {item.category_name && (
            <>
              <View style={[styles.detailRow, styles.detailRowSpacing]}>
                <Ionicons name="folder-outline" size={20} color="#8E8E93" />
                <Text style={styles.detailLabel}>Categoria</Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category_name}</Text>
              </View>
            </>
          )}

          {item.priority && (
            <>
              <View style={[styles.detailRow, styles.detailRowSpacing]}>
                <Ionicons name="flag-outline" size={20} color="#8E8E93" />
                <Text style={styles.detailLabel}>Priorità</Text>
              </View>
              <Text style={styles.detailValue}>{item.priority}</Text>
            </>
          )}

          <View style={[styles.detailRow, styles.detailRowSpacing]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#8E8E93" />
            <Text style={styles.detailLabel}>Stato</Text>
          </View>
          <Text style={[styles.detailValue, item.completed && styles.completedText]}>
            {item.completed ? 'Completato' : 'In sospeso'}
          </Text>
        </View>
      );
    }

    if (itemType === 'category') {
      return (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="folder-outline" size={20} color="#8E8E93" />
            <Text style={styles.detailLabel}>Nome</Text>
          </View>
          <Text style={styles.detailValue}>{item.name}</Text>

          {item.task_count !== undefined && (
            <>
              <View style={[styles.detailRow, styles.detailRowSpacing]}>
                <Ionicons name="list-outline" size={20} color="#8E8E93" />
                <Text style={styles.detailLabel}>Task associati</Text>
              </View>
              <Text style={styles.detailValue}>{item.task_count}</Text>
            </>
          )}
        </View>
      );
    }

    if (itemType === 'note') {
      return (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={20} color="#8E8E93" />
            <Text style={styles.detailLabel}>Titolo</Text>
          </View>
          <Text style={styles.detailValue}>{item.title}</Text>

          {item.content && (
            <>
              <View style={[styles.detailRow, styles.detailRowSpacing]}>
                <Ionicons name="list-outline" size={20} color="#8E8E93" />
                <Text style={styles.detailLabel}>Contenuto</Text>
              </View>
              <Text style={styles.detailValue}>{item.content}</Text>
            </>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dettagli</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* ICON GRANDE */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                itemType === 'note' && item.color && { backgroundColor: item.color },
              ]}
            >
              <Ionicons
                name={
                  itemType === 'task'
                    ? item.completed
                      ? 'checkmark-circle'
                      : 'ellipse-outline'
                    : itemType === 'category'
                    ? 'folder'
                    : 'document-text'
                }
                size={48}
                color={itemType === 'note' ? '#FFFFFF' : '#007AFF'}
              />
            </View>
          </View>

          {/* DETTAGLI */}
          {renderDetails()}

          {/* LOADING OVERLAY */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
        </ScrollView>

        {/* ACTION BUTTONS */}
        <View style={styles.actionsContainer}>
          {itemType === 'task' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleCompleteTask}
              disabled={isLoading}
            >
              <Ionicons
                name={item.completed ? 'refresh' : 'checkmark-circle'}
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>
                {item.completed ? 'Riapri' : 'Completa'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.destructiveButton]}
            onPress={handleDelete}
            disabled={isLoading}
          >
            <Ionicons name="trash" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Elimina</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailRowSpacing: {
    marginTop: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
  },
  completedText: {
    color: '#34C759',
    fontWeight: '600',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5F1FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ItemDetailModal;
