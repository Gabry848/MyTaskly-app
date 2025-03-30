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
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as authService from "../../services/authService";
import { NotificationSnackbar } from "../../../components/NotificationSnackbar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../constants/authConstants";
import { LinearGradient } from "expo-linear-gradient";

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
          joinDate: joinDate ? new Date(parseInt(joinDate)).toLocaleDateString() : "01/01/2023",
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
          navigation.navigate("Login");
        },
      });
    } catch (error) {
      setNotification({
        isVisible: true,
        message: "Errore durante il logout",
        isSuccess: false,
        onFinish: () => setNotification((prev) => ({ ...prev, isVisible: false })),
      });
    }
  };

  const handleEditProfile = () => {
    // Implementazione per modifica profilo
    setNotification({
      isVisible: true,
      message: "Funzionalità in sviluppo",
      isSuccess: true,
      onFinish: () => setNotification((prev) => ({ ...prev, isVisible: false })),
    });
  };

  return (
    <>
      <LinearGradient
        colors={['#1A73E8', '#0D47A1']}
        style={[styles.gradientBackground, { paddingTop: StatusBar.currentHeight }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
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
                  <FontAwesome name="envelope" size={20} color="#1A73E8" />
                </View>
                <Text style={styles.infoText}>{userData.email}</Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.iconContainer}>
                  <FontAwesome name="calendar" size={20} color="#1A73E8" />
                </View>
                <Text style={styles.infoText}>Iscritto dal: {userData.joinDate}</Text>
              </View>
            </View>

            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEditProfile}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF9A8B', '#FF6B95']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <FontAwesome name="edit" size={18} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Modifica Profilo</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4DB6AC', '#009688']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <FontAwesome name="tasks" size={18} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Le mie Attività</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  // Implementazione impostazioni
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#7986CB', '#3F51B5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <FontAwesome name="cog" size={18} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Impostazioni</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF5252', '#D32F2F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <FontAwesome name="sign-out" size={18} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Logout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>

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
  gradientBackground: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    width: "100%",
    paddingVertical: 30,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 30,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "white",
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 65,
  },
  username: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  infoSection: {
    width: width * 0.9,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoText: {
    color: "#333",
    fontSize: 16,
    flex: 1,
  },
  actionSection: {
    width: "100%",
    alignItems: "center",
  },
  actionButton: {
    width: width * 0.9,
    height: 55,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
    height: '100%',
    paddingHorizontal: 15,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
