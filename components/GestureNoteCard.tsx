import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { Note as NoteInterface } from '../src/services/noteService';

interface GestureNoteCardProps {
  note: NoteInterface;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onBringToFront: (id: string) => void;
  isPinchingRef: SharedValue<boolean>;
  canvasScale: SharedValue<number>;
  canDragNotesRef?: SharedValue<boolean>; // Nuova proprietà per controllare se le note possono essere trascinate
}

export const GestureNoteCard: React.FC<GestureNoteCardProps> = ({
  note,
  onUpdatePosition,
  onDelete,
  onUpdate,
  onBringToFront,
  isPinchingRef,
  canvasScale,
  canDragNotesRef,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);

  // Stati condivisi per la posizione della nota
  const translateX = useSharedValue(note.position.x);
  const translateY = useSharedValue(note.position.y);
  const savedTranslateX = useSharedValue(note.position.x);
  const savedTranslateY = useSharedValue(note.position.y);
  const isDragging = useSharedValue(false);

  // Gestione dei callback
  const handleBringToFront = () => {
    console.log(`Note ${note.id} brought to front`);
    onBringToFront(note.id);
  };

  const handlePositionUpdate = (x: number, y: number) => {
    console.log(`Note ${note.id} position updated: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`);
    onUpdatePosition(note.id, { x, y });
  };

  // Definizione del gesto di trascinamento
  const dragGesture = Gesture.Pan()
    .enabled(!isEditing)
    .maxPointers(1) // Solo un dito per trascinare la nota
    .onBegin(() => {
      if (isPinchingRef.value || (canDragNotesRef && !canDragNotesRef.value)) {
        console.log(`Note ${note.id} drag prevented - isPinching: ${isPinchingRef.value}, canDragNotes: ${canDragNotesRef ? canDragNotesRef.value : true}`);
        return false;
      }
      console.log(`Note ${note.id} drag started`);
      isDragging.value = true;
      runOnJS(handleBringToFront)();
      return true;
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX / canvasScale.value;
      translateY.value = savedTranslateY.value + event.translationY / canvasScale.value;
      
      // Log meno frequente per non sovraccaricare la console
      if (Math.abs(event.translationX) % 20 < 1 || Math.abs(event.translationY) % 20 < 1) {
        console.log(`Note ${note.id} moving: X=${translateX.value.toFixed(2)}, Y=${translateY.value.toFixed(2)}, scale=${canvasScale.value.toFixed(2)}`);
      }
    })
    .onEnd(() => {
      console.log(`Note ${note.id} drag ended`);
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(handlePositionUpdate)(translateX.value, translateY.value);
      isDragging.value = false;
    });

  // Stile animato per la nota
  const noteAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ] as any, // Cast to 'any' to resolve type issues
      zIndex: isDragging.value ? 9999 : note.zIndex,
      elevation: isDragging.value ? 10 : note.zIndex / 10,
    };
  });

  // Gestione dell'editing
  const handleLongPress = () => {
    console.log(`Note ${note.id} editing started`);
    setIsEditing(true);
    setEditText(note.text);
  };

  const handleSave = () => {
    if (editText.trim() !== '') {
      console.log(`Note ${note.id} text updated`);
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
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            console.log(`Note ${note.id} deleted`);
            onDelete(note.id);
          }}
        >
          <FontAwesome name="times" size={16} color="#555" />
        </TouchableOpacity>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={(text) => {
                setEditText(text);
              }}
              multiline
              autoFocus
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <FontAwesome name="check" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handleLongPress}>
            <Text style={styles.noteText}>{note.text}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  note: {
    position: 'absolute',
    width: 200,
    minHeight: 120,
    padding: 15,
    borderRadius: 10,
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
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 6,
    padding: 8,
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
  },
});