import React, { useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Note } from '../../src/services/noteService';
import { ModernNoteCard } from './ModernNoteCard';

interface ModernNotesCanvasProps {
  notes: Note[];
  isLoading?: boolean;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, text: string) => void;
  onRefresh?: () => void;
}

export const ModernNotesCanvas: React.FC<ModernNotesCanvasProps> = ({
  notes,
  isLoading = false,
  onUpdatePosition,
  onDeleteNote,
  onUpdateNote,
  onRefresh,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Canvas estesa per permettere il panning
  const CANVAS_WIDTH = screenWidth * 2.5;
  const CANVAS_HEIGHT = screenHeight * 2.5;
    // Shared values per il canvas
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isPanning = useSharedValue(false);
  const canDragNotes = useSharedValue(true);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Gesture di pan del canvas
  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .onBegin(() => {
      'worklet';
      isPanning.value = true;
      canDragNotes.value = false;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      // Movimento fluido del canvas basato sulla translazione totale
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
      
      // Limiti elastici
      const maxOffset = 300;
      const minX = -(CANVAS_WIDTH - screenWidth) - maxOffset;
      const maxX = maxOffset;
      const minY = -(CANVAS_HEIGHT - screenHeight) - maxOffset;
      const maxY = maxOffset;
      
      // Applica limiti elastici
      if (translateX.value < minX) {
        translateX.value = minX + (translateX.value - minX) * 0.3;
      } else if (translateX.value > maxX) {
        translateX.value = maxX + (translateX.value - maxX) * 0.3;
      }
      
      if (translateY.value < minY) {
        translateY.value = minY + (translateY.value - minY) * 0.3;
      } else if (translateY.value > maxY) {
        translateY.value = maxY + (translateY.value - maxY) * 0.3;
      }
    })
    .onEnd(() => {
      'worklet';
      isPanning.value = false;
      
      // Ritorna ai limiti se necessario
      const maxOffset = 300;
      const minX = -(CANVAS_WIDTH - screenWidth) - maxOffset;
      const maxX = maxOffset;
      const minY = -(CANVAS_HEIGHT - screenHeight) - maxOffset;
      const maxY = maxOffset;
      
      if (translateX.value < minX || translateX.value > maxX) {
        translateX.value = withSpring(
          Math.max(minX, Math.min(maxX, translateX.value)),
          { damping: 20, stiffness: 300 }
        );
      }
      
      if (translateY.value < minY || translateY.value > maxY) {
        translateY.value = withSpring(
          Math.max(minY, Math.min(maxY, translateY.value)),
          { damping: 20, stiffness: 300 }
        );
      }
      
      // Riabilita il drag delle note dopo un breve delay
      setTimeout(() => {
        canDragNotes.value = true;
      }, 100);
    });

  // Gesture di pinch per zoom
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      'worklet';
      canDragNotes.value = false;
    })
    .onUpdate((event) => {
      'worklet';
      const newScale = Math.max(0.5, Math.min(2, event.scale));
      scale.value = newScale;
    })
    .onEnd(() => {
      'worklet';
      // Ritorna a zoom normale se troppo piccolo
      if (scale.value < 0.8) {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }
      
      setTimeout(() => {
        canDragNotes.value = true;
      }, 100);
    });

  // Double tap per resettare la vista
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    });

  // Composizione gesture
  const composedGesture = Gesture.Simultaneous(
    Gesture.Simultaneous(panGesture, pinchGesture),
    doubleTapGesture
  );
  // Stile animato del canvas
  const canvasAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ] as any,
    };
  });

  // Indicatore di zoom e pan
  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    const isActive = isPanning.value || scale.value !== 1;
    const opacity = isActive ? 1 : 0;
    
    return {
      opacity: withTiming(opacity, { duration: 200 }),
    };
  });

  // Memoizza le note renderizzate
  const renderedNotes = useMemo(() => {
    if (!Array.isArray(notes)) return [];
    
    return notes
      .filter(note => {
        // Validazione delle note
        if (!note?.id || typeof note.text !== 'string') return false;
        if (!note.position || !isFinite(note.position.x) || !isFinite(note.position.y)) return false;
        return true;
      })
      .map(note => (
        <ModernNoteCard
          key={note.id}
          note={note}
          onUpdatePosition={onUpdatePosition}
          onDelete={onDeleteNote}
          onUpdate={onUpdateNote}
          canDrag={canDragNotes.value}
        />
      ));
  }, [notes, onUpdatePosition, onDeleteNote, onUpdateNote, canDragNotes.value]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  return (
    <View style={styles.container}>
      {/* Indicatori di stato */}
      <Animated.View style={[styles.statusIndicator, indicatorAnimatedStyle]}>
        <FontAwesome
          name={isPanning.value ? "arrows" : "search-plus"}
          size={14}
          color="#FFF"
        />
        <Text style={styles.statusText}>
          {scale.value !== 1 ? `${Math.round(scale.value * 100)}%` : 'Pan'}
        </Text>
      </Animated.View>

      {/* Bottone refresh */}
      {onRefresh && (
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <FontAwesome name="refresh" size={18} color="#007AFF" />
          )}
        </TouchableOpacity>
      )}

      {/* Canvas gesture area */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.gestureArea}>
          <Animated.View style={[styles.canvas, canvasAnimatedStyle]}>
            {/* Sfondo con pattern griglia */}
            <View style={[styles.canvasBackground, {
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
            }]} />
            
            {/* Pattern griglia sottile */}
            <View style={[styles.gridPattern, {
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
            }]} />

            {/* Note renderizzate */}
            {renderedNotes}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Stato loading/empty */}
      {notes.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <FontAwesome name="sticky-note-o" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>Nessuna nota ancora</Text>
          <Text style={styles.emptySubtext}>
            Aggiungi la tua prima nota qui sotto
          </Text>
        </View>
      )}

      {isLoading && notes.length === 0 && (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Caricamento note...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  gestureArea: {
    flex: 1,
    overflow: 'hidden',
  },
  canvas: {
    position: 'relative',
  },
  canvasBackground: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 0,
  },
  gridPattern: {
    position: 'absolute',
    backgroundColor: 'transparent',
    opacity: 0.02,
    // Si potrebbe aggiungere un pattern SVG per la griglia
  },
  statusIndicator: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  refreshButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyState: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingState: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
});
