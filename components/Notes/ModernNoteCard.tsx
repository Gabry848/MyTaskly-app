import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Note } from '../../src/services/noteService';

interface ModernNoteCardProps {
  note: Note;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  canDrag?: boolean;
}

export const ModernNoteCard: React.FC<ModernNoteCardProps> = memo(({
  note,
  onUpdatePosition,
  onDelete,
  onUpdate,
  canDrag = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text || '');

  // Shared values per animazioni fluide
  const translateX = useSharedValue(note.position.x);
  const translateY = useSharedValue(note.position.y);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.15);
  const isDragging = useSharedValue(false);

  // Aggiorna la posizione quando cambia la prop
  React.useEffect(() => {
    if (!isDragging.value) {
      translateX.value = withSpring(note.position.x, {
        damping: 20,
        stiffness: 300,
      });
      translateY.value = withSpring(note.position.y, {
        damping: 20,
        stiffness: 300,
      });
    }
  }, [note.position.x, note.position.y]);

  // Aggiorna il testo di editing quando cambia la nota
  React.useEffect(() => {
    if (!isEditing) {
      setEditText(note.text || '');
    }
  }, [note.text, isEditing]);

  const triggerHaptic = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptic non disponibile
    }
  }, []);

  const handlePositionUpdate = useCallback((x: number, y: number) => {
    onUpdatePosition(note.id, { x, y });
  }, [note.id, onUpdatePosition]);

  // Gesture di trascinamento
  const dragGesture = Gesture.Pan()
    .enabled(canDrag && !isEditing)
    .onBegin(() => {
      'worklet';
      isDragging.value = true;
      
      // Animazioni di inizio drag
      scale.value = withSpring(1.08, { damping: 15, stiffness: 400 });
      rotation.value = withSpring((Math.random() - 0.5) * 6, { damping: 15 });
      shadowOpacity.value = withTiming(0.3, { duration: 150 });
      
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = note.position.x + event.translationX;
      translateY.value = note.position.y + event.translationY;
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      
      // Animazioni di fine drag
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      rotation.value = withSpring(0, { damping: 15 });
      shadowOpacity.value = withTiming(0.15, { duration: 200 });
      
      // Salva la posizione finale
      runOnJS(handlePositionUpdate)(translateX.value, translateY.value);
    });

  // Long press per editing
  const longPressGesture = Gesture.LongPress()
    .minDuration(600)
    .onEnd(() => {
      'worklet';
      if (!isDragging.value) {
        runOnJS(() => {
          setIsEditing(true);
          triggerHaptic();
        })();
      }
    });

  // Composizione gesture
  const composedGesture = Gesture.Exclusive(dragGesture, longPressGesture);
  // Stili animati
  const noteAnimatedStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(
      shadowOpacity.value,
      [0.15, 0.3],
      [8, 16]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ] as any,
      shadowOpacity: shadowOpacity.value,
      shadowRadius,
      zIndex: isDragging.value ? 1000 : note.zIndex || 1,
      elevation: isDragging.value ? 8 : 4,
    };
  });

  const handleSave = useCallback(() => {
    if (editText.trim()) {
      onUpdate(note.id, editText.trim());
    }
    setIsEditing(false);
  }, [editText, note.id, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditText(note.text || '');
    setIsEditing(false);
  }, [note.text]);

  const handleDelete = useCallback(() => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      // Haptic non disponibile
    }
    onDelete(note.id);
  }, [note.id, onDelete]);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.noteContainer, noteAnimatedStyle]}>
        <BlurView
          intensity={10}
          tint="systemMaterialLight"
          style={[styles.noteBlur, { backgroundColor: note.color }]}
        >
          <View style={styles.noteContent}>
            {/* Bottone elimina */}
            <Pressable
              style={styles.deleteButton}
              onPress={handleDelete}
              hitSlop={8}
            >
              <FontAwesome name="times" size={12} color="#666" />
            </Pressable>

            {/* Contenuto della nota */}
            {isEditing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  autoFocus
                  placeholder="Scrivi qualcosa..."
                  placeholderTextColor="#999"
                  maxLength={500}
                />
                
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleCancel}
                  >
                    <FontAwesome name="times" size={14} color="#666" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleSave}
                  >
                    <FontAwesome name="check" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.textContainer}
                onPress={() => setIsEditing(true)}
                onLongPress={() => setIsEditing(true)}
              >
                <Text style={styles.noteText} numberOfLines={6}>
                  {note.text || 'Tocca per scrivere...'}
                </Text>
              </Pressable>
            )}
          </View>
        </BlurView>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  noteContainer: {
    position: 'absolute',
    width: 180,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 8,
  },
  noteBlur: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  noteContent: {
    flex: 1,
    padding: 16,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
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
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    paddingTop: 4,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1C1C1E',
    fontWeight: '400',
  },
  editContainer: {
    flex: 1,
    paddingTop: 4,
  },
  editInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#1C1C1E',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
});
