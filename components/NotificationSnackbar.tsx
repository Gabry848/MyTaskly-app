import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
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

  useEffect(() => {
    if (isVisible) {
      translateX.value = withTiming(0, { duration: 300 });

      const timer = setTimeout(() => {
        translateX.value = withTiming(-width, { duration: 300 }, (finished) => {
          if (finished && typeof onFinish === "function") {
            runOnJS(onFinish)();
          }
        });
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      translateX.value = withTiming(-width, { duration: 300 }, (finished) => {
        if (finished && typeof onFinish === "function") {
          runOnJS(onFinish)();
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
        { backgroundColor: isSuccess ? "#2C2C2C" : "#1A1A1A" },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 80,
    right: 20,
    left: 20,
    padding: 15,
    borderRadius: 8,
    zIndex: 999,
    borderWidth: 1,
    borderColor: "#404040",
  },
  text: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
  },
});
