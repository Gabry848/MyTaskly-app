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
  Animated,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../types";
import * as authService from "../../services/authService";
import { NotificationSnackbar } from "../../components/UI/NotificationSnackbar";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

const Blob = ({
  size,
  opacity,
  delay = 0,
  top,
  left,
  right,
  bottom,
}: {
  size: number;
  opacity: number;
  delay?: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}) => {
  const anim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1.1, duration: 4000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 4000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#000000",
        opacity,
        top,
        left,
        right,
        bottom,
        transform: [{ scale: anim }],
      }}
    />
  );
};

const RegisterScreen = () => {
  const { t } = useTranslation();
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [notification, setNotification] = React.useState<{
    isVisible: boolean;
    message: string;
    isSuccess: boolean;
    onFinish?: () => void;
    key: number;
  } | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const containsSpecialChars = (text: string) => {
    const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    return specialCharsRegex.test(text);
  };

  const handleUsernameChange = (text: string) => {
    const trimmedText = text.trim();
    if (containsSpecialChars(trimmedText)) {
      setNotification({
        isVisible: true,
        message: t("errors.validation"),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => setNotification(null),
      });
      return;
    }
    setUsername(trimmedText);
  };

  async function handleRegister() {
    if (containsSpecialChars(username)) {
      setNotification({
        isVisible: true,
        message: t("errors.validation"),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => setNotification(null),
      });
      return;
    }

    if (password !== confirmPassword) {
      setNotification({
        isVisible: true,
        message: t("auth.register.errors.passwordMismatch"),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => setNotification(null),
      });
      return;
    }

    const availabilityResult = await authService.checkAvailability(username, email);

    if (!availabilityResult.success) {
      setNotification({
        isVisible: true,
        message: availabilityResult.message || t("auth.register.errors.availabilityCheck"),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => setNotification(null),
      });
      return;
    }

    if (!availabilityResult.nameAvailable) {
      setNotification({
        isVisible: true,
        message: t("auth.register.errors.usernameTaken"),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => setNotification(null),
      });
      return;
    }

    if (!availabilityResult.emailAvailable) {
      setNotification({
        isVisible: true,
        message: t("auth.register.errors.emailTaken"),
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
        message: result.message || t("auth.register.success"),
        isSuccess: true,
        key: Date.now(),
      });
      navigation.navigate("EmailVerification", { email, username, password });
    } else {
      setNotification({
        isVisible: true,
        message: result.message || t("auth.register.errors.generic"),
        isSuccess: false,
        key: Date.now(),
        onFinish: () => setNotification(null),
      });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Blob di sfondo */}
      <Blob size={340} opacity={0.13} delay={0}    top={-120} left={-130} />
      <Blob size={260} opacity={0.10} delay={1000} top={-60}  right={-100} />
      <Blob size={220} opacity={0.12} delay={500}  bottom={60} left={-90} />
      <Blob size={300} opacity={0.09} delay={1500} bottom={-80} right={-110} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Image
          source={require("../../../assets/icons/adaptive-icon.png")}
          style={styles.logo}
        />

        {/* Username */}
        <View style={styles.inputRow}>
          <FontAwesome name="user" size={17} color="#999" style={styles.icon} />
          <TextInput
            placeholder={t("auth.register.username")}
            placeholderTextColor="#BBBBBB"
            style={styles.input}
            value={username}
            onChangeText={handleUsernameChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Email */}
        <View style={styles.inputRow}>
          <FontAwesome name="envelope" size={15} color="#999" style={styles.icon} />
          <TextInput
            placeholder={t("auth.register.email")}
            placeholderTextColor="#BBBBBB"
            style={styles.input}
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => setEmail(text.trim().toLowerCase())}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password */}
        <View style={styles.inputRow}>
          <FontAwesome name="lock" size={17} color="#999" style={styles.icon} />
          <TextInput
            placeholder={t("auth.register.password")}
            placeholderTextColor="#BBBBBB"
            style={styles.input}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => setPassword(text.trim())}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <FontAwesome name={showPassword ? "eye" : "eye-slash"} size={17} color="#BBBBBB" />
          </TouchableOpacity>
        </View>

        {/* Confirm password */}
        <View style={styles.inputRow}>
          <FontAwesome name="lock" size={17} color="#999" style={styles.icon} />
          <TextInput
            placeholder={t("auth.register.confirmPassword")}
            placeholderTextColor="#BBBBBB"
            style={styles.input}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(text) => setConfirmPassword(text.trim())}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
            <FontAwesome name={showConfirmPassword ? "eye" : "eye-slash"} size={17} color="#BBBBBB" />
          </TouchableOpacity>
        </View>

        {/* Register button */}
        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} activeOpacity={0.85}>
          <Text style={styles.registerBtnText}>{t("auth.register.next")}</Text>
        </TouchableOpacity>

        {/* Login link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginLabel}>{t("auth.register.alreadyHaveAccount")} </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")} activeOpacity={0.7}>
            <Text style={styles.loginLink}>{t("auth.register.loginButton")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.07,
    paddingVertical: 48,
  },

  // Logo
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    resizeMode: "contain",
    marginBottom: 48,
  },

  // Inputs
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
    marginBottom: 24,
    paddingBottom: 10,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111111",
    fontFamily: "System",
    height: 36,
  },
  eyeBtn: {
    padding: 4,
  },

  // Register button
  registerBtn: {
    width: "100%",
    backgroundColor: "#000000",
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 28,
  },
  registerBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
    fontFamily: "System",
  },

  // Login link
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginLabel: {
    color: "#AAAAAA",
    fontSize: 14,
    fontFamily: "System",
  },
  loginLink: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "System",
  },
});

export default RegisterScreen;
