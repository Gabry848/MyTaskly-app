import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Task as TaskType } from './types';

interface CompletedTasksModalProps {
  visible: boolean;
  onClose: () => void;
  tasks: TaskType[];
  renderTask: (item: TaskType, index: number) => JSX.Element;
  onDeleteAll: () => void;
}

export const CompletedTasksModal: React.FC<CompletedTasksModalProps> = ({
  visible,
  onClose,
  tasks,
  renderTask,
  onDeleteAll,
}) => {
  const { t } = useTranslation();

  const handleDeleteAll = () => {
    Alert.alert(
      t('completedTasks.deleteAll.title'),
      t('completedTasks.deleteAll.message'),
      [
        { text: t('common.buttons.cancel'), style: 'cancel' },
        {
          text: t('common.buttons.delete'),
          style: 'destructive',
          onPress: () => {
            onDeleteAll();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitle}>{t('taskList.sections.completed')}</Text>
              <Text style={styles.formSubtitle}>
                {t('completedTasks.count', { count: tasks.length })}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {tasks.length > 0 && (
                <TouchableOpacity
                  style={styles.deleteAllButton}
                  onPress={handleDeleteAll}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
                  <Text style={styles.deleteAllText}>
                    {t('completedTasks.deleteAll.label')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={28} color="#666666" />
              </TouchableOpacity>
            </View>
          </View>

          {tasks.length > 0 && (
            <View style={styles.chartPlaceholder}>
              <View style={styles.chartGrid}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <View key={i} style={styles.gridCell} />
                ))}
              </View>
              <Text style={styles.chartPlaceholderTitle}>
                {t('completedTasks.comingSoon')}
              </Text>
            </View>
          )}

          <View style={styles.tasksContainer}>
            <FlatList
              data={tasks}
              keyExtractor={(item, index) => `completed-${item.id || item.task_id || index}`}
              renderItem={({ item, index }) => (
                <View style={{ marginBottom: 8, paddingHorizontal: 24 }}>
                  {renderTask(item, index)}
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-circle-outline" size={64} color="#cccccc" />
                  <Text style={styles.emptyText}>
                    {t('taskList.sections.emptyCompleted')}
                  </Text>
                </View>
              }
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  formContainer: {
    width: '100%',
    height: '92%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#ffffff',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#999999',
    fontFamily: 'System',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFD6D6',
    gap: 8,
  },
  deleteAllText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FF5252',
    fontFamily: 'System',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasksContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    paddingBottom: 48,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#999999',
    fontFamily: 'System',
    marginTop: 16,
    textAlign: 'center',
  },
  chartPlaceholder: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    alignItems: 'center',
  },
  chartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    gap: 4,
    marginBottom: 16,
    opacity: 0.3,
  },
  gridCell: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#000000',
  },
  chartPlaceholderTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#999999',
    fontFamily: 'System',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
