export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const elevation = {
  none: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const colors = {
  background: "#ffffff",
  surface: "#ffffff",
  surfaceMuted: "#f8f8f8",
  border: "#e1e5e9",
  borderSoft: "#f0f0f0",
  textPrimary: "#000000",
  textSecondary: "#666666",
  textTertiary: "#999999",
  accent: "#007AFF",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
} as const;

export const typography = {
  display: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.2,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    letterSpacing: -0.4,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
    fontFamily: "Inter_400Regular",
    letterSpacing: -0.2,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.1,
  },
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type ElevationToken = keyof typeof elevation;
export type ColorToken = keyof typeof colors;
export type TypographyToken = keyof typeof typography;
