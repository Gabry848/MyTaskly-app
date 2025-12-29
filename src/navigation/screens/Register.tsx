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
import { NotificationSnackbar } from "../../components/UI/NotificationSnackbar";
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
      <View style={styles.logoContainer}>
        <Image
          source={require("../../../assets/icons/adaptive-icon.png")}
          style={styles.logoImage}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
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
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  logoImage: {
    width: 140,
    height: 140,
    resizeMode: "contain",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#E8EBED",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 0.5,
  },
  icon: {
    marginRight: 14,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: "#000000",
    height: 56,
    fontSize: 16,
    fontFamily: "System",
    fontWeight: "500",
  },
  registerButton: {
    backgroundColor: "#000000",
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  registerText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "System",
    letterSpacing: 0.3,
  },
  loginText: {
    color: "#666666",
    fontSize: 15,
    marginBottom: 14,
    fontFamily: "System",
    fontWeight: "500",
  },
  loginButton: {
    borderWidth: 1.5,
    borderColor: "#E8EBED",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1.5,
  },
  loginButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "System",
    letterSpacing: 0.2,
  },
});

export default RegisterScreen;
