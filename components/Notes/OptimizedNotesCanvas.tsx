import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Note as NoteInterface } from '../../src/services/noteService';
import { OptimizedNoteCard } from './OptimizedNoteCard';

interface OptimizedNotesCanvasProps {
  notes: NoteInterface[];
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, text: string) => void;
}

export const OptimizedNotesCanvas: React.FC<OptimizedNotesCanvasProps> = ({
  notes,
  onUpdatePosition,
  onDeleteNote,
  onUpdateNote,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    // Canvas ottimizzata - ridotta per evitare problemi di posizionamento
  const CANVAS_WIDTH = screenWidth * 2;
  const CANVAS_HEIGHT = screenHeight * 2;
  
  // Shared values ottimizzati senza zoom - solo panning
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  // Stato gesture semplificato
  const isPanning = useSharedValue(false);
  const canDragNotes = useSharedValue(true);
  
  // Physics ottimizzate per il panning
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);  // Gesture pan semplificato senza zoom
  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .onBegin(() => {
      'worklet';
      isPanning.value = true;
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
      return true;
    })
    .onUpdate((event) => {
      'worklet';
      // Verifica che i valori siano validi
      if (!event.translationX || 
          !event.translationY ||
          isNaN(event.translationX) || 
          isNaN(event.translationY) ||
          !isFinite(event.translationX) ||
          !isFinite(event.translationY)) {
        return;
      }
      
      // Pan con sensibilità costante
      const sensitivity = 1.0;
      
      // Calcolo sicuro delle nuove posizioni
      const newX = lastTranslateX.value + event.translationX * sensitivity;
      const newY = lastTranslateY.value + event.translationY * sensitivity;
      
      // Validazione delle nuove posizioni
      if (!isFinite(newX) || !isFinite(newY)) {
        return;
      }
      
      // Limiti semplificati
      const maxOffset = 200;
      const minX = -CANVAS_WIDTH + screenWidth - maxOffset;
      const maxX = maxOffset;
      const minY = -CANVAS_HEIGHT + screenHeight - maxOffset;
      const maxY = maxOffset;
      
      // Applica solo se i valori sono validi
      const clampedX = Math.min(Math.max(newX, minX), maxX);
      const clampedY = Math.min(Math.max(newY, minY), maxY);
      
      if (isFinite(clampedX) && isFinite(clampedY)) {
        translateX.value = clampedX;
        translateY.value = clampedY;
      }
    })
    .onEnd(() => {
      'worklet';
      isPanning.value = false;
    });

  // Double-tap per centrare la vista
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      // Reset view al centro
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    });

  // Composizione gesture semplificata
  const composedGesture = Gesture.Simultaneous(
    panGesture,
    doubleTapGesture
  );  // Stile canvas animato semplificato senza zoom
  const canvasAnimatedStyle = useAnimatedStyle(() => {
    // Validazione dei valori prima di applicare le trasformazioni
    const safeTranslateX = isFinite(translateX.value) ? translateX.value : 0;
    const safeTranslateY = isFinite(translateY.value) ? translateY.value : 0;
    
    return {
      transform: [
        { translateX: safeTranslateX },
        { translateY: safeTranslateY },
      ],
    } as any;
  });  // Memoizzazione delle note per performance senza zoom
  const renderedNotes = useMemo(() => {
    // Validazione iniziale dell'array notes
    if (!Array.isArray(notes)) {
      console.error('[DEBUG] OptimizedNotesCanvas: notes is not an array:', notes);
      return [];
    }
    
    // Filtra e valida le note prima del rendering
    const validNotes = notes.filter(note => {
      // Assicurati che la nota sia un oggetto valido
      if (!note || typeof note !== 'object') {
        console.error('[DEBUG] OptimizedNotesCanvas: Invalid note object:', note);
        return false;
      }
      
      // Assicurati che abbia le proprietà necessarie
      if (!note.id || typeof note.id !== 'string') {
        console.error('[DEBUG] OptimizedNotesCanvas: Note missing valid id:', note);
        return false;
      }
      
      // Assicurati che il testo sia una stringa
      if (typeof note.text !== 'string') {
        console.error('[DEBUG] OptimizedNotesCanvas: Note text is not a string:', note);
        return false;
      }
      
      // Assicurati che la posizione sia valida
      if (!note.position || typeof note.position.x !== 'number' || typeof note.position.y !== 'number') {
        console.error('[DEBUG] OptimizedNotesCanvas: Note missing valid position:', note);
        return false;
      }
      
      // Validazioni aggiuntive per prevenire errori di rendering
      if (!isFinite(note.position.x) || !isFinite(note.position.y)) {
        console.error('[DEBUG] OptimizedNotesCanvas: Note position contains invalid numbers:', note.position);
        return false;
      }
      
      return true;
    });
    
    console.log(`[DEBUG] OptimizedNotesCanvas: Filtered ${notes.length} notes to ${validNotes.length} valid notes`);
    
    // Aggiungi una validazione finale prima del rendering
    const renderedComponents = validNotes.map((note) => {
      try {
        return (
          <OptimizedNoteCard
            key={note.id}
            note={note}
            onDelete={onDeleteNote}
            onUpdate={onUpdateNote}
            onUpdatePosition={onUpdatePosition}
            isPanning={isPanning}
            canDragNotes={canDragNotes}
          />
        );
      } catch (error) {
        console.error('[DEBUG] OptimizedNotesCanvas: Error rendering note:', note.id, error);
        return null;
      }
    }).filter(Boolean); // Rimuovi eventuali elementi null
    
    return renderedComponents;
  }, [notes, onDeleteNote, onUpdateNote, onUpdatePosition, isPanning, canDragNotes]);return (
    <View style={styles.container}>
      {/* Canvas gesture semplificata */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.gestureArea}>
          <Animated.View style={[styles.canvas, canvasAnimatedStyle]}>
            {/* Background canvas */}
            <View style={[styles.canvasBackground, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }]} />
            
            {/* Grid pattern sottile */}
            <View style={[styles.gridPattern, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }]} />
            
            {/* Note ottimizzate */}
            {renderedNotes}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
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
    opacity: 0.03,
    // Qui si potrebbe aggiungere un pattern SVG o CSS per il grid
  },
});
