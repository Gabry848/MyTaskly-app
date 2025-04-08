import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

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
  panResponder: any;
  pan: Animated.ValueXY;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
}

const DraggableNote: React.FC<DraggableNoteProps> = ({ 
  note, 
  panResponder, 
  pan, 
  onDelete,
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);

  const handleLongPress = () => {
    setIsEditing(true);
    setEditText(note.text);
  };

  const handleSave = () => {
    if (editText.trim() !== '') {
      onUpdate(note.id, editText);
    }
    setIsEditing(false);
  };

  return (
    <Animated.View
      {...(isEditing ? {} : panResponder.panHandlers)}
      style={[
        styles.note,
        {
          backgroundColor: note.color,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          zIndex: note.zIndex,
          elevation: note.zIndex,
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => onDelete(note.id)}
      >
        <FontAwesome name="times" size={16} color="#555" />
      </TouchableOpacity>
      
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            autoFocus
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <FontAwesome name="check" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          onPress={handleLongPress} 
          // delayLongPress={500}
          // activeOpacity={0.7}
        >
          <Text style={styles.noteText}>{note.text}</Text>
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
  },
  deleteButton: {
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
  },
  saveButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default DraggableNote;