import React from "react";
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { radius, spacing } from "../../../theme/tokens";

export interface IconActionButtonProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export default function IconActionButton({
  children,
  style,
  ...props
}: IconActionButtonProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: spacing.sm,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.7,
  },
});
