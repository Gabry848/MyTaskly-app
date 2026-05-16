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
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, elevation, spacing, typography } from '../../theme/tokens';
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

  console.log('[COMPLETED_TASKS_MODAL] Props ricevuti:', {
    visible,
    tasksCount: tasks.length,
    tasks: tasks.map(t => ({ id: t.id, title: t.title, status: t.status })),
    hasRenderTask: typeof renderTask === 'function'
  });

  // Disabilitato animazione per debug
  // const slideAnim = useRef(new Animated.Value(1)).current;
  // const translateY = slideAnim.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [0, SCREEN_HEIGHT],
  // });

  const handleDeleteAll = () => {
    Alert.alert(
      t('categories.deleteModal.title'),
      t('categories.deleteModal.confirmMessage') + ' ' + t('categories.deleteModal.warningMessage'),
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
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>{t('taskList.sections.completed')}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {tasks.length > 0 && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.deleteAllButton}
                  onPress={handleDeleteAll}
                >
                  <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
                  <Text style={styles.deleteAllText}>{t('taskActionMenu.delete')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={{ paddingHorizontal: 16, paddingBottom: 8, color: colors.textSecondary, fontSize: 12 }}>
              {tasks.length === 0 ? "Nessun task" : `${tasks.length} task completati`}
            </Text>

            <View style={styles.tasksContainer}>
              <FlatList
                data={tasks}
                keyExtractor={(item, index) => `completed-${item.id || item.task_id || index}`}
                renderItem={({ item, index }) => {
                  console.log('[COMPLETED_TASKS_MODAL] FlatList renderItem chiamato:', {
                    index,
                    task: { id: item.id, title: item.title, status: item.status }
                  });
                  const rendered = renderTask(item, index);
                  console.log('[COMPLETED_TASKS_MODAL] renderTask ritornato:', rendered != null ? 'jsx element' : 'null/undefined');
                  return (
                    <View style={{ marginBottom: 4 }}>
                      {rendered}
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="check-circle-outline" size={48} color={colors.border} />
                    <Text style={styles.emptyText}>Nessun task completato</Text>
                  </View>
                }
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '85%',
    minHeight: 200,
    ...elevation.lg,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 6,
    alignSelf: 'flex-start',
  },
  deleteAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.danger,
    fontFamily: 'Inter_500Medium',
  },
  tasksContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    paddingBottom: spacing.xxl * 2,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});