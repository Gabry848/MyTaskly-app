import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native"; // nuovo import
import requestData from "../src/config/requestData.json";


import { check_login, refreshToken } from "../src/services/authService";

type BadgeProps = {
  letter: string;
};

export default function Badge({ letter }: BadgeProps) {
  const navigation = useNavigation();


  return (
    <TouchableOpacity
      style={styles.badge}
      onPress={() => {
        const login_data = check_login({
          loginTime: requestData.user.loginTime,
          bearerDuration: requestData.user.bearerDuration,
          refreshDuration: requestData.user.refreshDuration,
        });

        if (login_data.isAuthenticated) {
          console.log("Utente loggato");
          
        } else if (login_data.canRefresh) {
          console.log("Utente non loggato, ma può fare refresh");
          refreshToken(requestData);
        } else {
          navigation.navigate("Login")
          console.log("Utente non loggato e non può fare refresh");
        }
      }}
    >
      <Text style={styles.text}>{letter}</Text>
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
