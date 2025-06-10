import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  SharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Note as NoteInterface } from '../src/services/noteService';

interface GestureNoteCardProps {
  note: NoteInterface;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onBringToFront: (id: string) => void;
  canDragNotesRef?: SharedValue<boolean>;
}

export const GestureNoteCard: React.FC<GestureNoteCardProps> = ({
  note,
  onUpdatePosition,
  onDelete,
  onUpdate,
  onBringToFront,
  canDragNotesRef,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  // Stati condivisi per la posizione e animazioni della nota con physics avanzate
  const translateX = useSharedValue(note.position.x);
  const translateY = useSharedValue(note.position.y);
  const savedTranslateX = useSharedValue(note.position.x);
  const savedTranslateY = useSharedValue(note.position.y);
  const isDragging = useSharedValue(false);
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.25);
  const velocity = useSharedValue({ x: 0, y: 0 });
  const lastTimestamp = useSharedValue(0);

  // Gestione dei callback
  const handleBringToFront = () => {
    onBringToFront(note.id);
  };

  const handlePositionUpdate = (x: number, y: number) => {
    onUpdatePosition(note.id, { x, y });
  };

  const triggerHapticFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };  // Definizione del gesto di trascinamento ultra-fluido con momentum
  const dragGesture = Gesture.Pan()
    .enabled(!isEditing)
    .maxPointers(1)
    .onBegin(() => {
      'worklet';      if (canDragNotesRef && !canDragNotesRef.value) {
        return false;
      }
      
      // Feedback tattile per l'inizio del trascinamento
      runOnJS(triggerHapticFeedback)();
      
      // Reset velocity e inizializzazione
      velocity.value = { x: 0, y: 0 };
      lastTimestamp.value = Date.now();
      
      // Animazioni ultra-fluide per l'inizio del trascinamento
      isDragging.value = true;
      scale.value = withSpring(1.08, { 
        damping: 18, 
        stiffness: 350,
        mass: 0.7
      });
      shadowOpacity.value = withTiming(0.45, { duration: 120 });
      
      runOnJS(handleBringToFront)();
      return true;    })
    .onUpdate((event) => {
      'worklet';
      // Calcolo della velocità per momentum
      const currentTime = Date.now();
      const deltaTime = Math.max(currentTime - lastTimestamp.value, 1);
        // Fattore costante senza zoom
      const zoomFactor = 1;
      
      // Fattore di smoothing ultra-fluido
      const smoothingFactor = 0.985;
      
      // Calcolo movimento con accelerazione smooth
      const deltaX = event.translationX * zoomFactor * smoothingFactor;
      const deltaY = event.translationY * zoomFactor * smoothingFactor;
      
      // Aggiornamento velocità per momentum
      velocity.value = {
        x: (deltaX - (translateX.value - savedTranslateX.value)) / deltaTime * 1000,
        y: (deltaY - (translateY.value - savedTranslateY.value)) / deltaTime * 1000
      };
      
      // Applica il movimento con ultra-smooth interpolation
      translateX.value = savedTranslateX.value + deltaX;
      translateY.value = savedTranslateY.value + deltaY;
      
      lastTimestamp.value = currentTime;    })
    .onEnd(() => {
      'worklet';
      // Momentum finale con physics realistiche
      const momentumFactor = 0.3;
      const maxMomentum = 200;
      
      const finalVelocityX = Math.max(-maxMomentum, Math.min(maxMomentum, velocity.value.x * momentumFactor));
      const finalVelocityY = Math.max(-maxMomentum, Math.min(maxMomentum, velocity.value.y * momentumFactor));
      
      // Animazioni ultra-fluide per la fine del trascinamento
      scale.value = withSpring(1, { 
        damping: 18, 
        stiffness: 350,
        mass: 0.7
      });
      shadowOpacity.value = withTiming(0.25, { duration: 180 });
      
      // Movimento finale con momentum e spring physics
      const finalX = translateX.value + finalVelocityX * 0.1;
      const finalY = translateY.value + finalVelocityY * 0.1;
      
      translateX.value = withSpring(finalX, { 
        damping: 22, 
        stiffness: 450,
        mass: 0.6
      });
      translateY.value = withSpring(finalY, { 
        damping: 22, 
        stiffness: 450,
        mass: 0.6
      });
      
      // Salva la posizione finale con ultra-smooth settling
      savedTranslateX.value = withSpring(finalX, { 
        damping: 25, 
        stiffness: 500,
        mass: 0.5
      });
      savedTranslateY.value = withSpring(finalY, { 
        damping: 25, 
        stiffness: 500,
        mass: 0.5
      });
      
      runOnJS(handlePositionUpdate)(finalX, finalY);
      isDragging.value = false;
    });  // Stile animato semplificato per la nota senza zoom
  const noteAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ] as any,
      zIndex: isDragging.value ? 9999 : note.zIndex,
      elevation: isDragging.value ? 18 : note.zIndex / 8,
    };
  });
  // Stile animato per l'ombra semplificato
  const shadowAnimatedStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: shadowOpacity.value,
      shadowRadius: isDragging.value ? 12 : 4,
      shadowOffset: {
        width: 0,
        height: isDragging.value ? 6 : 2,
      },
    };
  });

  // Gestione dell'editing
  const handleLongPress = () => {
    setIsEditing(true);
    setEditText(note.text);
  };

  const handleSave = () => {
    if (editText.trim() !== '') {
      onUpdate(note.id, editText);
    }
    setIsEditing(false);
  };

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View
        style={[
          styles.note,
          { backgroundColor: note.color },
          noteAnimatedStyle,
          shadowAnimatedStyle,
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(note.id)}
        >
          <FontAwesome name="times" size={16} color="#555" />
        </TouchableOpacity>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
              blurOnSubmit={false}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <FontAwesome name="check" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handleLongPress} activeOpacity={0.8}>
            <Text style={styles.noteText}>{note.text}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({  note: {
    position: 'absolute',
    width: 200,
    minHeight: 120,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noteText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  editContainer: {
    flex: 1,
    marginTop: 10,
  },
  editInput: {
    flex: 1,
    minHeight: 80,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  saveButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
});