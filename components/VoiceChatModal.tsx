import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import useVoiceInput from '../src/hooks/useVoiceInput';
import { formatDuration, checkAudioPermissions } from '../src/utils/audioUtils';
import Voice from '@react-native-voice/voice';

interface VoiceChatModalProps {
  visible: boolean;
  onClose: () => void;
  isRecording?: boolean;
  onVoiceResponse?: (response: string) => void;
}

type VoiceChatState = 'idle' | 'connecting' | 'connected' | 'recording' | 'processing' | 'speaking' | 'error' | 'disconnected';

const { height } = Dimensions.get("window");

const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  visible,
  onClose,
  isRecording: externalIsRecording = false,
  onVoiceResponse,
}) => {
  // Hook personalizzato per gestire la chat vocale
  const { text, isListening, start, stop } = useVoiceInput();
  
  // Stati locali
  const [state, setState] = useState<VoiceChatState>('idle');
  const [error, setError] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [serverStatus, setServerStatus] = useState<{phase: string, message: string} | null>(null);
  const [voiceInitialized, setVoiceInitialized] = useState(false);
  const [internalIsListening, setIsListening] = useState(false);
  
  // Stati derivati
  const isRecording = isListening || internalIsListening || externalIsRecording;
  const isConnected = state === 'connected' || state === 'recording' || state === 'processing' || state === 'speaking';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';
  const canRecord = isConnected && !isRecording && !isProcessing && !isSpeaking;
  const canStop = isRecording;

  // Animazioni esistenti
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;
  const slideIn = useRef(new Animated.Value(height)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const recordingScale = useRef(new Animated.Value(1)).current;

  // Inizializzazione Voice API
  const initializeVoice = useCallback(async (): Promise<boolean> => {
    try {
      if (voiceInitialized) {
        return true;
      }

      // Verifica che Voice sia disponibile
      if (!Voice) {
        console.error('Voice API non disponibile');
        setError('Servizio vocale non disponibile');
        return false;
      }

      // Setup event listeners
      Voice.onSpeechStart = () => {
        console.log('Voice: Speech started');
        setIsListening(true);
      };

      Voice.onSpeechEnd = () => {
        console.log('Voice: Speech ended');
        setIsListening(false);
      };

      Voice.onSpeechError = (error) => {
        console.error('Voice: Speech error', error);
        setError(`Errore riconoscimento vocale: ${error.error?.message || 'Errore sconosciuto'}`);
        setState('error');
        setIsListening(false);
      };

      Voice.onSpeechResults = (result) => {
        const recognizedText = result.value?.[0] || '';
        console.log('Voice: Speech results', recognizedText);
        if (recognizedText && onVoiceResponse) {
          onVoiceResponse(recognizedText);
        }
      };

      setVoiceInitialized(true);
      return true;
    } catch (error) {
      console.error('Errore inizializzazione Voice:', error);
      setError('Impossibile inizializzare il servizio vocale');
      return false;
    }
  }, [voiceInitialized, onVoiceResponse]);

  // Gestione permessi
  const requestPermissions = async (): Promise<boolean> => {
    try {
      // Verifica permessi audio usando la utility
      const audioGranted = await checkAudioPermissions();
      if (!audioGranted) {
        setError('Permessi microfono negati');
        return false;
      }

      setHasPermissions(true);
      return true;
    } catch (error) {
      console.error('Errore richiesta permessi:', error);
      setError('Impossibile ottenere i permessi per il microfono');
      return false;
    }
  };

  // Gestione connessione
  const connect = async () => {
    try {
      setState('connecting');
      setError('');
      
      // Inizializza Voice API
      const voiceReady = await initializeVoice();
      if (!voiceReady) {
        setState('error');
        return;
      }
      
      // Simula connessione al servizio vocale
      await new Promise(resolve => setTimeout(resolve, 500));
      setState('connected');
      setServerStatus({ phase: 'connected', message: 'Servizio vocale pronto' });
    } catch (error) {
      console.error('Errore connessione:', error);
      setError('Impossibile connettersi al servizio vocale');
      setState('error');
    }
  };

  // Gestione disconnessione
  const disconnect = async () => {
    try {
      if (isListening) {
        try {
          await Voice.stop();
        } catch (stopError) {
          console.error('Errore stop Voice:', stopError);
        }
      }
      
      // Cleanup Voice API
      if (voiceInitialized) {
        try {
          await Voice.destroy();
          Voice.removeAllListeners();
          setVoiceInitialized(false);
        } catch (destroyError) {
          console.error('Errore destroy Voice:', destroyError);
        }
      }
      
      setState('disconnected');
      setServerStatus(null);
    } catch (error) {
      console.error('Errore disconnessione:', error);
    }
  };

  // Gestione registrazione
  const startRecording = async () => {
    try {
      if (!voiceInitialized) {
        console.error('Voice API non inizializzata');
        setError('Servizio vocale non inizializzato');
        return;
      }

      setState('recording');
      setError('');
      setRecordingDuration(0);
      setServerStatus({ phase: 'recording', message: 'Ascolto in corso...' });
      
      // Usa l'hook start function che internamente chiama Voice.start
      await start();
    } catch (error) {
      console.error('Errore avvio registrazione:', error);
      setError('Impossibile avviare la registrazione');
      setState('error');
    }
  };

  const stopRecording = async () => {
    try {
      setState('processing');
      setServerStatus({ phase: 'processing', message: 'Elaborazione in corso...' });
      
      // Usa l'hook stop function che internamente chiama Voice.stop
      await stop();
      
      // Simula elaborazione
      await new Promise(resolve => setTimeout(resolve, 1000));
      setState('connected');
      setServerStatus({ phase: 'ready', message: 'Pronto per nuova registrazione' });
    } catch (error) {
      console.error('Errore stop registrazione:', error);
      setError('Errore durante l\'elaborazione');
      setState('error');
    }
  };

  const cancelRecording = async () => {
    try {
      if (isListening) {
        try {
          await stop();
        } catch (stopError) {
          console.error('Errore stop durante cancellazione:', stopError);
        }
      }
      setState('connected');
      setRecordingDuration(0);
      setServerStatus({ phase: 'cancelled', message: 'Registrazione annullata' });
    } catch (error) {
      console.error('Errore annullamento:', error);
    }
  };

  // Gestione riproduzione (placeholder)
  const stopPlayback = () => {
    setState('connected');
    setServerStatus({ phase: 'ready', message: 'Riproduzione fermata' });
  };

  // Gestione controlli (placeholder)
  const sendControl = (action: string) => {
    console.log('Controllo inviato:', action);
    if (action === 'cancel') {
      cancelRecording();
    }
  };

  // Gestione connessione con useCallback
  const handleConnect = useCallback(async () => {
    if (!hasPermissions) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permessi Richiesti',
          'La chat vocale richiede l\'accesso al microfono per funzionare.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
    }
    
    await connect();
  }, [hasPermissions]);

  // Gestione registrazione
  const handleRecordToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else if (canRecord) {
      await startRecording();
    }
  };

  const handleClose = () => {
    // Cleanup prima della chiusura
    if (isRecording) {
      cancelRecording().catch(console.error);
    }
    if (isSpeaking) {
      stopPlayback();
    }
    disconnect().catch(console.error);

    // Animazione di uscita
    Animated.parallel([
      Animated.timing(slideIn, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Gestione errori
  const handleErrorDismiss = () => {
    if (state === 'error') {
      handleConnect();
    }
  };

  // Animazione di entrata del modal
  useEffect(() => {
    if (visible) {
      // Reset delle animazioni
      slideIn.setValue(height);
      fadeIn.setValue(0);

      // Animazione di entrata
      Animated.parallel([
        Animated.timing(slideIn, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideIn, fadeIn]);

  // Auto-connessione e auto-start quando il modal si apre
  useEffect(() => {
    if (visible && state === 'idle') {
      handleConnect();
    }
  }, [visible, state, handleConnect]);

  // Auto-start recording dopo la connessione
  useEffect(() => {
    if (visible && state === 'connected' && !isListening && hasPermissions) {
      // Piccolo delay per dare tempo alla UI di essere pronta
      const autoStartTimer = setTimeout(() => {
        if (state === 'connected' && !isListening) {
          console.log('Auto-starting voice recording...');
          startRecording();
        }
      }, 800);

      return () => clearTimeout(autoStartTimer);
    }
  }, [visible, state, isListening, hasPermissions]);

  // Cleanup quando il modal si chiude
  useEffect(() => {
    if (!visible) {
      // Reset degli stati quando si chiude
      setState('idle');
      setError('');
      setRecordingDuration(0);
      setVoiceInitialized(false);
      if (isListening) {
        stop().catch(console.error);
      }
    }
  }, [visible, isListening, stop]);

  // Timer per la durata della registrazione
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 100);
      }, 100);
    } else {
      setRecordingDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Effetto per gestire le risposte vocali
  useEffect(() => {
    if (text && text.trim() && onVoiceResponse) {
      console.log('Voice response received:', text);
      onVoiceResponse(text);
      setState('processing');
      setServerStatus({ phase: 'completed', message: 'Testo riconosciuto con successo' });
      
      // Dopo un piccolo delay, torna allo stato connected per permettere nuove registrazioni
      setTimeout(() => {
        setState('connected');
        setServerStatus({ phase: 'ready', message: 'Pronto per nuova registrazione' });
      }, 1500);
    }
  }, [text, onVoiceResponse]);

  // Animazione del cerchio pulsante
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    if (visible) {
      pulseAnimation.start();
    }

    return () => {
      pulseAnimation.stop();
    };
  }, [visible, pulseScale, pulseOpacity]);

  // Animazione durante la registrazione
  useEffect(() => {
    if (isRecording) {
      const recordingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(recordingScale, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      recordingAnimation.start();

      return () => {
        recordingAnimation.stop();
      };
    } else {
      recordingScale.setValue(1);
    }
  }, [isRecording, recordingScale]);

  // Render dello stato
  const renderStateIndicator = () => {
    const getStateInfo = (currentState: VoiceChatState) => {
      switch (currentState) {
        case 'idle':
          return { icon: 'mic-off', color: '#666', text: 'Inattivo' };
        case 'connecting':
          return { icon: 'wifi', color: '#FFA500', text: 'Connessione...' };
        case 'connected':
          return { icon: 'mic', color: '#4CAF50', text: 'Pronto' };
        case 'recording':
          return { icon: 'fiber-manual-record', color: '#F44336', text: 'Registrando...' };
        case 'processing':
          return { icon: 'sync', color: '#2196F3', text: 'Elaborazione...' };
        case 'speaking':
          return { icon: 'volume-up', color: '#9C27B0', text: 'Parlando...' };
        case 'error':
          return { icon: 'error', color: '#F44336', text: 'Errore' };
        case 'disconnected':
          return { icon: 'wifi-off', color: '#666', text: 'Disconnesso' };
        default:
          return { icon: 'help', color: '#666', text: 'Sconosciuto' };
      }
    };

    const { icon, color, text } = getStateInfo(state);

    return (
      <View style={styles.stateContainer}>
        <MaterialIcons name={icon as any} size={18} color={color} />
        <Text style={[styles.stateText, { color }]}>{text}</Text>
      </View>
    );
  };

  // Render del pulsante principale
  const renderMainButton = () => {
    if (state === 'connecting' || isProcessing) {
      return (
        <Animated.View style={[
          styles.microphoneCircle,
          styles.microphoneCircleProcessing,
          { transform: [{ scale: recordingScale }] }
        ]}>
          <ActivityIndicator size="large" color="#fff" />
        </Animated.View>
      );
    }

    if (!isConnected && state !== 'error') {
      return (
        <Animated.View style={[
          styles.microphoneCircle,
          { transform: [{ scale: recordingScale }] }
        ]}>
          <TouchableOpacity
            style={styles.microphoneButton}
            onPress={handleConnect}
            activeOpacity={0.8}
          >
            <MaterialIcons name="wifi" size={48} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (state === 'error') {
      return (
        <Animated.View style={[
          styles.microphoneCircle,
          styles.microphoneCircleRecording,
          { transform: [{ scale: recordingScale }] }
        ]}>
          <TouchableOpacity
            style={styles.microphoneButton}
            onPress={handleErrorDismiss}
            activeOpacity={0.8}
          >
            <MaterialIcons name="refresh" size={48} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      );
    }

    return (
      <Animated.View style={[
        styles.microphoneCircle,
        isRecording && styles.microphoneCircleRecording,
        isProcessing && styles.microphoneCircleProcessing,
        { transform: [{ scale: recordingScale }] }
      ]}>
        <TouchableOpacity
          style={styles.microphoneButton}
          onPress={handleRecordToggle}
          activeOpacity={0.8}
          disabled={!canRecord && !canStop}
        >
          <Ionicons
            name={isRecording ? "stop" : "mic"}
            size={48}
            color="#ffffff"
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render dei controlli aggiuntivi
  const renderControls = () => {
    if (state === 'error' || state === 'idle' || state === 'disconnected') {
      return null;
    }

    return (
      <View style={styles.controlsContainer}>
        {isSpeaking && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={stopPlayback}
          >
            <MaterialIcons name="stop" size={24} color="#666" />
            <Text style={styles.controlText}>Stop</Text>
          </TouchableOpacity>
        )}
        
        {(isProcessing || isSpeaking) && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => sendControl('cancel')}
          >
            <MaterialIcons name="cancel" size={24} color="#666" />
            <Text style={styles.controlText}>Annulla</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render informazioni server
  const renderServerStatus = () => {
    if (!serverStatus) return null;

    return (
      <View style={styles.serverStatusContainer}>
        <Text style={styles.serverStatusPhase}>
          {serverStatus.phase.replace('_', ' ').toUpperCase()}
        </Text>
        <Text style={styles.serverStatusMessage}>
          {serverStatus.message}
        </Text>
      </View>
    );
  };

  // Render durata registrazione
  const renderRecordingDuration = () => {
    if (!isRecording || recordingDuration === 0) return null;

    return (
      <View style={styles.durationContainer}>
        <MaterialIcons name="access-time" size={16} color="#F44336" />
        <Text style={styles.durationText}>
          {formatDuration(recordingDuration)}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.8)" />
      
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideIn }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Contenuto principale */}
        <View style={styles.content}>
          {/* Titolo */}
          <Text style={styles.title}>Chat Vocale</Text>
          
          {/* Sottotitolo automatico */}
          <Text style={styles.autoSubtitle}>Attivazione automatica</Text>
          
          {/* Stato e sottotitolo dinamici */}
          {renderStateIndicator()}
          
          {/* Stato del server */}
          {renderServerStatus()}

          {/* Cerchio animato centrale */}
          <View style={styles.microphoneContainer}>
            {/* Cerchi di pulsazione */}
            <Animated.View
              style={[
                styles.pulseCircle,
                styles.pulseCircle1,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseCircle,
                styles.pulseCircle2,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />

            {/* Pulsante principale */}
            {renderMainButton()}
          </View>

          {/* Durata registrazione */}
          {renderRecordingDuration()}
          
          {/* Controlli aggiuntivi */}
          {renderControls()}

          {/* Messaggio di errore */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color="#F44336" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Mostra il testo riconosciuto se disponibile */}
          {text && (
            <View style={styles.textContainer}>
              <MaterialIcons name="record-voice-over" size={20} color="#4CAF50" />
              <Text style={styles.recognizedText}>{text}</Text>
            </View>
          )}
        </View>

        {/* Footer con istruzioni */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {state === 'recording' 
              ? 'Parla ora... Il riconoscimento è attivo'
              : state === 'processing'
              ? 'Elaborazione del messaggio...'
              : state === 'connected'
              ? 'Connesso - Attivazione automatica'
              : 'Inizializzazione servizio vocale...'
            }
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "space-between",
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "flex-end",
  },
  closeButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "300",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "System",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 80,
    fontFamily: "System",
  },
  microphoneContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 60,
  },
  pulseCircle: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  pulseCircle1: {
    width: 200,
    height: 200,
  },
  pulseCircle2: {
    width: 250,
    height: 250,
  },
  microphoneCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  microphoneCircleRecording: {
    backgroundColor: "#ff4444",
    borderColor: "#ff6666",
  },
  microphoneCircleProcessing: {
    backgroundColor: "#4444ff",
    borderColor: "#6666ff",
  },
  microphoneButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 70,
  },
  statusContainer: {
    alignItems: "center",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#bbbbbb",
    textAlign: "center",
    fontFamily: "System",
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 50,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#888888",
    textAlign: "center",
    fontFamily: "System",
  },
  // Nuovi stili per i componenti aggiunti
  stateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  stateText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "System",
  },
  serverStatusContainer: {
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(33, 150, 243, 0.2)",
    borderRadius: 12,
    minHeight: 40,
    justifyContent: "center",
  },
  serverStatusPhase: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#87CEEB",
    marginBottom: 2,
    fontFamily: "System",
  },
  serverStatusMessage: {
    fontSize: 10,
    color: "#cccccc",
    textAlign: "center",
    fontFamily: "System",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    borderRadius: 16,
  },
  durationText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B6B",
    fontFamily: "monospace",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  controlButton: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    minWidth: 60,
  },
  controlText: {
    marginTop: 4,
    fontSize: 11,
    color: "#cccccc",
    fontWeight: "500",
    fontFamily: "System",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    maxWidth: "90%",
  },
  errorText: {
    marginLeft: 8,
    color: "#FF6B6B",
    fontSize: 12,
    flex: 1,
    fontFamily: "System",
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    maxWidth: "90%",
  },
  recognizedText: {
    marginLeft: 8,
    color: "#4CAF50",
    fontSize: 14,
    flex: 1,
    fontFamily: "System",
  },
  autoSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "System",
  },
});

export default VoiceChatModal;
