import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Note as NoteInterface } from '../src/services/noteService';
import { GestureNoteCard } from './GestureNoteCard';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { useSharedValue, withSpring, withTiming, runOnUI, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

interface NotesCanvasProps {
  notes: NoteInterface[];
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, text: string) => void;
  onBringToFront: (id: string) => void;
}

const NotesCanvas: React.FC<NotesCanvasProps> = ({
  notes,
  onUpdatePosition,
  onDeleteNote,
  onUpdateNote,
  onBringToFront,
}) => {
  // Dimensioni della canvas - abbastanza grandi per dare spazio alle note
  const { width, height } = Dimensions.get('window');
  const CANVAS_WIDTH = width * 2;
  const CANVAS_HEIGHT = height * 2;
  
  // Creazione di un riferimento allo ZoomableView per controllarlo programmaticamente
  const zoomableViewRef = useRef(null);
  // Stato per tracciare lo zoom corrente
  const [currentZoom, setCurrentZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  // Shared values per il controllo delle gesture delle note con animazioni fluide
  const canvasScale = useSharedValue(1);
  const isPinchingRef = useSharedValue(false);
  const canDragNotesRef = useSharedValue(true);  const zoomTransition = useSharedValue(1);
  const panningTransition = useSharedValue(0);
  
  // Funzione per resettare lo zoom e la posizione
  const resetView = () => {
    if (zoomableViewRef.current) {
      try {
        // Metodo alternativo per resettare lo zoom
        if (typeof zoomableViewRef.current.zoomTo === 'function') {
          zoomableViewRef.current.zoomTo(1); // Zoom a livello normale (1x)
          zoomableViewRef.current.moveTo(0, 0); // Sposta alla posizione iniziale
        } else if (typeof zoomableViewRef.current.resetZoom === 'function') {
          zoomableViewRef.current.resetZoom();
        } else {
          console.log('Metodo di reset zoom non disponibile');
        }
      } catch (error) {
        console.error('Errore durante il reset dello zoom:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Pulsante reset view */}
      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={resetView}
      >
        <FontAwesome name="refresh" size={20} color="#007AFF" />
      </TouchableOpacity>      {/* Indicatore di zoom semplificato senza accessi diretti a variabili di stato */}
      {(currentZoom !== 1 || isPanning) && (
        <View style={[styles.zoomIndicator, { opacity: 0.7 }]}>
          <FontAwesome 
            name={isPanning ? "arrows" : "search"} 
            size={16} 
            color="white" 
          />
          <View style={styles.zoomTextContainer}>
            <FontAwesome name="search" size={12} color="white" />
            <View style={styles.zoomValueContainer}>
              <FontAwesome 
                name={currentZoom >= 1 ? "plus" : "minus"} 
                size={8} 
                color="white" 
                style={styles.zoomIcon} 
              />
              <View style={styles.zoomBarContainer}>
                <View 
                  style={[
                    styles.zoomBar, 
                    { 
                      width: Math.min(Math.abs((currentZoom - 1) * 50), 100),       
                      backgroundColor: currentZoom >= 1 ? '#4CAF50' : '#FF5252'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.zoomText}>
                {Math.round(currentZoom * 100)}%
              </Text>
            </View>
          </View>
        </View>
      )}{/* Area zoomabile e trascinabile con React Native Zoomable View */}
      <ReactNativeZoomableView
        ref={zoomableViewRef}
        maxZoom={8}
        minZoom={0.2}
        zoomStep={0.2}
        initialZoom={1}
        bindToBorders={true}
        contentWidth={CANVAS_WIDTH}
        contentHeight={CANVAS_HEIGHT}
        panBoundaryPadding={100}
        style={styles.zoomableViewContainer}
        movementSensibility={1.2}
        doubleTapDelay={250}
        longPressDuration={400}
        onZoomBefore={(event, gestureState, zoomableViewEventObject) => {
          runOnUI(() => {
            isPinchingRef.value = true;
            canDragNotesRef.value = false;
            zoomTransition.value = withTiming(1, { duration: 150 });
          })();
          return true;
        }}
        onZoomAfter={(event, gestureState, zoomableViewEventObject) => {
          if (zoomableViewEventObject && zoomableViewEventObject.zoomLevel !== undefined) {
            setCurrentZoom(zoomableViewEventObject.zoomLevel);
            runOnUI(() => {
              canvasScale.value = withSpring(zoomableViewEventObject.zoomLevel, {
                damping: 15,
                stiffness: 200,
                mass: 0.8
              });
            })();
          }
          // Ritarda leggermente la riattivazione del drag per evitare conflitti
          setTimeout(() => {
            runOnUI(() => {
              isPinchingRef.value = false;
              canDragNotesRef.value = true;
              zoomTransition.value = withTiming(0, { duration: 200 });
            })();
          }, 100);
        }}
        onShiftingBefore={(event, gestureState, zoomableViewEventObject) => {
          setIsPanning(true);
          runOnUI(() => {
            panningTransition.value = withTiming(1, { duration: 100 });
          })();
          return true;
        }}
        onShiftingAfter={(event, gestureState, zoomableViewEventObject) => {
          setTimeout(() => {
            setIsPanning(false);
            runOnUI(() => {
              panningTransition.value = withTiming(0, { duration: 150 });
            })();
          }, 100);
          return true;
        }}
        onTransform={(event) => {
          // Logica di trasformazione fluida se necessaria
        }}
        disablePanOnInitialZoom={false}
        doubleTapZoomToCenter={true}
      >
        {/* Canvas con sfondo */}
        <View style={[styles.canvas, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }]}>
          {/* Sfondo della canvas */}
          <View style={[styles.backgroundLayer, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }]} />            {/* Note - posizionate in modo assoluto all'interno della canvas */}          {notes.map((note) => (
            <GestureNoteCard
              key={note.id}
              note={note}
              onDelete={onDeleteNote}
              onUpdate={onUpdateNote}
              onUpdatePosition={onUpdatePosition}
              onBringToFront={onBringToFront}
              canDragNotesRef={canDragNotesRef}
            />
          ))}
        </View>
      </ReactNativeZoomableView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Sfondo neutro/bianco per il container principale
  },
  zoomableViewContainer: {
    flex: 1,
  },
  canvas: {
    position: 'relative',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    // Rimuovo il colore di sfondo dalla canvas principale
    backgroundColor: 'transparent', 
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
  zoomIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1000,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  zoomTextContainer: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomValueContainer: {
    marginLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomIcon: {
    marginHorizontal: 2,
  },
  zoomBarContainer: {
    width: 40,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginLeft: 2,
    overflow: 'hidden',
  },  zoomBar: {
    height: '100%',
    borderRadius: 4,
  },
  zoomText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  }
});

export default NotesCanvas;