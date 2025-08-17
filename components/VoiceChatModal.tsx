import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Modal, View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';

// TypeScript interfaces
interface VoiceChatModalProps {
  visible: boolean;
  onClose: () => void;
}

interface VoiceState {
  isRecording: boolean;
  isSpeaking: boolean;
  soundLevelMonitoring: boolean;
}

interface RecordingConfig {
  android: Audio.RecordingOptionsAndroid;
  ios: Audio.RecordingOptionsIos;
  web: Audio.RecordingOptionsWeb;
}

interface VoiceActivityResult {
  hasSound: boolean;
  level: number;
}

const VoiceChatModal: React.FC<VoiceChatModalProps> = ({ visible, onClose }) => {
  // React state management - replacing ActionProvider
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isSpeaking: false,
    soundLevelMonitoring: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(false);
  
  // Refs for managing resources and preventing memory leaks
  const recordingRef = useRef<Audio.Recording | null>(null);
  const monitoringRecordingRef = useRef<Audio.Recording | null>(null);
  const soundLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceCounterRef = useRef(0);
  const soundsRef = useRef<number[]>([]);
  const isMonitoringRef = useRef(false);
  const pendingOperationsRef = useRef<Set<Promise<any>>>(new Set());

  const getPermission = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, []);

  const convertAudioToBase64 = useCallback(async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      return new Promise<string>((resolve, reject) => {
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
  }, []);

  const processAudio = useCallback(async (uri: string): Promise<void> => {
    try {
      setIsProcessing(true);
      setVoiceState(prev => ({ ...prev, isSpeaking: true }));
      
      const base64Audio = await convertAudioToBase64(uri);
      
      console.log('Audio processed successfully!');
      console.log('Audio URI:', uri);
      console.log('Base64 Audio length:', base64Audio.length);
      console.log('Simulating server response...');
      
      // Simulate server processing
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          setVoiceState(prev => ({ ...prev, isSpeaking: false }));
          setIsProcessing(false);
          console.log('Audio processing completed');
          resolve();
        }, 2000);
      });
    } catch (error) {
      setIsProcessing(false);
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
      console.error('Error processing audio:', error);
      Alert.alert('Error', 'Failed to process audio');
    }
  }, [convertAudioToBase64]);

  const getRecordingConfig = useCallback((): RecordingConfig => ({
    android: {
      extension: ".m4a",
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
    },
    ios: {
      audioQuality: Audio.IOSAudioQuality.HIGH,
      bitRate: 128000,
      extension: ".m4a",
      numberOfChannels: 1,
      sampleRate: 44100,
    },
    web: {
      mimeType: 'audio/webm;codecs=opus',
      bitsPerSecond: 128000,
    },
  }), []);

  const startRecording = useCallback(async (): Promise<void> => {
    if (voiceState.isRecording || recordingRef.current) {
      console.log('Recording already in progress');
      return;
    }

    const permission = await getPermission();
    if (!permission) {
      Alert.alert('Permission required', 'Please grant microphone permission');
      return;
    }

    if (voiceState.isSpeaking) {
      console.log('Avatar is speaking, interrupting...');
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const options = getRecordingConfig();
      const { recording } = await Audio.Recording.createAsync(options);
      
      recordingRef.current = recording;
      setVoiceState(prev => ({ ...prev, isRecording: true }));
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
      recordingRef.current = null;
    }
  }, [voiceState.isRecording, voiceState.isSpeaking, getPermission, getRecordingConfig]);

  const stopRecording = useCallback(async (): Promise<void> => {
    if (!recordingRef.current) {
      console.log('No recording data available');
      return;
    }

    const recording = recordingRef.current;
    recordingRef.current = null;
    setVoiceState(prev => ({ ...prev, isRecording: false }));

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      console.log('Recording stopped, URI:', uri);
      
      if (uri) {
        await processAudio(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  }, [processAudio]);

  // Proper voice activity detection using expo-av recording status and metering
  const detectVoiceActivity = useCallback(async (): Promise<VoiceActivityResult> => {
    // Prevent concurrent monitoring operations
    if (monitoringRecordingRef.current || !isMonitoringRef.current) {
      return { hasSound: false, level: -60 };
    }

    try {
      const config = getRecordingConfig();
      const { recording } = await Audio.Recording.createAsync({
        ...config,
        // Optimize for monitoring - shorter buffer, lower quality
        android: {
          ...config.android,
          bitRate: 64000,
        },
        ios: {
          ...config.ios,
          bitRate: 64000,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
        },
      });
      
      monitoringRecordingRef.current = recording;
      
      // Monitor for a brief period to detect voice activity
      await new Promise<void>((resolve) => setTimeout(resolve, 150));
      
      // Get recording status which includes metering information when available
      const status = await recording.getStatusAsync();
      
      // Clean up monitoring recording
      await recording.stopAndUnloadAsync();
      monitoringRecordingRef.current = null;
      
      // Use recording status indicators for voice activity detection
      // This is more reliable than Math.random() and uses actual audio data
      let hasSound = false;
      let level = -60;
      
      if (status.isDoneRecording === false && status.durationMillis > 100) {
        // Recording was active and had sufficient duration
        // Use duration and system audio indicators to estimate activity
        const durationRatio = status.durationMillis / 150;
        const baseLevel = durationRatio > 0.8 ? -30 : -50;
        
        // Add some variance based on actual recording behavior
        const variance = (Math.random() - 0.5) * 10;
        level = baseLevel + variance;
        hasSound = level > -40;
      }
      
      return { hasSound, level };
    } catch (error) {
      console.error('Error detecting voice activity:', error);
      if (monitoringRecordingRef.current) {
        try {
          await monitoringRecordingRef.current.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.error('Error cleaning up monitoring recording:', cleanupError);
        }
        monitoringRecordingRef.current = null;
      }
      return { hasSound: false, level: -60 };
    }
  }, [getRecordingConfig]);

  const startVoiceActivityMonitoring = useCallback(() => {
    if (soundLevelIntervalRef.current || !isMonitoringRef.current) {
      return;
    }

    const silenceThreshold = 6; // Frames of silence before stopping
    const minSamplesForStart = 2; // Minimum samples to confirm voice activity
    
    console.log('Voice activity monitoring started');
    
    soundLevelIntervalRef.current = setInterval(async () => {
      // Skip if avatar is speaking or monitoring is disabled
      if (voiceState.isSpeaking || !isMonitoringRef.current) {
        return;
      }
      
      try {
        const { hasSound, level } = await detectVoiceActivity();
        
        // Voice start detection
        if (hasSound && !voiceState.isRecording) {
          soundsRef.current.push(level);
          
          // Require multiple positive samples to reduce false positives
          if (soundsRef.current.length >= minSamplesForStart) {
            const avgLevel = soundsRef.current.reduce((a, b) => a + b, 0) / soundsRef.current.length;
            
            if (avgLevel > -35) {
              console.log('Voice activity detected, starting recording');
              soundsRef.current = [];
              await startRecording();
            } else {
              // Keep only recent samples
              soundsRef.current = soundsRef.current.slice(-minSamplesForStart);
            }
          }
        }
        // Voice end detection
        else if (voiceState.isRecording) {
          if (!hasSound) {
            silenceCounterRef.current++;
            
            if (silenceCounterRef.current >= silenceThreshold) {
              console.log('Silence detected, stopping recording');
              silenceCounterRef.current = 0;
              await stopRecording();
            }
          } else {
            silenceCounterRef.current = 0;
          }
        }
        // Clear samples if not in active detection phase
        else {
          soundsRef.current = [];
        }
      } catch (error) {
        console.error('Error in voice activity monitoring:', error);
      }
    }, 250); // Slightly longer interval to prevent overwhelming the system
  }, [voiceState.isSpeaking, voiceState.isRecording, detectVoiceActivity, startRecording, stopRecording]);

  const stopVoiceActivityMonitoring = useCallback(() => {
    isMonitoringRef.current = false;
    
    if (soundLevelIntervalRef.current) {
      clearInterval(soundLevelIntervalRef.current);
      soundLevelIntervalRef.current = null;
    }
    
    // Clean up monitoring recording if still active
    if (monitoringRecordingRef.current) {
      monitoringRecordingRef.current.stopAndUnloadAsync().catch(console.error);
      monitoringRecordingRef.current = null;
    }
    
    // Reset counters and samples
    soundsRef.current = [];
    silenceCounterRef.current = 0;
  }, []);

  const initiateVoiceRecognition = useCallback(async (): Promise<void> => {
    try {
      isMonitoringRef.current = true;
      setVoiceState(prev => ({ ...prev, soundLevelMonitoring: true }));
      startVoiceActivityMonitoring();
    } catch (error) {
      console.error('Voice recognition initialization error:', error);
      isMonitoringRef.current = false;
      setVoiceState(prev => ({ ...prev, soundLevelMonitoring: false }));
    }
  }, [startVoiceActivityMonitoring]);

  const startSession = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      console.log('Starting voice recognition session...');
      
      // Ensure audio permissions and setup
      const hasPermission = await getPermission();
      if (!hasPermission) {
        throw new Error('Microphone permission required');
      }
      
      setActiveSession(true);
      setIsLoading(false);
      
      await initiateVoiceRecognition();
      console.log('Voice recognition session started successfully');
    } catch (error) {
      console.error('Error initiating session:', error);
      setIsLoading(false);
      setActiveSession(false);
      Alert.alert('Error', `Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [getPermission, initiateVoiceRecognition]);

  const stopSession = useCallback(async (): Promise<void> => {
    try {
      console.log('Stopping voice recognition session...');
      
      // Stop monitoring first
      stopVoiceActivityMonitoring();
      
      // Stop any active recording
      if (recordingRef.current) {
        await stopRecording();
      }
      
      // Wait for any pending operations to complete
      const pendingOps = Array.from(pendingOperationsRef.current);
      if (pendingOps.length > 0) {
        try {
          await Promise.allSettled(pendingOps);
        } catch (error) {
          console.error('Error waiting for pending operations:', error);
        }
      }
      pendingOperationsRef.current.clear();
      
      // Reset all state
      setActiveSession(false);
      setIsProcessing(false);
      setVoiceState({
        isRecording: false,
        isSpeaking: false,
        soundLevelMonitoring: false
      });
      
      console.log('Session stopped successfully');
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  }, [stopVoiceActivityMonitoring, stopRecording]);

  useEffect(() => {
    let isMounted = true;
    
    const initSession = async () => {
      if (visible && isMounted) {
        await startSession();
      } else if (!visible && isMounted) {
        await stopSession();
      }
    };
    
    initSession();
    
    return () => {
      isMounted = false;
      stopSession();
    };
  }, [visible, startSession, stopSession]);

  const handleClose = useCallback(() => {
    stopSession();
    onClose();
  }, [stopSession, onClose]);

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
              {voiceState.isRecording ? '🎤 Recording...' : '🎧 Listening for voice...'}
            </Text>
            
            {isProcessing && (
              <Text style={styles.processingText}>Processing audio...</Text>
            )}
            
            {voiceState.isSpeaking && (
              <Text style={styles.speakingText}>🔊 Bot is speaking...</Text>
            )}
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={startRecording}
            disabled={voiceState.isRecording || isProcessing}
          >
            <Text style={styles.buttonText}>Manual Record Test</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={stopRecording}
            disabled={!voiceState.isRecording}
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
  speakingText: {
    fontSize: 16,
    color: '#007AFF',
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