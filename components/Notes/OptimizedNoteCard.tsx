import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated,
{
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  SharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Note as NoteInterface } from '../../src/services/noteService';

interface OptimizedNoteCardProps {
  note: NoteInterface;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  isPanning: SharedValue<boolean>;
  canDragNotes: SharedValue<boolean>;
}

export const OptimizedNoteCard: React.FC<OptimizedNoteCardProps> = React.memo(({
  note,
  onUpdatePosition,
  onDelete,
  onUpdate,
  isPanning,
  canDragNotes,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  // Assicuriamoci che editText sia sempre una stringa valida
  const [editText, setEditText] = useState(() => {
    return typeof note.text === 'string' ? note.text : '';
  });

  // Shared values per animazioni fluide ma semplificate
  const translateX = useSharedValue(note.position.x);
  const translateY = useSharedValue(note.position.y);
  const savedTranslateX = useSharedValue(note.position.x);
  const savedTranslateY = useSharedValue(note.position.y);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const shadowOpacity = useSharedValue(0.2);

  // Aggiorna la posizione quando la prop cambia
  React.useEffect(() => {
    if (!isDragging.value) {
      translateX.value = note.position.x;
      translateY.value = note.position.y;
      savedTranslateX.value = note.position.x;
      savedTranslateY.value = note.position.y;
    }
  }, [note.position.x, note.position.y]);

  // Aggiorna editText quando note.text cambia, assicurandoci che sia sempre una stringa
  React.useEffect(() => {
    if (!isEditing) {
      const newText = typeof note.text === 'string' ? note.text : '';
      setEditText(newText);
    }
  }, [note.text, isEditing]);
  
  // Callbacks ottimizzati
  const handlePositionUpdate = useCallback((x: number, y: number) => {
    onUpdatePosition(note.id, { x, y });
  }, [note.id, onUpdatePosition]);

  const triggerHapticFeedback = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log('Haptic feedback non disponibile');
    }
  }, []);
  // Gesture di trascinamento semplificato
  const dragGesture = Gesture.Pan()
    .enabled(!isEditing)
    .maxPointers(1)
    .onBegin(() => {
      'worklet';
      // Controlli di sicurezza ridotti - permetti il drag anche durante pan/pinch del canvas
      if (!canDragNotes.value) {
        return false;
      }

      isDragging.value = true;
      runOnJS(triggerHapticFeedback)();

      // Animazione di inizio semplificata
      scale.value = withSpring(1.05, {
        damping: 20,
        stiffness: 300,
      });
      shadowOpacity.value = withTiming(0.4, { duration: 150 });

      return true;
    })
    .onUpdate((event) => {
      'worklet';
      if (!isDragging.value) return;

      // Compensazione zoom semplificata
      // Senza zoom, il fattore è costante
      const zoomFactor = 1;
      
      // Movimento fluido
      translateX.value = savedTranslateX.value + event.translationX * zoomFactor;
      translateY.value = savedTranslateY.value + event.translationY * zoomFactor;
    })
    .onEnd(() => {
      'worklet';
      if (!isDragging.value) return;

      // Animazioni di fine
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
      shadowOpacity.value = withTiming(0.2, { duration: 200 });

      // Salva la posizione finale
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      runOnJS(handlePositionUpdate)(translateX.value, translateY.value);
      isDragging.value = false;
    });

  // Long press per editing
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onEnd(() => {
      'worklet';
      if (!isDragging.value && !isEditing) {        runOnJS(() => {
          setIsEditing(true);
          setEditText(note.text || '');
          triggerHapticFeedback();
        })();
      }
    });

  // Composizione gesture
  const composedGesture = Gesture.Exclusive(dragGesture, longPressGesture);
  // Stile animato
  const noteAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: note.zIndex, // zIndex fisso dalla nota
      elevation: isDragging.value ? 8 : 3,
    } as any;
  });

  // Stile ombra animato
  const shadowAnimatedStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: shadowOpacity.value,
      shadowRadius: isDragging.value ? 8 : 4,
      shadowOffset: {
        width: 0,
        height: isDragging.value ? 4 : 2,
      },
    };
  });
  // Gestione editing
  const handleSave = useCallback(() => {
    console.log(`[DEBUG] OptimizedNoteCard handleSave: Saving note ${note.id} with text: "${editText}"`);
    if (editText.trim() !== '') {
      console.log(`[DEBUG] OptimizedNoteCard handleSave: Text is valid, calling onUpdate`);
      onUpdate(note.id, editText);
    } else {
      console.log(`[DEBUG] OptimizedNoteCard handleSave: Text is empty or whitespace only`);
    }
    setIsEditing(false);
  }, [editText, note.id, onUpdate]);  const handleLongPress = useCallback(() => {
    setIsEditing(true);
    setEditText(note.text || '');
  }, [note.text]);
  const handleDelete = useCallback(() => {
    console.log(`[DEBUG] OptimizedNoteCard handleDelete called for note ${note.id}`);
    // Aggiungi feedback aptico per l'eliminazione
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.log('Haptic feedback non disponibile');
    }
    console.log(`[DEBUG] Calling onDelete prop function`);
    onDelete(note.id);
    console.log(`[DEBUG] onDelete prop function called successfully`);
  }, [note.id, onDelete]);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.note,
          { backgroundColor: note.color },
          noteAnimatedStyle,
          shadowAnimatedStyle,
        ]}
      >        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Image source={require('../../src/assets/x.png')} style={styles.deleteIcon} />
        </TouchableOpacity>
        
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={(text) => {
                console.log(`[DEBUG] OptimizedNoteCard TextInput onChange: "${text}"`);
                setEditText(text);
              }}
              multiline
              autoFocus
              blurOnSubmit={false}
            />            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Image source={require('../../src/assets/ceck.png')} style={styles.saveIcon} />
            </TouchableOpacity>
          </View>        ) : (
          <TouchableOpacity onPress={handleLongPress} activeOpacity={0.8}>
            <Text style={styles.noteText}>
              {typeof note.text === 'string' && note.text.trim() !== '' ? note.text : 'Testo nota...'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  note: {
    position: 'absolute',
    width: 180,
    minHeight: 100,
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  deleteIcon: {
    width: 12,
    height: 12,
    tintColor: '#666',
  },
  editContainer: {
    flex: 1,
    marginTop: 20,
  },
  editInput: {
    flex: 1,
    minHeight: 60,
    fontSize: 14,
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 6,
    padding: 8,
    textAlignVertical: 'top',
    lineHeight: 20,
  },  saveButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
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
  saveIcon: {
    width: 12,
    height: 12,
    tintColor: '#fff',
  },
});
