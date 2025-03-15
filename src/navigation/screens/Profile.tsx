import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as authService from "../../services/authService";
import { NotificationSnackbar } from "../../../components/NotificationSnackbar";

const { width } = Dimensions.get("window");

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
};

const ProfileScreen = () => {
  const [userData, setUserData] = useState({
    username: "Username",
    email: "email@example.com",
    joinDate: "01/01/2023",
  });
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    isSuccess: true,
    onFinish: () => {},
  });

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    // Qui puoi aggiungere una chiamata per ottenere i dati utente
    // fetchUserProfile();
  }, []);

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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
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
            <FontAwesome name="envelope" size={20} color="white" style={styles.infoIcon} />
            <Text style={styles.infoText}>{userData.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <FontAwesome name="calendar" size={20} color="white" style={styles.infoIcon} />
            <Text style={styles.infoText}>Iscritto dal: {userData.joinDate}</Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, { width: width * 0.9 }]}
            onPress={handleEditProfile}
          >
            <FontAwesome name="edit" size={18} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Modifica Profilo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { width: width * 0.9, backgroundColor: "#4DB6AC" }]}
            onPress={() => navigation.navigate("Home")}
          >
            <FontAwesome name="tasks" size={18} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Le mie Attività</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { width: width * 0.9, backgroundColor: "#7986CB" }]}
            onPress={() => {
              // Implementazione impostazioni
            }}
          >
            <FontAwesome name="cog" size={18} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Impostazioni</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoutButton, { width: width * 0.9 }]}
            onPress={handleLogout}
          >
            <FontAwesome name="sign-out" size={18} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <NotificationSnackbar
        isVisible={notification.isVisible}
        message={notification.message}
        isSuccess={notification.isSuccess}
        onFinish={notification.onFinish}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1E88E5",
    width: "100%",
    paddingVertical: 20,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "white",
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  infoSection: {
    width: width * 0.9,
    backgroundColor: "#64B5F6",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoText: {
    color: "white",
    fontSize: 16,
  },
  actionSection: {
    width: "100%",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    backgroundColor: "#FF8A80",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#F44336",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
