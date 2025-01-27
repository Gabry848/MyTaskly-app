import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AddTaskButton: React.FC = () => {
  const [formVisible, setFormVisible] = useState(false);

  const animationValue = useSharedValue(0);

  const toggleForm = () => {
    if (formVisible) {
      animationValue.value = 0;
    } else {
      animationValue.value = 1;
    }
    setFormVisible(!formVisible);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: withSpring(animationValue.value, { damping: 12 }) }],
    opacity: withSpring(animationValue.value, { damping: 12 }),
  }));

  const handleCancel = () => {
    animationValue.value = withSpring(0, { damping: 12 }); // Animazione inversa
    setTimeout(() => setFormVisible(false), 300); // Delay per completare l'animazione prima di nascondere
  };
  

  return (
    <View style={styles.container}>
      {/* Add Task Button */}
      <TouchableOpacity style={styles.addButton} onPress={toggleForm}>
        <Text style={styles.addButtonText}>{formVisible ? 'Close' : 'Add Task'}</Text>
      </TouchableOpacity>

      {/* Animated Form */}
      <Animated.View style={[styles.formContainer, animatedStyle]}>
        {formVisible && (
          <KeyboardAvoidingView behavior="padding" style={styles.formContent}>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} placeholder="Enter task title" />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter task description"
              multiline
            />

            <Text style={styles.label}>Due Date</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter due date (e.g. 2025-01-30)"
            />

            {/* Save and Cancel Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
    position: 'absolute', // Ensure it doesn't take up space when hidden
  },
  formContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
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

export default AddTaskButton;
