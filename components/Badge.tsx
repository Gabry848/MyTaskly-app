import React, { useState, useEffect } from "react";
import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../src/constants/authConstants";
import { useFocusEffect } from '@react-navigation/native';

export default function Badge() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [letter, setLetter] = useState<string>("U"); // Valore predefinito
  const handlePress = async () => {
    try {
      // Utilizza la nuova funzione di controllo con refresh automatico
      const { checkAndRefreshAuth } = await import("../src/services/authService");
      const authResult = await checkAndRefreshAuth();
      
      if (authResult.isAuthenticated) {
        navigation.navigate("Profile");
      } else {
        // Se l'autenticazione fallisce, vai al login
        navigation.navigate("Login");
      }
    } catch (error) {
      console.error("Errore nel controllo autenticazione:", error);
      navigation.navigate("Login");
    }
  };

  useFocusEffect(
      React.useCallback(() => {
        const fetchLetter = async () => {
          const userName = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
          const firstLetter = userName ? userName[0] : " "; 
          setLetter(firstLetter);
        };

        fetchLetter();
      }, [])
    );

  useEffect(() => {
    const fetchLetter = async () => {
      const userName = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
      const firstLetter = userName ? userName[0] : " "; 
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
    backgroundColor: "#000000",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1.5,
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
  text: {
    color: "white",
    fontWeight: "300",
    fontSize: 16,
    fontFamily: "System",
    letterSpacing: -0.3,
  },
});
