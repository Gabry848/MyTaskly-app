import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Platform, Keyboard, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatInputProps } from './types';

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, style }) => {
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const inputRef = useRef<TextInput>(null);

  // Helper per determinare il tipo di dispositivo
  const getDeviceType = () => {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = height / width;
    
    if (Platform.OS === 'ios') {
      return aspectRatio < 1.6 ? 'ipad' : 'iphone';
    }
    return 'android';
  };

  const deviceType = getDeviceType();

  const handleSend = useCallback(() => {
    if (inputText.trim() === '') return;
    onSendMessage(inputText);
    setInputText('');
    setInputHeight(44); // Reset dell'altezza dopo l'invio
    // Necessario per mantenere il focus dopo l'invio
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [inputText, onSendMessage]);

  const handleContentSizeChange = useCallback((event: any) => {
    const height = Math.max(44, Math.min(120, event.nativeEvent.contentSize.height + 20));
    setInputHeight(height);
  }, []);  return (
    <View style={[
      styles.inputContainer, 
      style,
      // Su iPad, aggiungiamo un po' meno ombra e padding
      deviceType === 'ipad' && styles.ipadContainer
    ]}>
      <TextInput
        ref={inputRef}
        style={[styles.input, { height: inputHeight }]}
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
        multiline={true}
        maxLength={1000}
        onContentSizeChange={handleContentSizeChange}
        blurOnSubmit={false}
        textAlignVertical="top"
      />
      <TouchableOpacity 
        style={[styles.sendButton, { height: inputHeight }]} 
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
    alignItems: 'flex-end', // Allinea gli elementi in basso
  },
  ipadContainer: {
    // Su iPad riduciamo l'ombra e il padding
    shadowOpacity: 0.02,
    elevation: 1,
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 44,
    maxHeight: 120,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    width: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
  },
});

export default ChatInput;
