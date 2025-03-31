import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Modal,
  Image,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { addCategory } from '../src/services/taskService';
import { addCategoryToList } from './CategoryList'; // Importo la funzione globale

// Definiamo un'interfaccia chiara per i dati della categoria
interface CategoryData {
  id: string | number;
  name: string;
  description?: string;
  category_id?: number;
  status_code?: number;
}

interface AddCategoryButtonProps {
  onCategoryAdded: (category: CategoryData) => void;
}

const AddCategoryButton: React.FC<AddCategoryButtonProps> = ({ onCategoryAdded }) => {
  const [formVisible, setFormVisible] = useState(false);
  const animationValue = useSharedValue(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleForm = () => {
    setFormVisible(true);
    animationValue.value = withSpring(1, { damping: 12 });
  };

  const handleCancel = () => {
    // pulisci i campi di immissione
    setName('');
    setDescription('');
    // chiudi il form
    animationValue.value = withSpring(0, { damping: 12 });
    setTimeout(() => setFormVisible(false), 300);
  };

  const handleSave = async () => {
    if (name.trim() === '') {
      Alert.alert('Errore', 'Il nome della categoria non può essere vuoto');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Crea un oggetto categoria con un ID temporaneo
      const newCategory: CategoryData = { 
        id: Date.now(), 
        name: name.trim(), 
        description: description.trim() 
      };
      
      console.log('Nuova categoria creata localmente:', newCategory);
      
      try {
        // Salva la categoria nel backend
        const savedCategory = await addCategory(newCategory);
        console.log('Categoria salvata dal server:', savedCategory);
        
        // Usa la categoria restituita dal server se disponibile
        if (savedCategory) {
          // Prepara un oggetto completo combinando i dati locali con quelli del server
          const completeCategory: CategoryData = {
            // Mantieni i dati originali
            name: newCategory.name,
            description: newCategory.description,
            // Usa l'ID del server se disponibile, altrimenti quello locale
            id: savedCategory.category_id || savedCategory.id || newCategory.id,
            // Aggiungi altri campi dal server
            category_id: savedCategory.category_id,
            status_code: savedCategory.status_code
          };
          
          console.log('Chiamata a onCategoryAdded con categoria completa:', completeCategory);
          
          // Chiamata alla funzione di callback originale
          onCategoryAdded(completeCategory);
          
          // AGGIUNGIAMO QUESTA CHIAMATA DIRETTA per maggior sicurezza
          console.log('Chiamata diretta a addCategoryToList con:', completeCategory);
          addCategoryToList(completeCategory);
        } else {
          // In caso di problemi, usiamo la versione locale
          console.log('Chiamata a onCategoryAdded con newCategory (server non ha risposto):', newCategory);
          onCategoryAdded(newCategory);
          addCategoryToList(newCategory); // Aggiungiamo anche qui
        }
      } catch (error) {
        console.error('Errore nel salvare la categoria sul server:', error);
        // In caso di errore del server, aggiungiamo comunque la categoria localmente
        console.log('Chiamata a onCategoryAdded con newCategory (errore server):', newCategory);
        onCategoryAdded(newCategory);
        addCategoryToList(newCategory); // Aggiungiamo anche qui
      }
      
      // Chiudi il form
      handleCancel();
    } catch (error) {
      console.error('Errore nell\'aggiunta della categoria:', error);
      Alert.alert('Errore', 'Non è stato possibile aggiungere la categoria');
    } finally {
      setIsSubmitting(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animationValue.value }],
    opacity: animationValue.value,
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={toggleForm}>
        <Image source={require('../src/assets/plus.png')} style={styles.addButtonIcon} />
      </TouchableOpacity>

      <Modal visible={formVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.formContainer, animatedStyle]}>
            <KeyboardAvoidingView behavior="padding" style={styles.formContent}>
              <Text style={styles.label}>Nome Categoria</Text>
              <TextInput
                style={styles.input}
                placeholder="Inserisci il nome della categoria"
                value={name}
                onChangeText={setName}
              />
              <Text style={styles.label}>Descrizione</Text>
              <TextInput
                style={styles.input}
                placeholder="Inserisci la descrizione"
                multiline
                value={description}
                onChangeText={setDescription}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.submitButton} 
                  onPress={handleSave}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Salvataggio...' : 'Salva'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleCancel}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Annulla</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 0, // Cambia da 'bottom: 20' a 'bottom: 0'
    left: 20, // Cambia da 'right' a 'left'
    backgroundColor: '#007BFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonIcon: {
    width: 28,
    height: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '80%',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    overflow: 'hidden',
    padding: 16,
  },
  formContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddCategoryButton;