import React, { useState, useEffect } from "react";
import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../src/constants/authConstants";

import { check_login, refreshToken } from "../src/services/authService";

export default function Badge() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [letter, setLetter] = useState<string>("U"); // Valore predefinito

  const handlePress = async () => {
    const login_data = check_login();

    if ((await login_data).isAuthenticated) {
      navigation.navigate("Profile");
    } else if ((await login_data).canRefresh) {
      await refreshToken();
      // Se necessario, puoi anche navigare dopo il refresh
      // navigation.navigate("Profile", { user: letter });
    } else {
      navigation.navigate("Login");
    }
  };

  useEffect(() => {
    const fetchLetter = async () => {
      const userName = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
      const firstLetter = userName ? userName[0] : "U"; // Valore predefinito
      setLetter(firstLetter);
    };

    fetchLetter();
  }, []); // L'effetto viene eseguito solo una volta al montaggio del componente

  return (
    <TouchableOpacity style={styles.badge} onPressIn={() => handlePress()}>
      <View>
        <Text style={styles.text}>{letter}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 30,
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
