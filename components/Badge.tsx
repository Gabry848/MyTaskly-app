import React from "react";
import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import requestData from "../src/config/requestData.json";


import { check_login, refreshToken } from "../src/services/authService";

type BadgeProps = {
  letter: string;
};


export default function Badge({ letter }: BadgeProps) {
  const navigation = useNavigation();


  async function handlePress() {
    const login_data = check_login();

    if ((await login_data).isAuthenticated) {
      console.log("Utente loggato");
      navigation.navigate("Profile", { user: letter });
    } else if ((await login_data).canRefresh) {
      console.log("Utente non loggato, ma può fare refresh");
      await refreshToken();
      // Se necessario, puoi anche navigare dopo il refresh
      // navigation.navigate("Profile", { user: letter });
    } else {
      console.log("Utente non loggato e non può fare refresh");
      navigation.navigate("Login");
    }
  }

  return (
    <TouchableOpacity
      style={styles.badge}
      onPressIn={() => handlePress()}>
        <View>
          <Text style={styles.text}>{letter}</Text>
        </View>
      
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  text: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
