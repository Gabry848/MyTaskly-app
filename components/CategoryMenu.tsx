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
            <MaterialIcons name="edit" size={20} color="#666666" />
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
            <MaterialIcons name="share" size={20} color="#666666" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Leggermente più scuro per coerenza con Home20
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: 220, // Leggermente più largo per un aspetto più moderno
    backgroundColor: '#ffffff', // Bianco puro come Home20
    borderRadius: 16, // Più arrotondato per coerenza con Home20
    paddingVertical: 12, // Più padding per respiro
    borderWidth: 1.5, // Aggiunto bordo come Home20
    borderColor: '#e1e5e9', // Stesso colore del bordo dell'input di Home20
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4, // Coerente con Home20
    },
    shadowOpacity: 0.08, // Stesso valore di Home20
    shadowRadius: 12, // Stesso valore di Home20
    elevation: 3, // Stesso valore di Home20
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // Più padding per touch target migliore
    paddingHorizontal: 20, // Più padding orizzontale
    marginHorizontal: 4, // Margini per evitare che tocchi i bordi
  },
  menuText: {
    fontSize: 17, // Stessa dimensione dell'input di Home20
    marginLeft: 12,
    color: '#000000', // Nero per coerenza con Home20
    fontFamily: "System", // Stessa famiglia di Home20
    fontWeight: "400", // Stesso peso di Home20
  },
});

export default CategoryMenu;