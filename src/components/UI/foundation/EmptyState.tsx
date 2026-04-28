import React from "react";
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import AppText from "./AppText";
import { colors, spacing } from "../../../theme/tokens";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onPressCta,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon}
      <AppText variant="subtitle" style={styles.title}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="body" color={colors.textSecondary} style={styles.description}>
          {description}
        </AppText>
      ) : null}
      {ctaLabel && onPressCta ? (
        <TouchableOpacity onPress={onPressCta} style={styles.cta} activeOpacity={0.8}>
          <AppText variant="label" color={colors.background}>
            {ctaLabel}
          </AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    marginTop: spacing.md,
    textAlign: "center",
  },
  description: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.textPrimary,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
