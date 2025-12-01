import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NotificationSnoozeService, SnoozeDuration } from '../../src/services/NotificationSnoozeService';

interface SnoozeMenuProps {
  visible: boolean;
  onDismiss: () => void;
  taskId: string;
  taskTitle: string;
  notificationData?: any;
  onSnoozeSelected?: (duration: SnoozeDuration) => void;
}

const SnoozeMenu: React.FC<SnoozeMenuProps> = ({
  visible,
  onDismiss,
  taskId,
  taskTitle,
  notificationData = {},
  onSnoozeSelected,
}) => {
  const snoozeOptions = NotificationSnoozeService.getAvailableSnoozes();

  const handleSnooze = async (duration: SnoozeDuration) => {
    await NotificationSnoozeService.snoozeNotification(
      taskId,
      taskTitle,
      duration,
      notificationData
    );
    onSnoozeSelected?.(duration);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Posticipa Promemoria</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            {snoozeOptions.map((option) => (
              <TouchableOpacity
                key={option.duration}
                style={styles.option}
                onPress={() => handleSnooze(option.duration)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <MaterialIcons
                    name="schedule"
                    size={20}
                    color="#FF6B35"
                    style={styles.optionIcon}
                  />
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
          >
            <Text style={styles.dismissButtonText}>Scarta Notifica</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  optionsContainer: {
    marginVertical: 8,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 4,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  dismissButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
});

export default SnoozeMenu;
