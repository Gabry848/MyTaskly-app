import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Note as NoteInterface } from '../src/services/noteService';
import DraggableNote from './DraggableNote';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

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
      </TouchableOpacity>

      {/* Indicatore di zoom attuale */}
      <View style={[
        styles.zoomIndicator,
        { opacity: currentZoom !== 1 || isPanning ? 0.7 : 0 }
      ]}>
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
          </View>
        </View>
      </View>

      {/* Area zoomabile e trascinabile con React Native Zoomable View */}
      <ReactNativeZoomableView
        ref={zoomableViewRef}
        maxZoom={5}
        minZoom={0.5}
        zoomStep={0.5}
        initialZoom={1}
        bindToBorders={true}
        contentWidth={CANVAS_WIDTH}
        contentHeight={CANVAS_HEIGHT}
        panBoundaryPadding={50}
        style={styles.zoomableViewContainer}
        onZoomAfter={(event) => {
          if (event && event.zoomLevel !== undefined) {
            setCurrentZoom(event.zoomLevel);
          }
        }}
        onShiftingBefore={(event) => {
          setIsPanning(true);
        }}
        onShiftingAfter={(event) => {
          setTimeout(() => {
            setIsPanning(false);
          }, 150);
        }}
        onTransform={(event) => {
          // Qui potremmo aggiungere ulteriore logica durante la trasformazione se necessario
        }}
        disablePanOnInitialZoom={false}
        doubleTapZoomToCenter={true}
      >
        {/* Canvas con sfondo */}
        <View style={[styles.canvas, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }]}>
          {/* Sfondo della canvas */}
          <View style={[styles.backgroundLayer, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }]} />
          
          {/* Note - posizionate in modo assoluto all'interno della canvas */}
          {notes.map((note) => (
            <DraggableNote
              key={note.id}
              note={note}
              onDelete={onDeleteNote}
              onUpdateText={onUpdateNote}
              onUpdatePosition={onUpdatePosition}
              onBringToFront={onBringToFront}
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
  },
  zoomBar: {
    height: '100%',
    borderRadius: 4,
  }
});

export default NotesCanvas;