import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Image,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../types";
import * as authService from "../../services/authService";
import { NotificationSnackbar } from "../../../components/NotificationSnackbar";
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get("window");

const RegisterScreen = () => {
  const { t } = useTranslation();
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [notification, setNotification] = React.useState<{
    isVisible: boolean;
    message: string;
    isSuccess: boolean;
    onFinish?: () => void;
    key: number;
  } | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Funzione per validare l'input e verificare se contiene caratteri speciali
  const containsSpecialChars = (text) => {
    const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    return specialCharsRegex.test(text);
  };

  // Funzione per gestire il cambio di username con validazione
  const handleUsernameChange = (text) => {
    const trimmedText = text.trim();
    if (containsSpecialChars(trimmedText)) {
      setNotification({
        isVisible: true,
        message: t('errors.validation'),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => {
          setNotification(null);
        },
      });
      return;
    }
    setUsername(trimmedText);
  };

  // Validation for email is not needed as emails naturally contain special characters

  async function handleRegister() {
    // Verifica se i campi contengono caratteri speciali prima di inviare la richiesta
    if (containsSpecialChars(username)) {
      setNotification({
        isVisible: true,
        message: t('errors.validation'),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => {
          setNotification(null);
        },
      });
      return;
    }

    if (password !== confirmPassword) {
      setNotification({
        isVisible: true,
        message: t('auth.register.errors.passwordMismatch'),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => setNotification(null),
      });
      return;
    }

    // Verifica la disponibilità di username ed email prima di procedere
    const availabilityResult = await authService.checkAvailability(username, email);

    if (!availabilityResult.success) {
      setNotification({
        isVisible: true,
        message: availabilityResult.message || t('auth.register.errors.availabilityCheck'),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => setNotification(null),
      });
      return;
    }

    if (!availabilityResult.nameAvailable) {
      setNotification({
        isVisible: true,
        message: t('auth.register.errors.usernameTaken'),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => setNotification(null),
      });
      return;
    }

    if (!availabilityResult.emailAvailable) {
      setNotification({
        isVisible: true,
        message: t('auth.register.errors.emailTaken'),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => setNotification(null),
      });
      return;
    }

    const result = await authService.register(username, email, password);
    if (result.success) {
      setNotification({
        isVisible: true,
        message: result.message || t('auth.register.success'),
        isSuccess: true,
        key: Date.now(),
      });
      navigation.navigate("EmailVerification", {
        email: email,
        username: username,
        password: password
      });
    } else {
      setNotification({
        isVisible: true,
        message: result.message || t('auth.register.errors.generic'),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => setNotification(null),
      });
    }
  }  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.avatar}>
        <Image
          source={require("../../../assets/circle-user.png")}
          style={styles.avatarImage}
        />
      </View><View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="user" size={20} color="#666666" style={styles.icon} />
        <TextInput
          placeholder={t('auth.register.username')}
          placeholderTextColor="#999999"
          style={[styles.input, { width: width * 0.75 }]}
          value={username}
          onChangeText={handleUsernameChange}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome
          name="envelope"
          size={20}
          color="#666666"
          style={styles.icon}
        />
        <TextInput
          placeholder={t('auth.register.email')}
          placeholderTextColor="#999999"
          style={[styles.input, { width: width * 0.75 }]}
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => setEmail(text.trim().toLowerCase())}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="lock" size={20} color="#666666" style={styles.icon} />
        <TextInput
          placeholder={t('auth.register.password')}
          placeholderTextColor="#999999"
          style={[styles.input, { width: width * 0.75 }]}
          secureTextEntry
          value={password}
          onChangeText={(text) => setPassword(text.trim())}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="lock" size={20} color="#666666" style={styles.icon} />
        <TextInput
          placeholder={t('auth.register.confirmPassword')}
          placeholderTextColor="#999999"
          style={[styles.input, { width: width * 0.75 }]}
          secureTextEntry
          value={confirmPassword}
          onChangeText={(text) => setConfirmPassword(text.trim())}
        />
      </View>
      <TouchableOpacity
        style={[styles.registerButton, { width: width * 0.9 }]}
        onPress={handleRegister}
      >
        <Text style={styles.registerText}>{t('auth.register.next')}</Text>
      </TouchableOpacity>
      <Text style={styles.loginText}>{t('auth.register.alreadyHaveAccount')}</Text>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.loginButtonText}>{t('auth.register.loginButton')}</Text>
      </TouchableOpacity>
      {notification && (
        <NotificationSnackbar
          key={notification.key}
          isVisible={notification.isVisible}
          message={notification.message}
          isSuccess={notification.isSuccess}
          onFinish={notification.onFinish}
        />
      )}
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
    backgroundColor: "#f8f9fa",    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,    shadowRadius: 8,
    elevation: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
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
  registerButton: {
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
  registerText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "500",
    fontFamily: "System",
  },
  loginText: {
    color: "#666666",
    fontSize: 16,
    marginBottom: 12,
    fontFamily: "System",
    fontWeight: "400",
  },
  loginButton: {
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
  loginButtonText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "System",
  },
});

export default RegisterScreen;
