import React, { useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Note as NoteInterface } from '../src/services/noteService';
import { GestureNoteCard } from './GestureNoteCard';
import { FontAwesome } from '@expo/vector-icons';

interface NotesCanvasProps {
  notes: NoteInterface[];
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, text: string) => void;
  onBringToFront: (id: string) => void;
}

export const NotesCanvas: React.FC<NotesCanvasProps> = ({
  notes,
  onUpdatePosition,
  onDeleteNote,
  onUpdateNote,
  onBringToFront,
}) => {
  const { width, height } = useWindowDimensions();
  
  // Stati condivisi per il canvas
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const isPinching = useSharedValue(false);
  const canDragNotes = useSharedValue(true);
  const isDraggingCanvas = useSharedValue(false);
  const lastContextX = useSharedValue(0);
  const lastContextY = useSharedValue(0);
  
  // Debug function per i log
  const logCanvasMovement = (x: number, y: number) => {
    console.log(`Canvas Moving: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`);
  };
  
  // Definizione dei gesti per la canvas
  const backgroundPanGesture = Gesture.Pan()
    .minDistance(5) // Inizia il gesto solo dopo 5px di movimento
    .maxPointers(1) // Solo un dito per trascinare la canvas
    .activateAfterLongPress(0) // Nessuna attesa per l'attivazione
    .onStart((event) => {
      console.log(`Canvas Pan Gesture Started at: X=${event.x.toFixed(2)}, Y=${event.y.toFixed(2)}`);
      canDragNotes.value = false;  // Disabilita il trascinamento delle note quando si trascina lo sfondo
      isDraggingCanvas.value = true;
      // Memorizza il punto di partenza
      lastContextX.value = event.x;
      lastContextY.value = event.y;
    })
    .onUpdate((event) => {
      if (!isPinching.value) {
        translateX.value = savedTranslateX.value + (event.x - lastContextX.value);
        translateY.value = savedTranslateY.value + (event.y - lastContextY.value);
        runOnJS(logCanvasMovement)(translateX.value, translateY.value);
      }
    })
    .onEnd((event) => {
      console.log(`Canvas Pan Gesture Ended at: X=${event.x.toFixed(2)}, Y=${event.y.toFixed(2)}`);
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      canDragNotes.value = true;  // Riabilita il trascinamento delle note
      isDraggingCanvas.value = false;
    })
    .onFinalize(() => {
      console.log('Canvas Pan Gesture Finalized');
      canDragNotes.value = true;  // Assicura che le note possano essere trascinate anche se il gesto viene annullato
      isDraggingCanvas.value = false;
    })
    .shouldCancelWhenOutside(false); // Continua il gesto anche se il dito esce dall'area

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      console.log('Pinch Gesture Started');
      isPinching.value = true;
      // Disabilita temporaneamente il trascinamento durante il pinch
      canDragNotes.value = false;
    })
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
      console.log(`Pinch Scale: ${scale.value.toFixed(2)}`);
    })
    .onEnd(() => {
      console.log('Pinch Gesture Ended');
      savedScale.value = scale.value;
      isPinching.value = false;
      // Riabilita il trascinamento delle note al termine del pinch
      canDragNotes.value = true;
    });

  // Combina i gesti per usarli insieme, ma dando priorità al pinch
  const composedGestures = Gesture.Exclusive(
    pinchGesture, 
    backgroundPanGesture
  );

  // Stile animato per il canvas
  const canvasAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ] as any,
    };
  });

  // Funzione per resettare lo zoom e la posizione
  const resetView = () => {
    console.log('Reset View Called');
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Pulsante reset view */}
      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={resetView}
      >
        <FontAwesome name="refresh" size={20} color="#007AFF" />
      </TouchableOpacity>

      <GestureDetector gesture={composedGestures}>
        <Animated.View style={[styles.canvas, canvasAnimatedStyle]}>
          {/* Contenitore trasparente che occupa tutto lo spazio e cattura i gesti di trascinamento per lo sfondo */}
          <View style={styles.backgroundLayer} />
          
          {/* Note */}
          {notes.map((note) => (
            <GestureNoteCard
              key={note.id}
              note={note}
              onUpdatePosition={onUpdatePosition}
              onDelete={onDeleteNote}
              onUpdate={onUpdateNote}
              onBringToFront={onBringToFront}
              isPinchingRef={isPinching}
              canvasScale={scale}
              canDragNotesRef={canDragNotes}
            />
          ))}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F0F8FF', // Aggiungo uno sfondo azzurro chiaro alla canvas
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderStyle: 'dashed',
  },
  resetButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default NotesCanvas;