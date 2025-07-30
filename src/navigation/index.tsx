import React, { useEffect, useState } from "react";
import {
  NavigationContainer,
  useNavigation,
  NavigationProp,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BackHandler } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import LoginScreen from "./screens/Login";
import RegisterScreen from "./screens/Register";
import EmailVerificationScreen from "./screens/EmailVerification";
import VerificationSuccessScreen from "./screens/VerificationSuccess";
import HomeScreen from "./screens/Home";
import TaskListScreen from "./screens/TaskList";
import CategoriesScreen from "./screens/Categories";
import ProfileScreen from "./screens/Profile";
import NotesScreen from "./screens/Notes";
import BotChatScreen from "./screens/BotChat";
import SettingsScreen from "./screens/Settings";
import AccountSettingsScreen from "./screens/AccountSettings";
import ChangePasswordScreen from "./screens/ChangePassword";
import HelpScreen from "./screens/Help";
import AboutScreen from "./screens/About";
import LanguageScreen from "./screens/Language";
import NotificationDebugScreen from "./screens/NotificationDebug";
import BugReportScreen from "./screens/BugReport";
import { NotFound as NotFoundScreen } from "./screens/NotFound";
import eventEmitter from "../utils/eventEmitter";
import { check_login } from "../services/authService";
import { useNotifications } from "../services/notificationService";

// Definizione del tipo per le route dello Stack principale
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  EmailVerification: { email: string; username: string; password: string };
  VerificationSuccess: { email: string; username: string; password: string };
  HomeTabs: undefined; // Contiene il Tab Navigator
  Home20: undefined; // Nuova schermata Home2.0
  TaskList: { category_name: number | string };
  Profile: undefined;
  Settings: undefined;
  AccountSettings: undefined;
  ChangePassword: undefined;
  Help: undefined;
  About: undefined;
  Language: undefined;
  NotificationDebug: undefined;
  BugReport: undefined;
  Statistics: undefined;
  Updates: undefined;
  NotFound: undefined;
};

// Definizione del tipo per le route dei Tab
export type TabParamList = {
  Home: undefined;
  Categories: undefined;
  Notes: undefined;
  BotChat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Tab Navigator per le schermate principali
function HomeTabs() {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Categories":
              iconName = focused ? "grid" : "grid-outline";
              break;
            case "Notes":
              iconName = focused ? "document-text" : "document-text-outline";
              break;
            case "BotChat":
              iconName = focused ? "chatbubbles" : "chatbubbles-outline";
              break;
            default:
              iconName = "home-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: "Categorie" }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{ title: "Note" }}
      />
      {/* <Tab.Screen
        name="BotChat"
        component={BotChatScreen}
        options={{ title: "Chat Bot" }}
      /> */}
    </Tab.Navigator>
  );
}
// Componente interno che gestisce l'event emitter
function NavigationHandler() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const handleLogout = () => {
      navigation.navigate("Login");
    };

    const handleBackPress = () => {
      const currentRoute =
        navigation.getState()?.routes[navigation.getState()?.index || 0]?.name;

      // Se siamo sulla schermata di Login, chiudi l'app
      if (currentRoute === "Login") {
        BackHandler.exitApp();
        return true; // Previene il comportamento di default
      }

      return false; // Lascia che React Navigation gestisca il back button
    };

    eventEmitter.on("logoutSuccess", handleLogout);
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => {
      eventEmitter.off("logoutSuccess", handleLogout);
      backHandler.remove();
    };
  }, [navigation]);

  return null;
}

// Stack Navigator separato con controllo autenticazione
function AppStack() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Controlla lo stato di autenticazione all'avvio
  
  // 🔔 Inizializza il sistema di notifiche quando l'utente è autenticato
  const { expoPushToken, notification } = useNotifications();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Importa la funzione di controllo e refresh automatico
        const { checkAndRefreshAuth } = await import("../services/authService");
        const authResult = await checkAndRefreshAuth();

        if (authResult.isAuthenticated) {
          console.log(authResult.message);
        } else {
          console.log(authResult.message);
        }

        setIsAuthenticated(authResult.isAuthenticated);
      } catch (error) {
        console.error("Errore nel controllo autenticazione:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Listener per eventi di login/logout
  useEffect(() => {
    const handleLoginSuccess = () => {
      setIsAuthenticated(true);
    };

    const handleLogoutSuccess = () => {
      setIsAuthenticated(false);
    };

    eventEmitter.on("loginSuccess", handleLoginSuccess);
    eventEmitter.on("logoutSuccess", handleLogoutSuccess);

    return () => {
      eventEmitter.off("loginSuccess", handleLoginSuccess);
      eventEmitter.off("logoutSuccess", handleLogoutSuccess);
    };
  }, []);

  // Log delle notifiche ricevute per debug
  useEffect(() => {
    if (notification) {
      console.log("🔔 Notifica ricevuta nell'app:", notification.request.content);
    }
  }, [notification]);

  // Mostra un loading screen mentre controlla l'autenticazione
  if (isLoading) {
    return null; // O un componente di loading se preferisci
  }

  const initialRoute = isAuthenticated ? "HomeTabs" : "Login";
  return (
    <>
      <NavigationHandler />
      <Stack.Navigator id={undefined} initialRouteName={initialRoute}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EmailVerification"
          component={EmailVerificationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VerificationSuccess"
          component={VerificationSuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeTabs"
          component={HomeTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="TaskList" component={TaskListScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen 
          name="AccountSettings" 
          component={AccountSettingsScreen}
          options={{ title: 'Gestisci account' }}
        />
        <Stack.Screen 
          name="ChangePassword" 
          component={ChangePasswordScreen}
          options={{ title: 'Cambia password' }}
        />
        <Stack.Screen 
          name="Help" 
          component={HelpScreen}
          options={{ title: 'Aiuto' }}
        />
        <Stack.Screen 
          name="About" 
          component={AboutScreen}
          options={{ title: 'Info' }}
        />
        <Stack.Screen 
          name="Language" 
          component={LanguageScreen}
          options={{ title: 'Lingua' }}
        />
        <Stack.Screen 
          name="NotificationDebug" 
          component={NotificationDebugScreen}
          options={{ title: 'Debug Notifiche' }}
        />
        <Stack.Screen 
          name="BugReport" 
          component={BugReportScreen}
          options={{ title: 'Segnala Bug' }}
        />
        <Stack.Screen name="NotFound" component={NotFoundScreen} />
      </Stack.Navigator>
    </>
  );
}

// Componente principale Navigation
export default function Navigation() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AppStack />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
