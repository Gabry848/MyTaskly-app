import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Platform, Keyboard, Dimensions, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatInputProps } from './types';
import { useVoiceRecording } from './hooks/useVoiceRecording';
import VoiceRecordButton from './VoiceRecordButton';

interface ExtendedChatInputProps extends ChatInputProps {
  modelType?: 'base' | 'advanced';
}

const ChatInput: React.FC<ExtendedChatInputProps> = ({ 
  onSendMessage, 
  onSendVoiceMessage, 
  style, 
  modelType = 'base' 
}) => {  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const inputRef = useRef<TextInput>(null);
  
  // Hook per la registrazione vocale
  const {
    isRecording,
    recordingDuration,
    isProcessing,
    startRecording,
    stopRecording,
    requestPermissions,
  } = useVoiceRecording();

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
  }, []);

  // Gestione della registrazione vocale
  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Errore durante l\'avvio della registrazione:', error);
      Alert.alert('Errore', 'Impossibile avviare la registrazione vocale.');
    }
  }, [startRecording]);  const handleStopRecording = useCallback(async () => {
    try {
      // Il nuovo hook gestisce internamente l'invio al backend e restituisce messaggio utente e risposta bot
      const result = await stopRecording(modelType);
      
      if (result && result.userMessage && result.userMessage.trim()) {
        // Invia il messaggio trascritto dell'utente come messaggio normale
        onSendMessage(result.userMessage);
        
        // TODO: In futuro, se volessi mostrare anche la risposta del bot automaticamente,
        // potresti anche gestire result.botResponse qui
        console.log("Risposta bot disponibile:", result.botResponse);
      }
    } catch (error) {
      console.error('Errore durante l\'arresto della registrazione:', error);
      Alert.alert('Errore', 'Impossibile processare il messaggio vocale.');
    }
  }, [stopRecording, modelType, onSendMessage]);return (
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
        onChangeText={setInputText}        placeholder={isProcessing ? "Elaborazione in corso..." : "Scrivi un messaggio..."}
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
        editable={!isRecording && !isProcessing}      />
      
      <View style={styles.buttonContainer}>        <VoiceRecordButton
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          disabled={isProcessing}
        />
        
        <TouchableOpacity 
          style={[styles.sendButton, { height: inputHeight }]} 
          onPress={handleSend}
          disabled={inputText.trim() === '' || isRecording || isProcessing}
        >
          <MaterialIcons 
            name="send" 
            size={24} 
            color={(inputText.trim() === '' || isRecording || isProcessing) ? '#CCC' : '#007bff'} 
          />
        </TouchableOpacity>
      </View>
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
    gap: 8, // Spaziatura uniforme tra gli elementi
  },
  ipadContainer: {
    // Su iPad riduciamo l'ombra e il padding
    shadowOpacity: 0.02,
    elevation: 1,
    padding: 8,
  },  input: {
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
    marginRight: 0, // Rimuove margine per usare gap
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginLeft: 0, // Rimuove margine per usare gap
  },
});

export default ChatInput;
