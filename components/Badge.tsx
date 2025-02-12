import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";

type BadgeProps = {
  letter: string;
  onPress: () => void;
};

export default function Badge({ letter, onPress }: BadgeProps) {
  return (
    <TouchableOpacity style={styles.badge} onPress={onPress}>
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
