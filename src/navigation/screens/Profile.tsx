import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  Animated,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as authService from "../../services/authService";
import { NotificationSnackbar } from "../../../components/NotificationSnackbar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../constants/authConstants";
import eventEmitter from "../../utils/eventEmitter";

const { width } = Dimensions.get("window");

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
};

const ProfileScreen = () => {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    joinDate: "",
  });
  const [logoutTrigger, setLogoutTrigger] = useState(false); // Stato per triggerare l'effetto di logout
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const username = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
        const email = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);
        const joinDate = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TIME);
        setUserData({
          username: username || "Username",
          email: email || "email@example.com",
          joinDate: joinDate
            ? new Date(parseInt(joinDate)).toLocaleDateString()
            : "01/01/2023",
        });

        // Avvia l'animazione di fade-in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error("Errore nel recupero dei dati utente", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (logoutTrigger) {
      const timer = setTimeout(() => {
        eventEmitter.emit("logoutSuccess");
        setLogoutTrigger(false); // Resetta il trigger
      }, 2000); // Ritardo di 2 secondi come nel login

      return () => clearTimeout(timer);
    }
  }, [logoutTrigger]);

  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    isSuccess: true,
    onFinish: () => {},
  });

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleLogout = async () => {
    try {
      await authService.logout();
      setNotification({
        isVisible: true,
        message: "Logout effettuato con successo",
        isSuccess: true,
        onFinish: () => {
          setNotification((prev) => ({ ...prev, isVisible: false }));
        },
      });
      setLogoutTrigger(true); // Attiva l'effetto per il logout ritardato
    } catch (error) {
      setNotification({
        isVisible: true,
        message: "Errore durante il logout",
        isSuccess: false,
        onFinish: () =>
          setNotification((prev) => ({ ...prev, isVisible: false })),
      });
    }
  };
  const handleEditProfile = () => {
    // Implementazione per modifica profilo
    setNotification({
      isVisible: true,
      message: "Funzionalità in sviluppo",
      isSuccess: true,
      onFinish: () =>
        setNotification((prev) => ({ ...prev, isVisible: false })),
    });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <>
      {" "}
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.headerSection}>
              <View style={styles.avatar}>
                <Image
                  source={require("../../../assets/circle-user.png")}
                  style={styles.avatarImage}
                />
              </View>
              <Text style={styles.username}>{userData.username}</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <View style={styles.iconContainer}>
                  <Ionicons name="mail-outline" size={20} color="#000000" />
                </View>
                <Text style={styles.infoText}>{userData.email}</Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#000000" />
                </View>
                <Text style={styles.infoText}>
                  Iscritto dal: {userData.joinDate}
                </Text>
              </View>
            </View>

            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEditProfile}
                activeOpacity={0.7}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color="#000000"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Modifica Profilo</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#000000"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Le mie Attività</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  // Implementazione impostazioni
                }}
                activeOpacity={0.7}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name="settings-outline"
                    size={18}
                    color="#000000"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Impostazioni</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color="#FF3B30"
                    style={styles.buttonIcon}
                  />
                  <Text style={[styles.buttonText, styles.logoutText]}>
                    Logout
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
      <NotificationSnackbar
        isVisible={notification.isVisible}
        message={notification.message}
        isSuccess={notification.isSuccess}
        onFinish={notification.onFinish}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  backButton: {
    padding: 8,
    marginRight: 15,
  },
  title: {
    fontSize: 30,
    fontWeight: "200",
    color: "#000000",
    fontFamily: "System",
    letterSpacing: -1.5,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    width: "100%",
    paddingVertical: 20,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ffffff",
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarImage: {
    width: "90%",
    height: "90%",
    borderRadius: 45,
  },
  username: {
    fontSize: 24,
    fontWeight: "300",
    color: "#000000",
    fontFamily: "System",
    letterSpacing: -0.5,
  },
  infoSection: {
    width: width * 0.9,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 15,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  infoText: {
    color: "#000000",
    fontSize: 16,
    flex: 1,
    fontFamily: "System",
    fontWeight: "400",
  },
  actionSection: {
    width: "100%",
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#222222",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutButton: {
    borderColor: "#FFE5E5",
    backgroundColor: "#000000",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "System",
    fontWeight: "400",
  },
  logoutText: {
    color: "#FF3B30",
  },
});

export default ProfileScreen;
