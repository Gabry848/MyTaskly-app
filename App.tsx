import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./src/navigation/screens/Login";
import ProfileScreen from "./src/navigation/screens/Profile";
import RegisterScreen from "./src/navigation/screens/Register";
import HomeScreen from "./src/navigation/screens/Home";

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" id={undefined}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}