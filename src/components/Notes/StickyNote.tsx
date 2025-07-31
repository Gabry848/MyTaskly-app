import React, { useState, useRef, forwardRef, useImperativeHandle, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { X, Palette } from 'lucide-react-native';
import { Note } from '../../services/noteService';
import { useNotesActions } from '../../context/NotesContext';
import { NotesFocusContext } from './NotesCanvas';

const NOTE_WIDTH = 200;
const NOTE_HEIGHT = 160;
const MIN_SCALE = 0.6;
const MAX_SCALE = 1.8;

const COLORS = [
  '#FFEB3B', // Giallo post-it classico
  '#FFCDD2', // Rosa chiaro
  '#C8E6C9', // Verde chiaro
  '#BBDEFB', // Blu chiaro
  '#F8BBD0', // Rosa
  '#D1C4E9', // Violetto
  '#B2EBF2', // Ciano
  '#DCEDC8', // Verde lime
  '#FFE0B2', // Arancione chiaro
  '#F3E5F5', // Violetto chiaro
];

interface StickyNoteProps {
  note: Note;
  canvasScale: SharedValue<number>;
}

export interface StickyNoteRef {
  clearFocus: () => void;
}

export const StickyNote: React.FC<StickyNoteProps> = ({ note, canvasScale }) => {
  const { updateNote, deleteNote, updateNotePosition } = useNotesActions();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState(note.color);

  console.log('StickyNote render:', note.id, 'position:', note.position, 'text:', note.text);

  const translateX = useSharedValue(note.position.x);
  const translateY = useSharedValue(note.position.y);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(Math.random() * 6 - 3);
  const opacity = useSharedValue(1);

  const lastTranslateX = useSharedValue(note.position.x);
  const lastTranslateY = useSharedValue(note.position.y);
  const lastScale = useSharedValue(1);

  const isPressed = useSharedValue(false);
  const pressTimer = useRef<NodeJS.Timeout>();

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onStart(() => {
      'worklet';
      isPressed.value = true;
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
      
      rotation.value = withSpring(0);
      scale.value = withSpring(1.05);
      opacity.value = withSpring(0.9);
    })
    .onUpdate((event) => {
      'worklet';
      const GRID_SIZE = 40;
      const GRID_POINTS = 50;
      const CANVAS_SIZE = GRID_POINTS * GRID_SIZE;
      const NOTE_WIDTH = 200;
      const NOTE_HEIGHT = 160;
      
      const newX = lastTranslateX.value + event.translationX / canvasScale.value;
      const newY = lastTranslateY.value + event.translationY / canvasScale.value;
      
      // Limita il movimento della nota entro i confini della griglia
      const minX = 0;
      const maxX = CANVAS_SIZE - NOTE_WIDTH;
      const minY = 0;
      const maxY = CANVAS_SIZE - NOTE_HEIGHT;
      
      translateX.value = Math.max(minX, Math.min(maxX, newX));
      translateY.value = Math.max(minY, Math.min(maxY, newY));
    })
    .onEnd(() => {
      'worklet';
      isPressed.value = false;
      
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
      rotation.value = withSpring(Math.random() * 6 - 3);
      
      const finalPosition = {
        x: translateX.value,
        y: translateY.value,
      };
      
      runOnJS(updateNotePosition)(note.id, finalPosition);
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      lastScale.value = scale.value;
    })
    .onUpdate((event) => {
      'worklet';
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, lastScale.value * event.scale));
      scale.value = newScale;
    })
    .onEnd(() => {
      'worklet';
      scale.value = withSpring(scale.value);
    });

  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(200)
    .onStart(() => {
      'worklet';
      // Tap semplice - per ora non fa nulla
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(500)
    .onStart(() => {
      'worklet';
      runOnJS(handleDoubleTap)();
    });

  const composedGesture = Gesture.Exclusive(
    doubleTapGesture,
    Gesture.Simultaneous(panGesture, pinchGesture),
    tapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
    zIndex: isPressed.value ? 1000 : note.zIndex || 1,
  }));

  const handleLongPress = () => {
    try {
      console.log('Long press detected on note:', note.id);
      setShowColorPicker(true);
    } catch (error) {
      console.error('Error in handleLongPress:', error);
    }
  };

  const handleDoubleTap = () => {
    try {
      console.log('Double tap detected on note:', note.id);
      setIsEditing(true);
    } catch (error) {
      console.error('Error in handleDoubleTap:', error);
    }
  };

  const handleColorChange = (color: string) => {
    try {
      // Aggiorna il colore locale immediatamente
      setCurrentColor(color);
      
      // Chiudi il picker
      setShowColorPicker(false);
      
      console.log('Color changed to:', color);
    } catch (error) {
      console.error('Error updating note color:', error);
      setShowColorPicker(false);
    }
  };

  const handleTextSave = () => {
    if (editText.trim() !== note.text) {
      updateNote(note.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Elimina Nota',
      'Sei sicuro di voler eliminare questa nota?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina', 
          style: 'destructive',
          onPress: () => deleteNote(note.id)
        }
      ]
    );
  };

  const ColorPicker: React.FC = () => (
    <View style={styles.colorPicker}>
      <View style={styles.colorGrid}>
        {COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption, 
              { backgroundColor: color },
              currentColor === color && styles.selectedColor
            ]}
            onPress={() => handleColorChange(color)}
          />
        ))}
      </View>
      <TouchableOpacity 
        style={styles.closeColorPicker}
        onPress={() => setShowColorPicker(false)}
      >
        <Text style={styles.closeText}>Chiudi</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={[styles.note, { backgroundColor: currentColor }]}>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.colorButton} onPress={handleLongPress}>
              <Palette size={14} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <X size={14} color="#666" />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <TextInput
              style={styles.textInput}
              value={editText}
              onChangeText={setEditText}
              onBlur={handleTextSave}
              onSubmitEditing={handleTextSave}
              multiline
              autoFocus
              placeholder="Scrivi qui..."
            />
          ) : (
            <TouchableOpacity 
              style={styles.textContainer} 
              onPress={handleDoubleTap}
              activeOpacity={0.7}
            >
              <Text style={styles.text} numberOfLines={5}>
                {note.text}
              </Text>
              <Text style={styles.editHint}>Tap per modificare</Text>
            </TouchableOpacity>
          )}

          {showColorPicker && <ColorPicker />}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: NOTE_WIDTH,
    height: NOTE_HEIGHT,
  },
  note: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
    gap: 4,
  },
  deleteButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginTop: 28,
    justifyContent: 'space-between',
  },
  text: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    flex: 1,
  },
  editHint: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  textInput: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    flex: 1,
    marginTop: 28,
    textAlignVertical: 'top',
    padding: 0,
  },
  colorPicker: {
    position: 'absolute',
    top: 30,
    left: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 2,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  selectedColor: {
    borderColor: '#007AFF',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  closeColorPicker: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 12,
    color: '#666',
  },
});