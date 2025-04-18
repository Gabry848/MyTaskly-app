import React from "react";
import { NavigationContainer, LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "./screens/Home";
import Profile from "./screens/Profile";
import Settings from "./screens/Settings";
import { NotFound } from "./screens/NotFound";
import TaskList from "./screens/TaskList";
import Login from "./screens/Login";
import Register from "./screens/Register";
import Categories from "./screens/Categories";
import Notes from "./screens/Notes";
import Statistics from "./screens/Statistics"; 
// import BotChat from "./screens/BotChat"; // rimosso BotChat
import { RootStackParamList } from "../types";
import { Home as HomeIcon, BookType, FolderKanban, MessageSquare } from "lucide-react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();

// Bottom tabs navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        tabBarActiveTintColor: "#007BFF",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Home" // Corretto da "HomePage" a "Home"
        component={Home}
        options={{
          title: "Home",
          headerShown: false, // Nascondo l'header solo per Home
          tabBarIcon: ({ color, size }) => (
            <HomeIcon size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={Notes}
        options={{
          tabBarIcon: ({ color, size }) => (
            <BookType size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={Categories}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FolderKanban size={size} color={color} />
          ),
        }}
      />
      {/* <Tab.Screen
        name="BotChat"
        component={BotChat}
        options={{
          title: "Assistente",
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} />
          ),
        }}
      /> */}
    </Tab.Navigator>
  );
}

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["https://taskly.com", "taskly://"],
  config: {
    screens: {
      HomeTabs: "home", // Ora valido perché HomeTabs è in RootStackParamList
      Profile: {
        path: ":user(@[a-zA-Z0-9-_]+)",
        parse: {
          user: (value) => value.replace(/^@/, ""),
        },
        stringify: {
          user: (value) => `@${value}`,
        },
      },
      Settings: "settings",
      NotFound: "*",
      TaskList: "tasks",
      Login: "login",
      Register: "register",
      Categories: "categories",
      Notes: "notes",
      Statistics: "statistics", // Aggiunto percorso per Statistics
      // BotChat: "botchat", // Aggiungo percorso per BotChat
    },
  },
};

export default function RootStack() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator id={undefined}>
        <Stack.Screen
          name="HomeTabs" // Ora valido
          component={TabNavigator}
          options={{ title: "Taskly", headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{ title: "Profile" }}
        />
        <Stack.Screen
          name="Settings"
          component={Settings}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="NotFound"
          component={NotFound}
          options={{ title: "404" }}
        />
        <Stack.Screen
          name="TaskList"
          component={TaskList}
          options={{ title: "ToDo" }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ title: "Login" }}
        />
        <Stack.Screen
          name="Register"
          component={Register}
          options={{ title: "Register" }}
        />
        {/* Schermata per le statistiche dettagliate */}
        <Stack.Screen
          name="Statistics"
          component={Statistics}
          options={{ title: "Statistiche Dettagliate" }}
        />
        {/* Schermata per la chat con il bot */}
        {/* <Stack.Screen
          name="BotChat"
          component={BotChat}
          options={{ title: "Assistente Virtuale" }}
        /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
