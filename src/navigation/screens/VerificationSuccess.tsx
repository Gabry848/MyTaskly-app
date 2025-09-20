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
} from "react-native";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../types";
import * as authService from "../../services/authService";
import { NotificationSnackbar } from "../../../components/NotificationSnackbar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../constants/authConstants";

const { width } = Dimensions.get("window");

interface RouteParams {
  email: string;
  username: string;
  password: string;
}

const VerificationSuccessScreen = () => {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
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
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequenza di animazioni di entrata
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [confettiAnim, fadeAnim, scaleAnim, slideAnim]);

  useEffect(() => {
    if (isLoggingIn) {
      // Animazione di rotazione per l'icona di loading
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    }
  }, [isLoggingIn, rotateAnim]);

  const handleAutoLogin = async () => {
    setIsLoggingIn(true);

    try {
      const result = await authService.login(username, password);

      if (result.success) {
        // Reset del comando suggerito per il nuovo utente
        await AsyncStorage.setItem(STORAGE_KEYS.SUGGESTED_COMMAND_SHOWN, 'false');
        setNotification({
          isVisible: true,
          message:
            "Login automatico effettuato con successo! Benvenuto in MyTaskly!",
          isSuccess: true,
        });
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "HomeTabs" }],
          });
        }, 1000);
      } else {
        setNotification({
          isVisible: true,
          message:
            "Errore durante il login automatico. Verrai reindirizzato al login.",
          isSuccess: false,
          onFinish: () => {
            setNotification((prev) => ({ ...prev, isVisible: false }));
            navigation.navigate("Login");
          },
        });
      }
    } catch {
      setNotification({
        isVisible: true,
        message: "Errore di connessione. Verrai reindirizzato al login.",
        isSuccess: false,
        onFinish: () => {
          setNotification((prev) => ({ ...prev, isVisible: false }));
          navigation.navigate("Login");
        },
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const renderSuccessIcon = () => (
    <Animated.View
      style={[
        styles.successIconContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <MaterialIcons name="check-circle" size={80} color="#000000" />

      {/* Effetto confetti/stelle */}
      <Animated.View
        style={[
          styles.confettiContainer,
          {
            opacity: confettiAnim,
          },
        ]}
      >
        <FontAwesome
          name="star"
          size={20}
          color="#333333"
          style={[styles.star, styles.star1]}
        />
        <FontAwesome
          name="star"
          size={16}
          color="#666666"
          style={[styles.star, styles.star2]}
        />
        <FontAwesome
          name="star"
          size={18}
          color="#999999"
          style={[styles.star, styles.star3]}
        />
        <FontAwesome
          name="star"
          size={14}
          color="#333333"
          style={[styles.star, styles.star4]}
        />
        <FontAwesome
          name="star"
          size={22}
          color="#666666"
          style={[styles.star, styles.star5]}
        />
        <FontAwesome
          name="star"
          size={16}
          color="#999999"
          style={[styles.star, styles.star6]}
        />
      </Animated.View>
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
        {renderSuccessIcon()}

        <Text style={styles.title}>Congratulazioni!</Text>

        <Text style={styles.subtitle}>
          Benvenuto in <Text style={styles.brandText}>MyTaskly</Text>
        </Text>

        <Text style={styles.description}>
          La tua email <Text style={styles.emailText}>{email}</Text> è stata
          verificata con successo! Ora puoi iniziare a organizzare le tue
          attività e aumentare la tua produttività.
        </Text>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <MaterialIcons name="task-alt" size={24} color="#000000" />
            <Text style={styles.featureText}>Gestisci le tue attività</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="schedule" size={24} color="#000000" />
            <Text style={styles.featureText}>Organizza il tuo tempo</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="trending-up" size={24} color="#000000" />
            <Text style={styles.featureText}>Aumenta la produttività</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, { width: width * 0.9 }]}
          onPress={handleAutoLogin}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <View style={styles.loadingContainer}>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              >
                <MaterialIcons name="autorenew" size={20} color="#ffffff" />
              </Animated.View>
              <Text style={styles.continueButtonText}>Accesso in corso...</Text>
            </View>
          ) : (
            <>
              <MaterialIcons
                name="home"
                size={20}
                color="#ffffff"
                style={styles.buttonIcon}
              />
              <Text style={styles.continueButtonText}>
                Inizia ad usare MyTaskly
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualLoginButton}
          onPress={() => navigation.navigate("Login")}
          disabled={isLoggingIn}
        >
          <Text style={styles.manualLoginText}>
            Preferisci fare login manualmente?
          </Text>
        </TouchableOpacity>
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
  successIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
    position: "relative",
  },
  confettiContainer: {
    position: "absolute",
    width: 200,
    height: 200,
    top: -30,
    left: -30,
  },
  star: {
    position: "absolute",
  },
  star1: {
    top: 20,
    left: 40,
  },
  star2: {
    top: 60,
    right: 30,
  },
  star3: {
    bottom: 80,
    left: 20,
  },
  star4: {
    bottom: 40,
    right: 50,
  },
  star5: {
    top: 30,
    right: 60,
  },
  star6: {
    bottom: 70,
    left: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "System",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "System",
  },
  brandText: {
    color: "#000000",
    fontWeight: "700",
  },
  description: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
    fontFamily: "System",
  },
  emailText: {
    color: "#000000",
    fontWeight: "600",
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
    fontFamily: "System",
  },
  continueButton: {
    backgroundColor: "#000000",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  continueButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "System",
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  manualLoginButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  manualLoginText: {
    color: "#666666",
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "System",
    textDecorationLine: "underline",
  },
});

export default VerificationSuccessScreen;
