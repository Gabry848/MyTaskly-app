import React from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { colors, elevation, radius, spacing } from "../../../theme/tokens";

export interface InputShellProps extends TextInputProps {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function InputShell({
  leftSlot,
  rightSlot,
  containerStyle,
  style,
  ...props
}: InputShellProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {leftSlot ? <View style={styles.slot}>{leftSlot}</View> : null}
      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor={props.placeholderTextColor ?? colors.textTertiary}
      />
      {rightSlot ? <View style={styles.slot}>{rightSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: 50,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...elevation.sm,
  },
  slot: {
    marginHorizontal: spacing.xs,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: "System",
    fontSize: 15,
    paddingVertical: spacing.xs,
  },
});
