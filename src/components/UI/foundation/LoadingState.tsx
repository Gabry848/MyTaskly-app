import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import AppText from "./AppText";
import { colors, spacing } from "../../../theme/tokens";

type LoadingVariant = "spinner" | "dots";

export interface LoadingStateProps {
  variant?: LoadingVariant;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export default function LoadingState({
  variant = "spinner",
  label,
  style,
}: LoadingStateProps) {
  const dots = [
    useRef(new Animated.Value(0.2)).current,
    useRef(new Animated.Value(0.2)).current,
    useRef(new Animated.Value(0.2)).current,
  ];

  useEffect(() => {
    if (variant !== "dots") return;

    const loops = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 360,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.2,
            duration: 360,
            useNativeDriver: true,
          }),
        ])
      )
    );

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [dots, variant]);

  return (
    <View style={[styles.container, style]}>
      {variant === "spinner" ? (
        <ActivityIndicator size="large" color={colors.textPrimary} />
      ) : (
        <View style={styles.dots}>
          {dots.map((dot, index) => (
            <Animated.View key={index} style={[styles.dot, { opacity: dot }]} />
          ))}
        </View>
      )}
      {label ? (
        <AppText variant="caption" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textPrimary,
    marginHorizontal: spacing.xs,
  },
  label: {
    marginTop: spacing.md,
  },
});
