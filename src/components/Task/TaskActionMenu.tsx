import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { styles } from "./TaskStyles";

// Componente per il menu delle azioni
const TaskActionMenu = ({
  visible,
  onClose,
  onEdit,
  onDelete,
  onShare,
  isDeleting,
  isCompleted, // Nuova prop per identificare se il task è completato
  onReopen     // Nuova prop per gestire la riapertura del task
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          {isCompleted ? (
            // Menu semplificato per i task completati
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onReopen && onReopen();
                onClose();
              }}
            >
              <MaterialIcons name="refresh" size={20} color="#10e0e0" />
              <Text style={[styles.menuText, { color: '#10e0e0' }]}>{t('taskActionMenu.reopen')}</Text>
            </TouchableOpacity>
          ) : (
            // Menu completo per i task non completati
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={onEdit}
              >
                <MaterialIcons name="edit" size={20} color="#333" />
                <Text style={styles.menuText}>{t('taskActionMenu.edit')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={onDelete}
                disabled={isDeleting}
              >
                <MaterialIcons name="delete" size={20} color="#F44336" />
                <Text style={[styles.menuText, { color: '#F44336' }]}>
                  {isDeleting ? t('taskActionMenu.deleting') : t('taskActionMenu.delete')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={onShare}
              >
                <MaterialIcons name="share" size={20} color="#333" />
                <Text style={styles.menuText}>{t('taskActionMenu.share')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default TaskActionMenu;