import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styles } from "./TaskStyles";

// Componente per il menu delle azioni
const TaskActionMenu = ({ 
  visible, 
  onClose, 
  onEdit, 
  onDelete, 
  onShare,
  isDeleting 
}) => {
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
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={onEdit}
          >
            <MaterialIcons name="edit" size={20} color="#333" />
            <Text style={styles.menuText}>Modifica</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={onDelete}
            disabled={isDeleting}
          >
            <MaterialIcons name="delete" size={20} color="#F44336" />
            <Text style={[styles.menuText, { color: '#F44336' }]}>
              {isDeleting ? "Eliminazione..." : "Elimina"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={onShare}
          >
            <MaterialIcons name="share" size={20} color="#333" />
            <Text style={styles.menuText}>Condividi</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default TaskActionMenu;