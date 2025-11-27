import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../types";
import * as authService from "../../services/authService";
import { NotificationSnackbar } from "../../components/UI/NotificationSnackbar";

const { width } = Dimensions.get("window");

interface RouteParams {
  email: string;
  username: string;
  password: string;
}

const EmailVerificationScreen = () => {
  const [isEmailSent, setIsEmailSent] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [notification, setNotification] = React.useState<{
    isVisible: boolean;
    message: string;
    isSuccess: boolean;
    onFinish?: () => void;
  }>({
    isVisible: false,
    message: "",
    isSuccess: true,
  });

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { email, username, password } = route.params as RouteParams;
  
  // Animazioni
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Animazione di entrata
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (isVerifying) {
      // Avvia il controllo periodico dello stato di verifica
      intervalRef.current = setInterval(async () => {
        try {
          const result = await authService.checkEmailVerificationStatus(email);
          if (result.success && result.isVerified) {
            clearInterval(intervalRef.current!);
            
            // Anima verso la schermata di congratulazioni
            setTimeout(() => {
              navigation.navigate("VerificationSuccess", {
                email,
                username,
                password,
              });
            }, 1000);
          }
        } catch (error) {
          console.error('Errore durante il controllo della verifica:', error);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVerifying, email, navigation, username, password]);

  // Animazione di pulsazione per l'icona email
  useEffect(() => {
    if (isVerifying) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isVerifying, pulseAnim]);

  const handleSendVerificationEmail = async () => {
    try {
      const result = await authService.sendVerificationEmail(email, "email_verification");
      if (result.success) {
        setIsEmailSent(true);
        setIsVerifying(true);
        setNotification({
          isVisible: true,
          message: "Email di verifica inviata! Controlla la tua casella di posta.",
          isSuccess: true,
          onFinish: () => setNotification((prev) => ({ ...prev, isVisible: false })),
        });
      } else {
        setNotification({
          isVisible: true,
          message: result.message || "Errore nell'invio dell'email di verifica",
          isSuccess: false,
          onFinish: () => setNotification((prev) => ({ ...prev, isVisible: false })),
        });
      }
    } catch {
      setNotification({
        isVisible: true,
        message: "Errore di connessione. Riprova più tardi.",
        isSuccess: false,
        onFinish: () => setNotification((prev) => ({ ...prev, isVisible: false })),
      });
    }
  };

  const handleGoBack = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    navigation.goBack();
  };

  const renderEmailIcon = () => (
    <Animated.View 
      style={[
        styles.emailIconContainer,
        {
          transform: [{ scale: isVerifying ? pulseAnim : 1 }],
        },
      ]}
    >
      <MaterialIcons 
        name="email" 
        size={60} 
        color={isVerifying ? "#000000" : "#666666"} 
      />
      {isVerifying && (
        <View style={styles.checkmarkContainer}>
          <MaterialIcons name="check-circle" size={24} color="#000000" />
        </View>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {renderEmailIcon()}
        
        <Text style={styles.title}>
          {isEmailSent ? "Verifica la tua email" : "Conferma il tuo indirizzo email"}
        </Text>
        
        <Text style={styles.emailText}>{email}</Text>
        
        {!isEmailSent ? (
          <Text style={styles.description}>
            Invieremo un&apos;email di verifica al tuo indirizzo. Clicca sul link nell&apos;email per completare la registrazione.
          </Text>
        ) : (
          <Text style={styles.description}>
            {isVerifying 
              ? "Stiamo controllando se hai verificato la tua email. Controlla la tua casella di posta e clicca sul link di verifica."
              : "Email inviata! Controlla la tua casella di posta."
            }
          </Text>
        )}

        {isVerifying && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#000000" />
            <Text style={styles.loadingText}>Controllo in corso...</Text>
          </View>
        )}

        {!isEmailSent ? (
          <TouchableOpacity
            style={[styles.primaryButton, { width: width * 0.9 }]}
            onPress={handleSendVerificationEmail}
          >
            <MaterialIcons name="send" size={20} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Invia email di verifica</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.secondaryButton, { width: width * 0.9 }]}
            onPress={handleSendVerificationEmail}
          >
            <MaterialIcons name="refresh" size={20} color="#007AFF" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>Invia di nuovo</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSection}>
          <Text style={styles.helpText}>Non hai ricevuto nessuna email?</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <FontAwesome name="arrow-left" size={16} color="#666666" style={styles.backIcon} />
            <Text style={styles.backButtonText}>Torna indietro a modificarla</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <NotificationSnackbar
        isVisible={notification.isVisible}
        message={notification.message}
        isSuccess={notification.isSuccess}
        onFinish={notification.onFinish}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emailIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  },
  checkmarkContainer: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "System",
  },
  emailText: {
    fontSize: 16,
    color: "#000000",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
    fontFamily: "System",
  },
  description: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
    fontFamily: "System",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#666666",
    fontFamily: "System",
  },
  primaryButton: {
    backgroundColor: "#000000",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "System",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e1e5e9",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 40,
    flexDirection: "row",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "System",
  },
  buttonIcon: {
    marginRight: 8,
  },
  bottomSection: {
    alignItems: "center",
    marginTop: 20,
  },
  helpText: {
    color: "#666666",
    fontSize: 16,
    marginBottom: 12,
    fontFamily: "System",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
  },
  backIcon: {
    marginRight: 8,
  },
  backButtonText: {
    color: "#666666",
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "System",
  },
});

export default EmailVerificationScreen;
