import React from "react";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";
import { colors, typography, TypographyToken } from "../../../theme/tokens";

export interface AppTextProps extends TextProps {
  variant?: TypographyToken;
  color?: string;
  weight?: TextStyle["fontWeight"];
  style?: StyleProp<TextStyle>;
}

export default function AppText({
  variant = "body",
  color = colors.textPrimary,
  weight,
  style,
  children,
  ...props
}: AppTextProps) {
  const typeStyle = typography[variant];

  return (
    <Text
      {...props}
      style={[
        styles.base,
        typeStyle,
        { color, fontWeight: weight ?? typeStyle.fontWeight },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: "System",
  },
});
