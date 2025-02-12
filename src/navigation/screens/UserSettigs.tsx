import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function UserSettigs() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Settings</Text>
      {/* ...other settings UI... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
