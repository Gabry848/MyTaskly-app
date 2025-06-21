import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from "react-native";

interface EditCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  description: string;
  onTitleChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  isEditing: boolean;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  visible,
  onClose,
  onSave,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  isEditing
}) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.editModalOverlay}>
        <View style={styles.editModalContainer}>
          <Text style={styles.editModalTitle}>Modifica Categoria</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Titolo</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={onTitleChange}
              placeholder="Inserisci il titolo della categoria"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descrizione</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={onDescriptionChange}
              placeholder="Inserisci una descrizione (opzionale)"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
            <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: '#000000' }]}>Annulla</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={onSave}
              disabled={isEditing}
            >
              <Text style={[styles.buttonText, { color: '#ffffff' }]}>
                {isEditing ? "Salvataggio..." : "Salva"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Leggermente più scuro per coerenza con Home20
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContainer: {
    width: '85%', // Leggermente più largo come AddCategoryButton
    backgroundColor: '#ffffff', // Bianco puro come Home20
    borderRadius: 16, // Mantenuto arrotondato come Home20
    padding: 34, // Più padding come AddCategoryButton per coerenza
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
  editModalTitle: {
    fontSize: 24, // Leggermente più grande per gerarchia visiva
    fontWeight: '300', // Più leggero per coerenza con Home20
    color: '#000000', // Nero come Home20
    marginBottom: 24, // Più spazio
    textAlign: 'center',
    fontFamily: "System", // Stessa famiglia di Home20
    letterSpacing: -0.5, // Leggero spacing negativo per eleganza
  },
  formGroup: {
    marginBottom: 20, // Più spazio tra i gruppi
  },
  label: {
    fontSize: 16, // Leggermente più grande
    color: '#000000', // Nero per coerenza con Home20
    marginBottom: 8,
    fontFamily: "System", // Stessa famiglia di Home20
    fontWeight: "400", // Stesso peso di Home20
  },
  input: {
    backgroundColor: '#ffffff', // Bianco puro come Home20
    padding: 16, // Più padding come Home20
    borderRadius: 12, // Più arrotondato come Home20
    borderWidth: 1.5, // Stesso spessore dell'input di Home20
    borderColor: '#e1e5e9', // Stesso colore del bordo dell'input di Home20
    fontSize: 17, // Stessa dimensione dell'input di Home20
    fontFamily: "System", // Stessa famiglia di Home20
    fontWeight: "400", // Stesso peso di Home20
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top', // Spostato qui per chiarezza
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20, // Più spazio
    gap: 12, // Spazio uniforme tra i bottoni
  },
  button: {
    flex: 1,
    paddingVertical: 16, // Più padding come Home20
    borderRadius: 12, // Più arrotondato come Home20
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0', // Stesso colore del pulsante send di Home20
    borderWidth: 1.5,
    borderColor: '#e1e5e9', // Bordo coerente
  },
  saveButton: {
    backgroundColor: '#000000', // Nero come Home20
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "System", // Stessa famiglia di Home20
    fontWeight: "500", // Leggermente più grassetto
  },
});

export default EditCategoryModal;