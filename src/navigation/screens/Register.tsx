import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../types";
import * as authService from "../../services/authService";
import { NotificationSnackbar } from "../../../components/NotificationSnackbar";

const { width } = Dimensions.get("window");

const RegisterScreen = () => {
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
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
          }));
        },
      });
      return;
    }
    setUsername(text);
  };

  // Validation for email is not needed as emails naturally contain special characters

  async function handleRegister() {
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
          }));
        },
      });
      return;
    }

    if (password !== confirmPassword) {
      setNotification({
        isVisible: true,
        message: "Passwords do not match",
        isSuccess: false,
        onFinish: () => setNotification((prev) => ({ ...prev, isVisible: false })),
      });
      return;
    }
    
    const result = await authService.register(username, email, password);
    if (result.success) {
      setNotification({
        isVisible: true,
        message: "Registrazione effettuata con successo",
        isSuccess: true,
        onFinish: () => {
          setNotification((prev) => ({ ...prev, isVisible: false }));
          navigation.navigate("Login");
        },
      });
    } else {
      setNotification({
        isVisible: true,
        message: result.message || "Errore durante la registrazione",
        isSuccess: false,
        onFinish: () => setNotification((prev) => ({ ...prev, isVisible: false })),
      });
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar} />
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="user" size={20} color="white" style={styles.icon} />
        <TextInput
          placeholder="Username"
          placeholderTextColor="white"
          style={[styles.input, { width: width * 0.75 }]}
          value={username}
          onChangeText={handleUsernameChange}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome
          name="envelope"
          size={20}
          color="white"
          style={styles.icon}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor="white"
          style={[styles.input, { width: width * 0.75 }]}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="lock" size={20} color="white" style={styles.icon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor="white"
          style={[styles.input, { width: width * 0.75 }]}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="lock" size={20} color="white" style={styles.icon} />
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="white"
          style={[styles.input, { width: width * 0.75 }]}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>
      <TouchableOpacity
        style={[styles.registerButton, { width: width * 0.9 }]}
        onPress={handleRegister}
      >
        <Text style={styles.registerText}>Register Now</Text>
      </TouchableOpacity>
      <Text style={styles.loginText}>Already have an account?</Text>
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.loginButtonText}>Login</Text>
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
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#64B5F6",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "white",
    height: 50,
  },
  registerButton: {
    backgroundColor: "#FF8A80",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
  },
  registerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginText: {
    color: "white",
    fontSize: 14,
    marginBottom: 5,
  },
  loginButton: {
    borderWidth: 1,
    borderColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "white",
    fontSize: 14,
  },
});

export default RegisterScreen;
