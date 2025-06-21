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
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as authService from "../../services/authService";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types";
import eventEmitter from "../../utils/eventEmitter";

import { NotificationSnackbar } from "../../../components/NotificationSnackbar";

const { width } = Dimensions.get("window");

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false); // Stato per mostrare/nascondere password
  const [loginSuccess, setLoginSuccess] = React.useState(false); // Stato per tenere traccia del login riuscito
  const [notification, setNotification] = React.useState({
    isVisible: false,
    message: "",
    isSuccess: true,
    onFinish: () => {},
  });  // Effetto per navigare alla Home dopo un login riuscito
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
  const containsSpecialChars = (text) => {
    const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    return specialCharsRegex.test(text);
  };

  // Funzione per gestire il cambio di username con validazione
  const handleUsernameChange = (text) => {
    if (containsSpecialChars(text)) {
      setNotification({
        isVisible: true,
        message: "Lo username non può contenere caratteri speciali",
        isSuccess: false,
        onFinish: () => {
          setNotification((prev) => ({
            ...prev,
            isVisible: false,
            onFinish: () => {},
          }));
        },
      });
      return;
    }
    setUsername(text);
  };

  // Funzione per gestire il cambio di password con validazione
  const handlePasswordChange = (text) => {
    setPassword(text);
  };

  // login function use authServicec to login
  async function handleLogin() {
    try {
      // Verifica se i campi contengono caratteri speciali prima di inviare la richiesta
      if (containsSpecialChars(username)) {
        setNotification({
          isVisible: true,
          message: "Lo username non può contenere caratteri speciali",
          isSuccess: false,
          onFinish: () => {
            setNotification((prev) => ({
              ...prev,
              isVisible: false,
              onFinish: () => {},
            }));
          },
        });
        return;
      }      const login_data = await authService.login(username, password);

      if (login_data.success) {
        setLoginSuccess(true); // Imposta il login come riuscito
        eventEmitter.emit("loginSuccess"); // Emetti evento per aggiornare lo stato di autenticazione
        setNotification({
          isVisible: true,
          message: "Login effettuato con successo",
          isSuccess: true,
          onFinish: () => {
            console.log("Login effettuato con successo");
            setNotification((prev) => ({
              ...prev,
              isVisible: false,
              onFinish: () => {},
            }));
          },
        });
      } else {
        setNotification({
          isVisible: true,
          message: "Username o password errati",
          isSuccess: false,
          onFinish: () => {
            console.log("Login fallito");
            setNotification((prev) => ({
              ...prev,
              isVisible: false,
              onFinish: () => {},
            }));
          },
        });
      }
    } catch (error) {
      console.error("Errore durante il login:", error);
      let errorMessage = "Errore durante il login. Riprova più tardi.";
      if (
        error instanceof Error &&
        (error as any).response &&
        (error as any).response.status === 401
      ) {
        errorMessage = "Credenziali non valide. Riprova.";
      }
      setNotification({
        isVisible: true,
        message: errorMessage,
        isSuccess: false,
        onFinish: () => {
          setNotification((prev) => ({
            ...prev,
            isVisible: false,
            onFinish: () => {},
          }));
        },
      });
    }
  }

  // Funzione per invertire lo stato di visibilità della password
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.avatar}>
        <Image
          source={require("../../../assets/circle-user.png")}
          style={styles.avatarImage}
        />
      </View>      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="user" size={20} color="#666666" style={styles.icon} />
        <TextInput
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="Username"
          placeholderTextColor="#999999"
          style={[styles.input, { width: width * 0.75 }]}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="lock" size={20} color="#666666" style={styles.icon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#999999"
          style={[styles.input, { width: width * 0.65 }]}
          secureTextEntry={!showPassword}
          value={password}
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
        isVisible={notification.isVisible}
        message={notification.message}        isSuccess={notification.isSuccess}
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
    width: "100%",
  },  avatar: {
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
});

export default LoginScreen;
