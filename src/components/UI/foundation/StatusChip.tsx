import React from "react";
import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from "react-native";
import AppText from "./AppText";
import { colors, radius, spacing } from "../../../theme/tokens";

type ChipTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface StatusChipProps {
  label: string;
  tone?: ChipTone;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
}

const toneMap = {
  neutral: { bg: "#f0f0f0", fg: colors.textSecondary },
  accent: { bg: "#eaf2ff", fg: colors.accent },
  success: { bg: "#eafaf2", fg: colors.success },
  warning: { bg: "#fff6e8", fg: colors.warning },
  danger: { bg: "#fdecec", fg: colors.danger },
} as const;

export default function StatusChip({
  label,
  tone = "neutral",
  style,
  textStyle,
  leftIcon,
}: StatusChipProps) {
  const colorSet = toneMap[tone];

  return (
    <View style={[styles.base, { backgroundColor: colorSet.bg }, style]}>
      {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
      <AppText variant="label" color={colorSet.fg} style={textStyle}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  icon: {
    marginRight: spacing.xs,
  },
});
