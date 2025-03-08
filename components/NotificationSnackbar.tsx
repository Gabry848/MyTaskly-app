import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface NotificationSnackbarProps {
  isVisible: boolean;
  message: string;
  isSuccess?: boolean;
  onFinish?: () => void;
}

export function NotificationSnackbar({
  isVisible,
  message,
  isSuccess = true,
  onFinish = () => {},
}: NotificationSnackbarProps) {
  const translateX = useSharedValue(-width);

  // Modifica l'effetto per aggiungere un controllo sulla funzione
useEffect(() => {
  if (isVisible) {
    translateX.value = withTiming(0, { duration: 300 });

    const timer = setTimeout(() => {
      translateX.value = withTiming(-width, { duration: 300 }, () => {
        // Controlla se onFinish è una funzione prima di chiamarlo
        if (typeof onFinish === 'function') {
          onFinish();
        }
      });
    }, 1500);

    return () => clearTimeout(timer);
    
  } else {
    translateX.value = withTiming(-width, { duration: 300 }, () => {
      if (typeof onFinish === 'function') {
        onFinish();
      }
    });
  }
}, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        { backgroundColor: isSuccess ? "#4CAF50" : "#F44336" },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 20,
    right: 20,
    left: 20,
    padding: 15,
    borderRadius: 8,
    zIndex: 999,
  },
  text: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
