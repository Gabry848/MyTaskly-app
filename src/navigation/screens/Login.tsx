import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
  SafeAreaView,
  AppState,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as authService from "../../services/authService";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types";
import eventEmitter from "../../utils/eventEmitter";
import { signInWithGoogle } from "../../services/googleSignInService";

import { NotificationSnackbar } from "../../../components/NotificationSnackbar";

const { width } = Dimensions.get("window");

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loginSuccess, setLoginSuccess] = React.useState(false);
  const [failedAttempts, setFailedAttempts] = React.useState(0);
  const [isBlocked, setIsBlocked] = React.useState(false);
  const [showBlockMessage, setShowBlockMessage] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [notification, setNotification] = React.useState({
    isVisible: false,
    message: "",
    isSuccess: true,
    onFinish: () => {},
  });
  React.useEffect(() => {
    if (loginSuccess) {
      const timer = setTimeout(() => {
        navigation.navigate("HomeTabs");
        setLoginSuccess(false); // Reset dello stato
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [loginSuccess, navigation]);

  // Funzione per validare l'input e verificare se contiene caratteri speciali
  const containsSpecialChars = (text: string) => {
    const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    return specialCharsRegex.test(text);
  };

  // Funzione per gestire il cambio di username con validazione
  const handleUsernameChange = (text: string) => {
    if (containsSpecialChars(text)) {
      showNotification("Lo username non può contenere caratteri speciali", false);
      return;
    }
    setUsername(text);
  };

  // Funzione per gestire il cambio di password con validazione
  const handlePasswordChange = (text: string) => {
    setPassword(text);
  };

  // Funzione helper per mostrare notifiche
  const showNotification = React.useCallback((message: string, isSuccess: boolean) => {
    // Prima nascondi qualsiasi notifica esistente
    setNotification({ isVisible: false, message: "", isSuccess: true, onFinish: () => {} });
    
    // Poi mostra la nuova notifica con un piccolo ritardo per garantire il reset
    setTimeout(() => {
      setNotification({
        isVisible: true,
        message: message,
        isSuccess: isSuccess,
        onFinish: () => {
          setNotification({ isVisible: false, message: "", isSuccess: true, onFinish: () => {} });
        },
      });
    }, 100);
  }, []);

  // Handle Google Auth response
  // Rimuoviamo il vecchio useEffect per expo-auth-session

  // Google Sign-In function con il nostro servizio
  async function handleGoogleSignIn() {
    try {
      setIsGoogleLoading(true);
      
      const result = await signInWithGoogle();
      
      if (result.success) {
        setLoginSuccess(true);
        eventEmitter.emit("loginSuccess");
        showNotification("Login con Google effettuato con successo", true);
      } else {
        showNotification(
          result.message || "Errore durante il login con Google.",
          false
        );
      }
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      showNotification("Errore durante il login con Google. Riprova più tardi.", false);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  // login function use authServicec to login
  async function handleLogin() {
    try {
      // Verifica se i campi contengono caratteri speciali prima di inviare la richiesta
      if (containsSpecialChars(username)) {
        showNotification("Lo username non può contenere caratteri speciali", false);
        return;
      }
      
      const login_data = await authService.login(username, password);
      if (login_data.success) {
        setLoginSuccess(true); // Imposta il login come riuscito
        eventEmitter.emit("loginSuccess"); // Emetti evento per aggiornare lo stato di autenticazione
        showNotification("Login effettuato con successo", true);
      } else if (login_data.requiresEmailVerification) {
        // Email non verificata - naviga alla schermata di verifica
        showNotification(
          login_data.message || "Email non verificata. Verifica la tua email prima di effettuare il login.",
          false
        );
        
        // Naviga alla schermata di verifica email dopo un breve ritardo
        setTimeout(() => {
          navigation.navigate("EmailVerification", {
            email: login_data.email || "",
            username: login_data.username || username,
            password: password, // Aggiungi la password richiesta
          });
        }, 2000);
      } else {
        handleFailedLogin();
        showNotification(
          login_data.message || "Username o password errati.",
          false
        );
      }
    } catch (error) {
      let errorMessage = "Errore durante il login. Riprova più tardi.";
      if (
        error instanceof Error &&
        (error as any).response &&
        (error as any).response.status === 401
      ) {
        errorMessage = "Credenziali non valide.";
      }
      handleFailedLogin();
      showNotification(errorMessage, false);
    }
  }

  const handleFailedLogin = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    
    if (newAttempts >= 3) {
      setShowBlockMessage(true);
      
      setTimeout(() => {
        setIsBlocked(true);
        AppState.addEventListener('change', () => {});
      }, 5000);
    }
  };

  // Funzione per invertire lo stato di visibilità della password
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isBlocked) {
    return (
      <View style={styles.blockedContainer}>
        <Text style={styles.blockedText}>App bloccata per troppi tentativi di login.</Text>
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.avatar}>
        <Image
          source={require("../../../assets/circle-user.png")}
          style={styles.avatarImage}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome
          name="user"
          size={20}
          color="#666666"
          style={styles.icon}
        />
        <TextInput
          value={username || ""}
          onChangeText={handleUsernameChange}
          placeholder="Username"
          placeholderTextColor="#999999"
          style={[styles.input, { width: width * 0.75 }]}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome
          name="lock"
          size={20}
          color="#666666"
          style={styles.icon}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#999999"
          style={[styles.input, { width: width * 0.65 }]}
          secureTextEntry={!showPassword}
          value={password || ""}
          onChangeText={handlePasswordChange}
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.eyeIcon}
        >
          <FontAwesome
            name={showPassword ? "eye" : "eye-slash"}
            size={20}
            color="#666666"
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.loginButton, { width: width * 0.9 }]}
        onPress={() => {
          handleLogin();
        }}
      >
        <Text style={styles.loginText}>Login Now</Text>
      </TouchableOpacity>
      
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o</Text>
        <View style={styles.dividerLine} />
      </View>
      
      <TouchableOpacity
        style={[
          styles.googleButton, 
          { width: width * 0.9 },
          isGoogleLoading && styles.disabledButton
        ]}
        onPress={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        <View style={styles.googleIconContainer}>
          {isGoogleLoading ? (
            <Text style={styles.googleIconText}>...</Text>
          ) : (
            <Text style={styles.googleIconText}>G</Text>
          )}
        </View>
        <Text style={styles.googleButtonText}>
          {isGoogleLoading ? 'Accesso in corso...' : 'Continua con Google'}
        </Text>
      </TouchableOpacity>
      <View style={[styles.optionsContainer, { width: width * 0.9 }]}>
        <TouchableOpacity>
          <Text style={styles.optionText}>Remember me</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.optionText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.signUpText}>Not a member?</Text>
      <TouchableOpacity
        style={styles.signUpButton}
        onPress={() => {
          navigation.navigate("Register");
        }}
      >
        <Text style={styles.signUpButtonText}>Create account</Text>
      </TouchableOpacity>
      
      <NotificationSnackbar
        isVisible={showBlockMessage || notification.isVisible}
        message={showBlockMessage ? "Troppi tentativi falliti. L'app si bloccherà tra 5 secondi." : notification.message}
        isSuccess={showBlockMessage ? false : notification.isSuccess}
        onFinish={showBlockMessage ? () => {} : notification.onFinish}
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
    width: "100%",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f8f9fa",
    marginBottom: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    //tintColor: "#666666",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  icon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    color: "#000000",
    height: 54,
    fontSize: 16,
    fontFamily: "System",
    fontWeight: "400",
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: "#000000",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  loginText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "500",
    fontFamily: "System",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  optionText: {
    color: "#666666",
    fontSize: 15,
    fontFamily: "System",
    fontWeight: "400",
  },
  signUpText: {
    color: "#666666",
    fontSize: 16,
    marginBottom: 12,
    fontFamily: "System",
    fontWeight: "400",
  },
  signUpButton: {
    borderWidth: 1.5,
    borderColor: "#e1e5e9",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  signUpButtonText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "System",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    width: width * 0.85,
    maxWidth: 400,
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 15,
    fontFamily: "System",
  },
  modalMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 25,
    fontFamily: "System",
  },
  modalButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "System",
  },
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff0000',
  },
  blockedText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.9,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e1e5e9',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666666',
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '400',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  googleButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default LoginScreen;
