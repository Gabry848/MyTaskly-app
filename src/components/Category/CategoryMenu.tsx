import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryMenuProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onManageShares?: () => void;
  isDeleting: boolean;
  isOwned?: boolean;
  permissionLevel?: "READ_ONLY" | "READ_WRITE";
}

const CategoryMenu: React.FC<CategoryMenuProps> = ({
  visible,
  onClose,
  onEdit,
  onDelete,
  onShare,
  onManageShares,
  isDeleting,
  isOwned = true,
  permissionLevel = "READ_WRITE"
}) => {
  // Determine if user can edit/delete based on permissions
  const canEdit = isOwned || permissionLevel === "READ_WRITE";
  const canDelete = isOwned;
  const canManageSharing = isOwned;

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
          {/* Edit option - only if user can edit */}
          {canEdit && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={onEdit}
            >
              <MaterialIcons name="edit" size={20} color="#666666" />
              <Text style={styles.menuText}>Modifica</Text>
            </TouchableOpacity>
          )}

          {/* Share/Manage Shares option */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onShare}
          >
            <MaterialIcons name="share" size={20} color="#666666" />
            <Text style={styles.menuText}>
              {isOwned ? "Condividi" : "Info Condivisione"}
            </Text>
          </TouchableOpacity>

          {/* Manage shares option - only for owners */}
          {canManageSharing && onManageShares && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={onManageShares}
            >
              <MaterialIcons name="people" size={20} color="#666666" />
              <Text style={styles.menuText}>Gestisci Accesso</Text>
            </TouchableOpacity>
          )}

          {/* Delete option - only for owners */}
          {canDelete && (
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
          )}

          {/* Exit/Leave option - for shared categories */}
          {!isOwned && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={onClose}
            >
              <MaterialIcons name="exit-to-app" size={20} color="#666666" />
              <Text style={styles.menuText}>Esci</Text>
            </TouchableOpacity>
          )}

          {/* Read-only indicator */}
          {!isOwned && permissionLevel === "READ_ONLY" && (
            <View style={styles.infoItem}>
              <MaterialIcons name="lock" size={20} color="#999" />
              <Text style={styles.infoText}>Solo lettura</Text>
            </View>
          )}
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#999',
    fontFamily: "System",
    fontWeight: "400",
  },
});

export default CategoryMenu;