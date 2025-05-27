import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
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
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Image
          source={require("../../../assets/circle-user.png")}
          style={styles.avatarImage}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="user" size={20} color="white" style={styles.icon} />
        <TextInput
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="Username"
          placeholderTextColor="white"
          style={[styles.input, { width: width * 0.75 }]}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="lock" size={20} color="white" style={styles.icon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor="white"
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
            color="white"
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
        message={notification.message}
        isSuccess={notification.isSuccess}
        onFinish={notification.onFinish}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E88E5",
    width: "100%",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#64B5F6",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    padding: 5,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "white",
    height: 50,
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    backgroundColor: "#FF8A80",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
  },
  loginText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  optionText: {
    color: "white",
    fontSize: 14,
  },
  signUpText: {
    color: "white",
    fontSize: 14,
    marginBottom: 5,
  },
  signUpButton: {
    borderWidth: 1,
    borderColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  signUpButtonText: {
    color: "white",
    fontSize: 14,
  },
});

export default LoginScreen;
