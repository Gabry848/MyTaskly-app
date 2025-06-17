import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert, Platform } from 'react-native';

export interface UseVoiceRecordingReturn {
  isRecording: boolean;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  requestPermissions: () => Promise<boolean>;
}

export const useVoiceRecording = (): UseVoiceRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
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
      });      // Crea una nuova registrazione
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

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
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) return null;

      setIsRecording(false);
      
      // Ferma il timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      // Ferma la registrazione
      await recordingRef.current.stopAndUnloadAsync();
      
      // Ottieni l'URI del file
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setRecordingDuration(0);

      return uri;

    } catch (error) {
      console.error('Errore durante l\'arresto della registrazione:', error);
      Alert.alert('Errore', 'Impossibile fermare la registrazione vocale.');
      return null;
    }
  };

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    requestPermissions,
  };
};
