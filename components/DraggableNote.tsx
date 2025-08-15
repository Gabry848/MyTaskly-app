import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, PanResponder, Image } from 'react-native';

interface Note {
  id: string;
  text: string;
  position: {
    x: number;
    y: number;
  };
  color: string;
  zIndex: number;
}

interface DraggableNoteProps {
  note: Note;
  onDelete: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onUpdatePosition?: (id: string, position: { x: number; y: number }) => void;
  onBringToFront?: (id: string) => void;
  panResponder?: any; // Reso opzionale
  pan?: Animated.ValueXY; // Reso opzionale
}

const DraggableNote: React.FC<DraggableNoteProps> = ({ 
  note, 
  panResponder, 
  pan, 
  onDelete,
  onUpdateText,
  onUpdatePosition,
  onBringToFront
}) => {
  const [isEditing, setIsEditing] = useState(false);
  // Assicuriamoci che editText sia sempre una stringa valida
  const [editText, setEditText] = useState(() => {
    return typeof note.text === 'string' ? note.text : '';
  });
  
  // Aggiorna editText quando note.text cambia, assicurandoci che sia sempre una stringa
  React.useEffect(() => {
    if (!isEditing) {
      const newText = typeof note.text === 'string' ? note.text : '';
      setEditText(newText);
    }
  }, [note.text, isEditing]);
  
  // Creiamo un panResponder locale se non ne viene fornito uno
  const position = useRef(new Animated.ValueXY({
    x: note.position.x,
    y: note.position.y
  })).current;
    // Se non viene fornito un panResponder, creiamone uno localmente
  const localPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => !isEditing,
      onPanResponderGrant: () => {
        // Usa addListener per ottenere i valori correnti
        const currentX = (position.x as any).__getValue();
        const currentY = (position.y as any).__getValue();
        
        position.setOffset({
          x: currentX,
          y: currentY
        });
        position.setValue({ x: 0, y: 0 });
        
        // Porta la nota in primo piano se la funzione è disponibile
        if (onBringToFront) {
          onBringToFront(note.id);
        }
      },
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        position.flattenOffset();
        
        // Aggiorna la posizione se la funzione è disponibile
        if (onUpdatePosition) {
          const currentX = (position.x as any).__getValue();
          const currentY = (position.y as any).__getValue();
          
          onUpdatePosition(note.id, {
            x: currentX,
            y: currentY
          });
        }
      },
    })
  ).current;

  // Usiamo il panResponder fornito oppure quello locale
  const activePanResponder = panResponder || localPanResponder;
  const activePan = pan || position;
  const handleLongPress = () => {
    setIsEditing(true);
    setEditText(note.text || '');
  };

  const handleSave = () => {
    if (editText.trim() !== '') {
      onUpdateText(note.id, editText);
    }
    setIsEditing(false);
  };

  return (
    <Animated.View
      {...(isEditing ? {} : activePanResponder.panHandlers)}
      style={[
        styles.note,
        {
          backgroundColor: note.color,
          left: note.position.x,
          top: note.position.y,
          transform: panResponder ? 
            [{ translateX: activePan.x }, { translateY: activePan.y }] : 
            [],
          zIndex: note.zIndex,
          elevation: note.zIndex,
        },
      ]}
    >      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => onDelete(note.id)}
      >
        <Image source={require('../src/assets/x.png')} style={styles.deleteIcon} />
      </TouchableOpacity>
      
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            autoFocus
          />          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Image source={require('../src/assets/ceck.png')} style={styles.saveIcon} />
          </TouchableOpacity>
        </View>        ) : (        <TouchableOpacity 
          onPress={handleLongPress} 
          // delayLongPress={500}
          activeOpacity={0.7}        >
          <Text style={styles.noteText}>
            {typeof editText === 'string' && editText.trim() !== '' ? editText : 'Testo nota...'}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  note: {
    position: 'absolute',
    width: 200,
    minHeight: 120,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noteText: {
    fontSize: 16,
    color: '#333',
  },  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  deleteIcon: {
    width: 14,
    height: 14,
    tintColor: '#555',
  },
  editContainer: {
    flex: 1,
    marginTop: 10,
  },
  editInput: {
    flex: 1,
    minHeight: 80,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 6,
    padding: 8,
  },  saveButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveIcon: {
    width: 14,
    height: 14,
    tintColor: '#fff',
  },
});

export default DraggableNote;