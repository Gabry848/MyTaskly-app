import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../types";
import * as authService from "../../services/authService";
import { NotificationSnackbar } from "../../../components/NotificationSnackbar";

const { width } = Dimensions.get("window");

interface EmailVerificationProps {
  route: {
    params: {
      email: string;
      username: string;
    };
  };
}

const EmailVerificationScreen = () => {
  const route = useRoute();
  const { email, username } = route.params as { email: string; username: string };
  
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [notification, setNotification] = useState<{
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

  const showNotification = (message: string, isSuccess: boolean, onFinish?: () => void) => {
    setNotification({
      isVisible: true,
      message,
      isSuccess,
      onFinish: () => {
        setNotification((prev) => ({ ...prev, isVisible: false }));
        if (onFinish) onFinish();
      },
    });
  };

  // Funzione per controllare lo stato di verifica
  const checkVerificationStatus = async (showLoadingState: boolean = true) => {
    if (showLoadingState) setIsChecking(true);
    
    try {
      const result = await authService.checkEmailVerificationStatus(email);
      
      if (result.success) {
        setIsVerified(result.isVerified);
        
        if (result.isVerified) {
          showNotification(
            "Email verificata con successo! Ora puoi effettuare il login.",
            true,
            () => {
              navigation.navigate("Login");
            }
          );
        } else if (showLoadingState) {
          showNotification("Email non ancora verificata. Controlla la tua casella di posta.", false);
        }
      } else {
        showNotification(result.message || "Errore durante il controllo della verifica", false);
      }
    } catch (error) {
      showNotification("Errore di connessione durante il controllo", false);
    } finally {
      if (showLoadingState) setIsChecking(false);
    }
  };

  // Funzione per inviare nuovamente l'email di verifica
  const resendVerificationEmail = async () => {
    setIsLoading(true);
    
    try {
      const result = await authService.sendVerificationEmail(email, "REGISTRATION");
      
      if (result.success) {
        showNotification("Email di verifica inviata nuovamente. Controlla la tua casella di posta.", true);
      } else {
        showNotification(result.message || "Errore durante l'invio dell'email", false);
      }
    } catch (error) {
      showNotification("Errore di connessione durante l'invio", false);
    } finally {
      setIsLoading(false);
    }
  };

  // Controllo automatico dello stato ogni 10 secondi
  useEffect(() => {
    checkVerificationStatus(false); // Controllo iniziale senza loading
    
    const interval = setInterval(() => {
      if (!isVerified) {
        checkVerificationStatus(false); // Controllo silenzioso
      }
    }, 10000); // Controlla ogni 10 secondi
    
    return () => clearInterval(interval);
  }, [email, isVerified]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.iconContainer}>
        <FontAwesome name="envelope-o" size={80} color="#4285F4" />
      </View>
      
      <Text style={styles.title}>Verifica la tua email</Text>
      
      <Text style={styles.subtitle}>
        Ciao {username}! Abbiamo inviato un'email di verifica a:
      </Text>
      
      <Text style={styles.email}>{email}</Text>
      
      <Text style={styles.description}>
        Clicca sul link nell'email per verificare il tuo account. 
        Una volta verificato, potrai effettuare il login.
      </Text>
      
      {isVerified && (
        <View style={styles.successContainer}>
          <FontAwesome name="check-circle" size={24} color="#4CAF50" />
          <Text style={styles.successText}>Email verificata!</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.checkButton, { width: width * 0.9 }]}
          onPress={() => checkVerificationStatus(true)}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.checkButtonText}>Controlla verifica</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.resendButton, { width: width * 0.9 }]}
          onPress={resendVerificationEmail}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <Text style={styles.resendButtonText}>Invia nuovamente email</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.backButtonText}>Torna al login</Text>
        </TouchableOpacity>
      </View>
      
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "System",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "System",
    lineHeight: 22,
  },
  email: {
    fontSize: 18,
    color: "#4285F4",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "System",
  },
  description: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
    fontFamily: "System",
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  successText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "500",
    fontFamily: "System",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  checkButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#4285F4",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  checkButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "500",
    fontFamily: "System",
  },
  resendButton: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#4285F4",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  resendButtonText: {
    color: "#4285F4",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "System",
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: "#888888",
    fontSize: 15,
    fontWeight: "400",
    fontFamily: "System",
  },
});

export default EmailVerificationScreen;
