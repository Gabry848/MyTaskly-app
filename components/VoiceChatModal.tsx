import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface VoiceChatModalProps {
  visible: boolean;
  onClose: () => void;
  isRecording?: boolean;
}

const { width, height } = Dimensions.get("window");

const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  visible,
  onClose,
  isRecording = false,
}) => {
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
  }, [isRecording]);

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

  const handleMicPress = () => {
    // Per ora solo console.log, implementazione futura
    console.log("Mic pressed - start/stop recording");
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
            {isRecording ? "Sto ascoltando..." : "Tocca per parlare"}
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
                isRecording && styles.microphoneCircleRecording,
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
                  name={isRecording ? "stop" : "mic"}
                  size={48}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Testo di stato */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {isRecording
                ? "Registrazione in corso..."
                : "Premi il microfono per iniziare"}
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
