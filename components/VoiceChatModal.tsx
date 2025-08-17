import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { Audio } from 'expo-av';
import RNSoundLevel from 'react-native-sound-level';

type VoiceChatModalProps = {
  visible: boolean;
  onClose: () => void;
};

class ActionProvider {
  public data: any = { 
    count: 0,
    recording: false,
    speaking: false,
    recordingData: null
  };
}

const actionProvider = new ActionProvider();

const VoiceChatModal: React.FC<VoiceChatModalProps> = ({ visible, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(false);

  const getPermission = async (): Promise<boolean> => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };


  const convertAudioToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data || "");
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting audio to base64:', error);
      return '';
    }
  };

  const processAudio = async (uri: string) => {
    try {
      setIsProcessing(true);
      const base64Audio = await convertAudioToBase64(uri);

      actionProvider.data["speaking"] = true;
      
      console.log('Audio processed successfully!');
      console.log('Audio URI:', uri);
      console.log('Base64 Audio length:', base64Audio.length);
      console.log('Simulating server response...');
      
      setTimeout(() => {
        actionProvider.data["speaking"] = false;
        setIsProcessing(false);
        console.log('Audio processing completed');
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      console.error('Error processing audio:', error);
      Alert.alert(
        'Error',
        'Failed to process audio'
      );
    }
  };


  const startRecording = async () => {
    const permission = await getPermission();
    if (!permission) {
      Alert.alert('Permission required', 'Please grant microphone permission');
      return;
    }

    if (actionProvider.data["speaking"]) {
      console.log('Avatar is speaking, interrupting...');
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const options: Audio.RecordingOptions = {
        android: {
          extension: ".m4a",
          audioEncoder: 0,
          outputFormat: 2,
        },
        ios: {
          audioQuality: 32,
          bitRate: 128000,
          extension: ".m4a",
          numberOfChannels: 1,
          sampleRate: 44100,
        },
        web: {},
      };

      const { recording } = await Audio.Recording.createAsync(
        options
      );
      
      actionProvider.data["recording"] = true;
      actionProvider.data["recordingData"] = recording;
      setIsRecording(true);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async (): Promise<void> => {
    if (!actionProvider.data["recordingData"]) {
      console.log('No recording data available');
      return;
    }

    try {
      await actionProvider.data["recordingData"].stopAndUnloadAsync();
      const uri = await actionProvider.data["recordingData"].getURI();
      
      actionProvider.data["recording"] = false;
      actionProvider.data["recordingData"] = null;
      setIsRecording(false);
      
      console.log('Recording stopped, URI:', uri);
      
      if (uri) {
        await processAudio(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const initiateVoiceRecognition = async () => {
    try {
      const dataCheck = Platform.OS === 'ios' ? -30 : -40;
      const dataCheckTwo = Platform.OS === 'ios' ? 14 : 20;
      
      let sounds: number[] = [];
      let silenceCounter = 0;
      let silenceThreshold = 10;
      
      RNSoundLevel.start();
      console.log('Voice recognition started with thresholds:', { dataCheck, dataCheckTwo });

      RNSoundLevel.onNewFrame = async (data: { value: number, rawValue: number }) => {
        if (actionProvider.data["speaking"]) return;

        // Speech start detection
        if (data.value > dataCheck && !actionProvider.data["recording"]) {
          if (sounds.length > 2) return;

          if (sounds.length < 2) {
            sounds.push(data.value);
            return;
          }

          const diff = sounds[1] - sounds[0];
          if (diff < -5) {
            sounds = [];
            return;
          }

          actionProvider.data["recording"] = true;
          sounds = [];
          console.log('Speech detected, starting recording');
          startRecording();
        }

        // Speech end detection
        if (actionProvider.data["recording"] && data.value < dataCheck) {
          silenceCounter++;
          
          if (silenceCounter >= silenceThreshold) {
            console.log('Silence detected, stopping recording');
            silenceCounter = 0;
            stopRecording();
          }
        } else if (actionProvider.data["recording"] && data.value >= dataCheck) {
          silenceCounter = 0;
        }
      };
    } catch (error) {
      console.log('Voice recognition initialization error:', error);
    }
  };

  const startSession = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      console.log('Starting voice recognition session...');
      setActiveSession(true);
      setIsLoading(false);
      
      await initiateVoiceRecognition();
      console.log('Voice recognition session started successfully');
    } catch (error) {
      console.error('Error initiating session:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to start session');
    }
  };

  const stopSession = async () => {
    try {
      console.log('Stopping voice recognition session...');
      RNSoundLevel.stop();
      
      if (actionProvider.data["recordingData"]) {
        await stopRecording();
      }
      
      setActiveSession(false);
      setIsRecording(false);
      setIsProcessing(false);
      
      actionProvider.data = {
        count: 0,
        recording: false,
        speaking: false,
        recordingData: null
      };
      
      console.log('Session stopped');
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      if (visible) {
        await startSession();
      } else {
        await stopSession();
      }
    };
    
    initSession();
    
    return () => {
      stopSession();
    };
  }, [visible]);

  const handleClose = () => {
    stopSession();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Voice Recognition Test</Text>
        
        {isLoading && (
          <Text style={styles.status}>Initializing voice recognition...</Text>
        )}
        
        {activeSession && !isLoading && (
          <View style={styles.statusContainer}>
            <Text style={styles.status}>
              {isRecording ? '🎤 Recording...' : '🎧 Listening for voice...'}
            </Text>
            
            {isProcessing && (
              <Text style={styles.processingText}>Processing audio...</Text>
            )}
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={startRecording}
            disabled={isRecording || isProcessing}
          >
            <Text style={styles.buttonText}>Manual Record Test</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={stopRecording}
            disabled={!isRecording}
          >
            <Text style={styles.buttonText}>Stop Recording</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 40,
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  status: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  processingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  testButton: {
    backgroundColor: '#28a745',
  },
  closeButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});


export default VoiceChatModal;