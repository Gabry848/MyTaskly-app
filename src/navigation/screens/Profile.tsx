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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as authService from "../../services/authService";
import { NotificationSnackbar } from "../../../components/NotificationSnackbar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../constants/authConstants";
import eventEmitter from "../../utils/eventEmitter";
import { getValidToken } from "../../services/authService";
import axios from "../../services/axiosInstance";

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
    created_at: "",
  });
  const [infoLoading, setInfoLoading] = useState(true);
  const [logoutTrigger, setLogoutTrigger] = useState(false); // Stato per triggerare l'effetto di logout
  const fadeAnim = useState(new Animated.Value(0))[0];
  const skeletonAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const fetchInitialData = async () => {
      // Prima carica i dati base da AsyncStorage per mostrare subito qualcosa
      const username = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
      setUserData(prev => ({
        ...prev,
        username: username || "Username",
      }));

      // Avvia l'animazione di fade-in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Avvia l'animazione skeleton
      Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(skeletonAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    const fetchUserInfo = async () => {
      try {
        setInfoLoading(true);
        const token = await getValidToken();
        if (token) {
          const response = await axios.get('/auth/current_user_info', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          const userInfo = response.data;
          setUserData(prev => ({
            ...prev,
            username: userInfo.username || prev.username,
            email: userInfo.email || "email@example.com",
            created_at: userInfo.created_at || "",
            joinDate: userInfo.created_at 
              ? new Date(userInfo.created_at).toLocaleDateString('it-IT')
              : "01/01/2023",
          }));
        } else {
          // Fallback to AsyncStorage if no token
          const email = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);
          const joinDate = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TIME);
          setUserData(prev => ({
            ...prev,
            email: email || "email@example.com",
            created_at: "",
            joinDate: joinDate
              ? new Date(parseInt(joinDate)).toLocaleDateString()
              : "01/01/2023",
          }));
        }
      } catch (error) {
        console.error("Errore nel recupero dei dati utente", error);
        // Fallback in case of error
        const email = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);
        setUserData(prev => ({
          ...prev,
          email: email || "email@example.com",
          created_at: "",
          joinDate: "01/01/2023",
        }));
      } finally {
        setInfoLoading(false);
      }
    };

    fetchInitialData();
    fetchUserInfo();
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
              <Text style={styles.userSubtitle}>Utente Mytaskly</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Informazioni Account</Text>
              
              {infoLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View style={[styles.skeletonItem, { opacity: skeletonAnim }]}>
                    <View style={styles.skeletonIconContainer}>
                      <Animated.View style={[styles.skeletonIcon, { opacity: skeletonAnim }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Animated.View style={[styles.skeletonLabel, { opacity: skeletonAnim }]} />
                      <Animated.View style={[styles.skeletonText, { opacity: skeletonAnim }]} />
                    </View>
                  </Animated.View>
                  
                  <Animated.View style={[styles.skeletonItem, styles.skeletonItemLast, { opacity: skeletonAnim }]}>
                    <View style={styles.skeletonIconContainer}>
                      <Animated.View style={[styles.skeletonIcon, { opacity: skeletonAnim }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Animated.View style={[styles.skeletonLabel, { opacity: skeletonAnim }]} />
                      <Animated.View style={[styles.skeletonText, { opacity: skeletonAnim }]} />
                    </View>
                  </Animated.View>
                </View>
              ) : (
                <>
                  <View style={styles.infoItem}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="mail" size={22} color="#000000" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoText}>{userData.email}</Text>
                    </View>
                  </View>

                  <View style={[styles.infoItem, styles.infoItemLast]}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="calendar" size={22} color="#000000" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoLabel}>Membro dal</Text>
                      <Text style={styles.infoText}>{userData.joinDate}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#ffffff"
                    style={styles.buttonIcon}
                  />
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>
                    Le mie Attività
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color="#ffffff" 
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.settingsButton]}
                onPress={() => {
                  navigation.navigate("Settings")
                }}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name="settings"
                    size={20}
                    color="#000000"
                    style={styles.buttonIcon}
                  />
                  <Text style={[styles.buttonText, styles.settingsButtonText]}>
                    Impostazioni
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color="#666666" 
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.bugReportButton]}
                onPress={() => {
                  navigation.navigate("BugReport")
                }}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name="bug-outline"
                    size={20}
                    color="#FF9500"
                    style={styles.buttonIcon}
                  />
                  <Text style={[styles.buttonText, styles.bugReportButtonText]}>
                    Segnala Bug
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color="#666666" 
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name="log-out"
                    size={20}
                    color="#FF3B30"
                    style={styles.buttonIcon}
                  />
                  <Text style={[styles.buttonText, styles.logoutText]}>
                    Esci dall'account
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color="#FF3B30" 
                  style={styles.chevronIcon}
                />
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
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    alignItems: "center",
    width: "100%",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ffffff",
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#000000",
  },
  avatarImage: {
    width: "85%",
    height: "85%",
    borderRadius: 50,
  },
  username: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: "System",
    letterSpacing: -0.8,
    textAlign: "center",
    marginBottom: 8,
  },
  userSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#666666",
    fontFamily: "System",
    textAlign: "center",
  },
  infoSection: {
    width: width * 0.9,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: "System",
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoItemLast: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoText: {
    color: "#1a1a1a",
    fontSize: 16,
    flex: 1,
    fontFamily: "System",
    fontWeight: "500",
    lineHeight: 24,
  },
  infoLabel: {
    color: "#666666",
    fontSize: 14,
    fontFamily: "System",
    fontWeight: "400",
    marginBottom: 4,
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
    paddingVertical: 18,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#000000",
  },
  settingsButton: {
    backgroundColor: "#ffffff",
  },
  bugReportButton: {
    backgroundColor: "#ffffff",
  },
  logoutButton: {
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#ffe5e5",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  buttonIcon: {
    marginRight: 16,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "System",
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  primaryButtonText: {
    color: "#ffffff",
  },
  settingsButtonText: {
    color: "#1a1a1a",
  },
  bugReportButtonText: {
    color: "#1a1a1a",
  },
  logoutText: {
    color: "#FF3B30",
  },
  chevronIcon: {
    opacity: 0.6,
  },
  loadingContainer: {
    paddingVertical: 0,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  skeletonItemLast: {
    borderBottomWidth: 0,
  },
  skeletonIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  skeletonIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e0e0e0',
  },
  skeletonLabel: {
    height: 14,
    width: 60,
    borderRadius: 7,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  skeletonText: {
    height: 16,
    width: '70%',
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
    fontFamily: 'System',
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: "transparent",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginTop: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    fontFamily: "System",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666666",
    fontFamily: "System",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;
