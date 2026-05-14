import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import AppText from "./AppText";
import { spacing } from "../../../theme/tokens";

type HeaderAlignment = "top" | "center";

export interface ScreenHeaderProps {
  title: string;
  rightActions?: React.ReactNode;
  alignment?: HeaderAlignment;
  style?: StyleProp<ViewStyle>;
}

export default function ScreenHeader({
  title,
  rightActions,
  alignment = "top",
  style,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.base, alignment === "center" ? styles.center : styles.top, style]}>
      <AppText variant="display" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
      {rightActions ? <View style={styles.actions}>{rightActions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  top: {
    alignItems: "flex-start",
  },
  center: {
    alignItems: "center",
  },
  title: {
    flex: 1,
  },
  actions: {
    marginLeft: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
});
