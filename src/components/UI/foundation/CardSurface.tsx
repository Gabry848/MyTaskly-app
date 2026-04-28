import React from "react";
import { Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { colors, elevation, radius, spacing } from "../../../theme/tokens";

type CardVariant = "default" | "outlined" | "interactive";

export interface CardSurfaceProps extends Omit<PressableProps, "style"> {
  variant?: CardVariant;
  accentColor?: string;
  accentWidth?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export default function CardSurface({
  variant = "default",
  accentColor,
  accentWidth = 0,
  style,
  children,
  ...props
}: CardSurfaceProps) {
  const cardStyle = [
    styles.base,
    variant === "outlined" && styles.outlined,
    variant === "interactive" && styles.interactive,
    accentColor ? { borderLeftColor: accentColor, borderLeftWidth: accentWidth || 4 } : null,
    style,
  ];

  if (variant === "interactive" || props.onPress) {
    return (
      <Pressable {...props} style={cardStyle}>
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...elevation.sm,
  },
  outlined: {
    borderColor: colors.border,
    ...elevation.none,
  },
  interactive: {
    ...elevation.md,
  },
});
