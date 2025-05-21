import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatInputProps } from './types';

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, style }) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = useCallback(() => {
    if (inputText.trim() === '') return;
    onSendMessage(inputText);
    setInputText('');
    // Necessario per mantenere il focus dopo l'invio
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [inputText, onSendMessage]);

  return (
    <View style={[styles.inputContainer, style]}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={inputText}
        onChangeText={setInputText}
        placeholder="Scrivi un messaggio..."
        placeholderTextColor="#999"
        onSubmitEditing={handleSend}
        returnKeyType="send"
        autoFocus={Platform.OS === 'ios'}
        keyboardType="default"
        spellCheck={false}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <TouchableOpacity 
        style={styles.sendButton} 
        onPress={handleSend}
        disabled={inputText.trim() === ''}
      >
        <MaterialIcons 
          name="send" 
          size={24} 
          color={inputText.trim() === '' ? '#CCC' : '#007bff'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
  },
});

export default ChatInput;
