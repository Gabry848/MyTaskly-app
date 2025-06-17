import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert, Platform } from 'react-native';
import { sendVoiceMessageToBot, sendVoiceMessageToBotDebug, sendVoiceMessageToBotComplete } from '../../../src/services/botservice';

export interface UseVoiceRecordingReturn {
  isRecording: boolean;
  recordingDuration: number;
  isProcessing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: (modelType?: 'base' | 'advanced') => Promise<{userMessage: string, botResponse: string} | null>;
  requestPermissions: () => Promise<boolean>;
}

export const useVoiceRecording = (): UseVoiceRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert(
          'Permesso richiesto',
          'Per utilizzare la registrazione vocale, è necessario concedere il permesso di accesso al microfono.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Errore durante la richiesta dei permessi:', error);
      return false;
    }
  };

  const startRecording = async (): Promise<void> => {
    try {
      // Richiedi permessi se necessario
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      // Configura l'audio per la registrazione
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });      // Usa configurazioni più semplici e testate
      let recordingOptions: Audio.RecordingOptions;
      
      if (Platform.OS === 'android') {
        recordingOptions = {
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          web: {
            mimeType: 'audio/mp4',
            bitsPerSecond: 128000,
          },
        };
      } else {
        // Per iOS e Web, usa M4A che è più compatibile
        recordingOptions = {
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          web: {
            mimeType: 'audio/mp4',
            bitsPerSecond: 128000,
          },
        };
      }

      console.log("Usando configurazione di registrazione:", recordingOptions);

      const { recording } = await Audio.Recording.createAsync(recordingOptions);

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Avvia il timer per la durata
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Errore durante l\'avvio della registrazione:', error);
      Alert.alert('Errore', 'Impossibile avviare la registrazione vocale.');
    }
  };  const stopRecording = async (modelType: 'base' | 'advanced' = 'base'): Promise<{userMessage: string, botResponse: string} | null> => {
    try {
      if (!recordingRef.current) return null;

      setIsRecording(false);
      
      // Ferma il timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      console.log("=== STOP RECORDING DEBUG ===");
      console.log("Recording object:", recordingRef.current);

      // Ferma la registrazione
      await recordingRef.current.stopAndUnloadAsync();
      
      // Ottieni l'URI del file
      const uri = recordingRef.current.getURI();
      console.log("Recording URI ottenuto:", uri);
      
      recordingRef.current = null;
      setRecordingDuration(0);

      if (!uri) {
        console.error("URI del file registrato è null");
        Alert.alert('Errore', 'Impossibile ottenere il file audio registrato.');
        return null;
      }

      // Verifica che l'URI sia valido
      if (uri.trim() === '') {
        console.error("URI del file registrato è vuoto");
        Alert.alert('Errore', 'Il file audio registrato non è valido.');
        return null;
      }      console.log("URI valido, tentativo di invio:", uri);

      // Invia il file audio al backend e ottieni sia messaggio utente che risposta bot
      setIsProcessing(true);
      try {
        const result = await sendVoiceMessageToBotComplete(uri, modelType);
        console.log("Risultato completo ricevuto:", result);
        
        if (!result) {
          Alert.alert('Errore', 'Impossibile processare il messaggio vocale.');
          return null;
        }
        
        return result;
      } catch (error) {
        console.error('Errore durante l\'invio del messaggio vocale:', error);
        Alert.alert('Errore', 'Impossibile processare il messaggio vocale.');
        return null;
      } finally {
        setIsProcessing(false);
      }

    } catch (error) {
      console.error('Errore durante l\'arresto della registrazione:', error);
      Alert.alert('Errore', 'Impossibile fermare la registrazione vocale.');
      setIsProcessing(false);
      return null;
    }
  };
  return {
    isRecording,
    recordingDuration,
    isProcessing,
    startRecording,
    stopRecording,
    requestPermissions,
  };
};
