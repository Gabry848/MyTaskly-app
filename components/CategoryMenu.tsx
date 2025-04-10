import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryMenuProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  isDeleting: boolean;
}

const CategoryMenu: React.FC<CategoryMenuProps> = ({ 
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
});

export default CategoryMenu;