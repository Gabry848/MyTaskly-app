import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  useDerivedValue,
  runOnJS,
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
  
  // State per il testo dello zoom
  const [zoomDisplayText, setZoomDisplayText] = useState('100%');
    // Canvas ottimizzata - ridotta per evitare problemi di posizionamento
  const CANVAS_WIDTH = screenWidth * 2;
  const CANVAS_HEIGHT = screenHeight * 2;
  
  // Shared values ottimizzati con posizione iniziale centrata
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  // Stato gesture
  const isPinching = useSharedValue(false);
  const isPanning = useSharedValue(false);
  const canDragNotes = useSharedValue(true);
    // Physics ottimizzate con posizione iniziale corretta
  const lastScale = useSharedValue(1);
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);

  // Callback per aggiornare il display del zoom
  const updateZoomDisplay = (newScale: number) => {
    setZoomDisplayText(`${Math.round(newScale * 100)}%`);
  };

  // Derived value per il testo dello zoom (solo per uso interno)
  const zoomText = useDerivedValue(() => {
    runOnJS(updateZoomDisplay)(scale.value);
    return `${Math.round(scale.value * 100)}%`;
  });  // Gesture pinch ottimizzato e semplificato
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      'worklet';
      isPinching.value = true;
      canDragNotes.value = false;
      lastScale.value = scale.value;
    })
    .onUpdate((event) => {
      'worklet';
      if (!event.scale || isNaN(event.scale)) return;
      
      // Zoom fluido con limiti ottimizzati
      const newScale = Math.min(Math.max(lastScale.value * event.scale, 0.5), 2.0);
      scale.value = newScale;
    })
    .onEnd(() => {
      'worklet';
      // Spring physics ottimizzate
      scale.value = withSpring(scale.value, {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      });
      
      // Ritarda la riattivazione per evitare conflitti
      setTimeout(() => {
        'worklet';
        isPinching.value = false;
        canDragNotes.value = true;
      }, 150);
    });  // Gesture pan semplificato e stabile
  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .onBegin(() => {
      'worklet';
      isPanning.value = true;
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      if (!isPinching.value && event.translationX && event.translationY) {
        // Validazione dei valori
        if (isNaN(event.translationX) || isNaN(event.translationY)) return;
        
        // Pan con sensibilità adattiva
        const sensitivity = 1.0 / Math.max(0.5, scale.value);
        const newX = lastTranslateX.value + event.translationX * sensitivity;
        const newY = lastTranslateY.value + event.translationY * sensitivity;
        
        // Limiti semplificati
        const maxOffset = 200;
        const minX = -CANVAS_WIDTH + screenWidth - maxOffset;
        const maxX = maxOffset;
        const minY = -CANVAS_HEIGHT + screenHeight - maxOffset;
        const maxY = maxOffset;
        
        translateX.value = Math.min(Math.max(newX, minX), maxX);
        translateY.value = Math.min(Math.max(newY, minY), maxY);
      }
    })
    .onEnd(() => {
      'worklet';
      isPanning.value = false;
    });
  // Double-tap semplificato per reset
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      if (scale.value > 1.2) {
        // Reset view
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      } else {
        // Zoom in
        scale.value = withSpring(1.5, { damping: 20, stiffness: 300 });
      }
    });

  // Composizione gesture ottimizzata
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  // Stile canvas animato
  const canvasAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  } as any));
  // Indicatore zoom semplificato
  const zoomIndicatorStyle = useAnimatedStyle(() => {
    const shouldShow = scale.value !== 1 || isPanning.value;
    
    return {
      opacity: withTiming(shouldShow ? 0.8 : 0, { duration: 200 }),
      transform: [{ scale: withSpring(shouldShow ? 1 : 0.8, { damping: 15, stiffness: 200 }) }],
    } as any;
  });
  // Memoizzazione delle note per performance
  const renderedNotes = useMemo(() => {
    return notes.map((note) => (
      <OptimizedNoteCard
        key={note.id}
        note={note}
        onDelete={onDeleteNote}
        onUpdate={onUpdateNote}
        onUpdatePosition={onUpdatePosition}
        canvasScale={scale}
        isPinching={isPinching}
        isPanning={isPanning}
        canDragNotes={canDragNotes}
      />
    ));
  }, [notes, onDeleteNote, onUpdateNote, onUpdatePosition, scale, isPinching, isPanning, canDragNotes]);
  return (
    <View style={styles.container}>
      {/* Indicatore zoom con state invece di SharedValue */}
      <Animated.View style={[styles.zoomIndicator, zoomIndicatorStyle]}>
        <Animated.Text style={styles.zoomText}>
          {zoomDisplayText}
        </Animated.Text>
      </Animated.View>

      {/* Canvas gesture ottimizzata */}
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
  zoomIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  zoomText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
});
