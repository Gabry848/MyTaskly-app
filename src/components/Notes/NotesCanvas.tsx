import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Text,
  Keyboard,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { useNotesState } from '../../context/NotesContext';
import { StickyNote } from './StickyNote';
import { canvasViewport } from '../../utils/canvasViewport';

// Context per gestire il focus globale delle note
export const NotesFocusContext = React.createContext<{
  clearAllFocus: () => void;
}>({
  clearAllFocus: () => {},
});



const GRID_POINTS = 50;
const GRID_SIZE = 60;
const CANVAS_SIZE = GRID_POINTS * GRID_SIZE; // 50 * 30 = 1500px
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

export const NotesCanvas: React.FC = () => {
  const { notes, isLoading } = useNotesState();

  console.log('NotesCanvas - Notes count:', notes.length);
  console.log('NotesCanvas - Notes data:', notes);

  // Inizia al centro della griglia 300x300
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const centerOffset = (CANVAS_SIZE - screenWidth) / 2;
  const translateX = useSharedValue(-centerOffset);
  const translateY = useSharedValue(-centerOffset);
  const scale = useSharedValue(1);
  const lastScale = useSharedValue(1);
  const lastTranslateX = useSharedValue(-centerOffset);
  const lastTranslateY = useSharedValue(-centerOffset);

  const gestureState = useRef({
    initialDistance: null as number | null,
    initialScale: null as number | null,
    initialCenter: null as { x: number; y: number } | null,
    initialTranslateX: null as number | null,
    initialTranslateY: null as number | null,
  });

  // Traccia se stiamo facendo pinch-to-zoom per ignorare il pan con un solo dito subito dopo
  const isPinching = useRef(false);

  const clampTranslation = (tx: number, ty: number, currentScale: number) => {
    const scaledCanvas = CANVAS_SIZE * currentScale;
    const minX = -(scaledCanvas - screenWidth);
    const maxX = 0;
    const minY = -(scaledCanvas - screenHeight);
    const maxY = 0;
    return {
      x: Math.max(minX, Math.min(maxX, tx)),
      y: Math.max(minY, Math.min(maxY, ty)),
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, state) => {
        return Math.abs(state.dx) > 5 || Math.abs(state.dy) > 5;
      },
      onPanResponderGrant: () => {
        Keyboard.dismiss();
        lastTranslateX.value = translateX.value;
        lastTranslateY.value = translateY.value;
        isPinching.current = false;
      },
      onPanResponderMove: (evt, state) => {
        if (evt.nativeEvent.touches.length === 2) {
          isPinching.current = true;
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) + 
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          const centerX = (touch1.pageX + touch2.pageX) / 2;
          const centerY = (touch1.pageY + touch2.pageY) / 2;
          
          if (!gestureState.current.initialDistance) {
            gestureState.current.initialDistance = distance;
            gestureState.current.initialScale = scale.value;
            gestureState.current.initialCenter = { x: centerX, y: centerY };
            gestureState.current.initialTranslateX = translateX.value;
            gestureState.current.initialTranslateY = translateY.value;
          }
          
          const scaleRatio = distance / gestureState.current.initialDistance;
          const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, gestureState.current.initialScale! * scaleRatio));
          
          const focalX = gestureState.current.initialCenter!.x;
          const focalY = gestureState.current.initialCenter!.y;
          const oldScale = gestureState.current.initialScale!;
          const initTX = gestureState.current.initialTranslateX!;
          const initTY = gestureState.current.initialTranslateY!;
          
          translateX.value = focalX - (focalX - initTX) * (newScale / oldScale);
          translateY.value = focalY - (focalY - initTY) * (newScale / oldScale);
          
          scale.value = newScale;
        } else if (evt.nativeEvent.touches.length === 1 && !isPinching.current) {
          const newX = lastTranslateX.value + state.dx;
          const newY = lastTranslateY.value + state.dy;
          const clamped = clampTranslation(newX, newY, scale.value);
          translateX.value = clamped.x;
          translateY.value = clamped.y;
        }
      },
      onPanResponderRelease: () => {
        // Clamp position within valid bounds for current scale
        const clamped = clampTranslation(translateX.value, translateY.value, scale.value);
        translateX.value = clamped.x;
        translateY.value = clamped.y;

        lastTranslateX.value = translateX.value;
        lastTranslateY.value = translateY.value;
        lastScale.value = scale.value;

        // Update shared viewport state for note positioning
        canvasViewport.translateX = translateX.value;
        canvasViewport.translateY = translateY.value;
        canvasViewport.scale = scale.value;
        canvasViewport.screenWidth = screenWidth;
        canvasViewport.screenHeight = screenHeight;
        
        isPinching.current = false;
        gestureState.current.initialDistance = null;
        gestureState.current.initialScale = null;
        gestureState.current.initialCenter = null;
        gestureState.current.initialTranslateX = null;
        gestureState.current.initialTranslateY = null;
      },
    })
  ).current;

  const canvasAnimatedStyle = useAnimatedStyle(() => ({
    transformOrigin: 'left top',
    transform: [
      { translateX: translateX.value as number },
      { translateY: translateY.value as number },
      { scale: scale.value as number },
    ] as const,
  }));

  const GridBackground: React.FC = () => (
    <Svg
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      style={StyleSheet.absoluteFillObject}
    >
      <Defs>
        <Pattern
          id="grid"
          patternUnits="userSpaceOnUse"
          width={GRID_SIZE}
          height={GRID_SIZE}
        >
          <Circle
            cx={GRID_SIZE / 2}
            cy={GRID_SIZE / 2}
            r={1.5}
            fill="#8b8585ff"
            opacity={0.8}
          />
        </Pattern>
      </Defs>
      <Rect
        width="100%"
        height="100%"
        fill="url(#grid)"
      />
    </Svg>
  );

  const LoadingOverlay: React.FC = () => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Caricamento note...</Text>
      </View>
    </View>
  );

  if (isLoading && notes.length === 0) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.canvas}>
          <Animated.View style={[styles.canvasContent, canvasAnimatedStyle]}>
            <GridBackground />
          </Animated.View>
          <LoadingOverlay />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Animated.View style={[styles.canvasContent, canvasAnimatedStyle]}>
          <GridBackground />
          
          {notes.map((note) => {
            console.log('Rendering note:', note.id, note.position);
            return (
              <StickyNote
                key={note.id}
                note={note}
                canvasScale={scale}
              />
            );
          })}
        </Animated.View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  canvas: {
    flex: 1,
    overflow: 'hidden',
  },
  canvasContent: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: 'white',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000000ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});