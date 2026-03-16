import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface PermissionModalProps {
  visible: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  primaryLabel: string;
  secondaryLabel?: string;
  badge?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({
  visible,
  icon,
  title,
  message,
  primaryLabel,
  secondaryLabel,
  badge,
  onPrimary,
  onSecondary,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}

          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={36} color="#000000" />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onPrimary}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </TouchableOpacity>

          {secondaryLabel && onSecondary ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onSecondary}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(width - 48, 360),
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  badge: {
    alignSelf: "flex-end",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#666666",
    letterSpacing: 0.2,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: "400",
    color: "#555555",
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 28,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#888888",
    letterSpacing: -0.1,
  },
});

export default PermissionModal;
