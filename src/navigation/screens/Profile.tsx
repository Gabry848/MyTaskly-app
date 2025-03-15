import React from "react";
import { View, Text } from "react-native";
import { Button } from "react-native";
import { logout } from "../../services/authService";


export default function Profile() {
  function handleLogout() {
    logout();
  }


  return (
    <View>
      <Text>Hi utente</Text>
      <Button title="Logout" onPress={handleLogout} />

    </View>
  );
};

