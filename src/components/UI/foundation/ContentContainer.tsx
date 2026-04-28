import React from "react";
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { spacing } from "../../../theme/tokens";

export interface ContentContainerProps extends ViewProps {
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function ContentContainer({
  children,
  padded = true,
  style,
  ...props
}: ContentContainerProps) {
  return (
    <View
      {...props}
      style={[styles.base, padded && styles.padded, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
