import React from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView, SafeAreaViewProps } from "react-native-safe-area-context";
import { colors } from "../../../theme/tokens";

export interface ScreenContainerProps extends SafeAreaViewProps {
  style?: StyleProp<ViewStyle>;
}

export default function ScreenContainer({
  children,
  style,
  ...props
}: ScreenContainerProps) {
  return (
    <SafeAreaView {...props} style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
