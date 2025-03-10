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
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { addCategory } from '../src/services/taskService';

const AddCategoryButton: React.FC = () => {
  const [formVisible, setFormVisible] = useState(false);
  const animationValue = useSharedValue(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const toggleForm = () => {
    setFormVisible(true);
    animationValue.value = withSpring(1, { damping: 12 });
  };

  const handleCancel = () => {
    animationValue.value = withSpring(0, { damping: 12 });
    setTimeout(() => setFormVisible(false), 300);
  };

  const handleSave = async () => {
    try {
      await addCategory({ name, description });
      handleCancel(); // Chiudi il form dopo il salvataggio
    } catch (error) {
      console.error('Errore nell\'aggiunta della categoria:', error);
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
                <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
                  <Text style={styles.submitButtonText}>Salva</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
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
    bottom: 20,
    right: 20,
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