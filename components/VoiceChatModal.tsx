import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from 'expo-av';
import { sendVoiceMessageToBot } from '../src/services/botservice';

interface VoiceChatModalProps {
  visible: boolean;
  onClose: () => void;
  isRecording?: boolean;
  onVoiceResponse?: (response: string) => void;
}

const { height } = Dimensions.get("window");

const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  visible,
  onClose,
  isRecording: externalIsRecording = false,
  onVoiceResponse,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  // Animazioni
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;
  const slideIn = useRef(new Animated.Value(height)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const recordingScale = useRef(new Animated.Value(1)).current;

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
  }, [visible]);

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
  }, [visible]);

  // Inizializza i permessi audio
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.error('Errore nella configurazione audio:', error);
      }
    };

    if (visible) {
      setupAudio();
    }
  }, [visible]);

  // Animazione durante la registrazione
  useEffect(() => {
    if (isRecording || isProcessing) {
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
  }, [isRecording, isProcessing]);

  // Cleanup dell'audio quando il modal si chiude
  useEffect(() => {
    if (!visible) {
      // Ferma la registrazione se in corso
      if (recording) {
        stopRecording();
      }
      // Ferma la riproduzione se in corso
      if (sound) {
        sound.unloadAsync();
        setSound(null);
      }
    }
  }, [visible]);

  const handleClose = () => {
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

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setStatusText("Registrazione in corso...");
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      
      console.log('🎤 Registrazione avviata');
    } catch (error) {
      console.error('Errore durante l\'avvio della registrazione:', error);
      Alert.alert('Errore', 'Impossibile avviare la registrazione');
      setIsRecording(false);
      setStatusText("");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      setIsRecording(false);
      setIsProcessing(true);
      setStatusText("Elaborazione in corso...");
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        console.log('🎤 Registrazione completata:', uri);
        await sendAudioToServer(uri);
      }
    } catch (error) {
      console.error('Errore durante l\'arresto della registrazione:', error);
      setIsProcessing(false);
      setStatusText("");
    }
  };

  const sendAudioToServer = async (audioUri: string) => {
    try {
      // Converti l'URI in un file
      const response = await fetch(audioUri);
      const audioBlob = await response.blob();
      
      // Invia al backend
      const result = await sendVoiceMessageToBot(
        audioBlob,
        "advanced" // Usa il modello avanzato per la chat vocale - altre impostazioni automatiche dal server
      );
      
      setIsProcessing(false);
      
      if (result.success) {
        if (result.audioUrl) {
          // Riproduci la risposta audio
          setStatusText("Riproduzione risposta...");
          await playAudioResponse(result.audioUrl);
        } else if (result.textResponse) {
          // Mostra la risposta testuale
          setStatusText("Risposta ricevuta");
          if (onVoiceResponse) {
            onVoiceResponse(result.textResponse);
          }
          Alert.alert('Risposta', result.textResponse);
        }
      } else {
        // Gestisci errore
        setStatusText("");
        Alert.alert('Errore', result.error || 'Errore sconosciuto');
      }
      
      // Reset dopo un breve delay
      setTimeout(() => {
        setStatusText("");
      }, 2000);
      
    } catch (error) {
      console.error('Errore nell\'invio dell\'audio:', error);
      setIsProcessing(false);
      setStatusText("");
      Alert.alert('Errore', 'Impossibile inviare il messaggio vocale');
    }
  };

  const playAudioResponse = async (audioUrl: string) => {
    try {
      // Ferma il suono precedente se presente
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Carica e riproduci il nuovo audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      
      // Gestisci la fine della riproduzione
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setStatusText("");
          newSound.unloadAsync();
          setSound(null);
        }
      });
      
    } catch (error) {
      console.error('Errore nella riproduzione audio:', error);
      setStatusText("");
      Alert.alert('Errore', 'Impossibile riprodurre la risposta audio');
    }
  };

  const handleMicPress = () => {
    if (isProcessing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
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
          <Text style={styles.subtitle}>
            {isProcessing ? "Elaborazione..." : isRecording ? "Sto ascoltando..." : "Tocca per parlare"}
          </Text>

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

            {/* Cerchio principale del microfono */}
            <Animated.View
              style={[
                styles.microphoneCircle,
                (isRecording || isProcessing) && styles.microphoneCircleRecording,
                isProcessing && styles.microphoneCircleProcessing,
                {
                  transform: [{ scale: recordingScale }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.microphoneButton}
                onPress={handleMicPress}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isProcessing ? "hourglass" : isRecording ? "stop" : "mic"}
                  size={48}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Testo di stato */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {statusText || 
                (isProcessing 
                  ? "Elaborazione in corso..." 
                  : isRecording 
                    ? "Registrazione in corso..."
                    : "Premi il microfono per iniziare"
                )
              }
            </Text>
          </View>
        </View>

        {/* Footer con istruzioni */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Parla chiaramente e attendi la risposta
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
});

export default VoiceChatModal;
