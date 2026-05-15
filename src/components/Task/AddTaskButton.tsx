import React from "react";
import { Pressable, StyleSheet, Platform, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";

export interface AddTaskButtonProps {
  onPress: () => void;
  screenWidth: number;
  categoryTitle?: string;
  isInline?: boolean; // Per renderlo più piccolo quando è inline
}

const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onPress, screenWidth, categoryTitle, isInline = false }) => {
  const { t } = useTranslation();
  return (
    <Pressable
      accessible={true}
      accessibilityLabel={t("tasks.accessibility.addTaskLabel")}
      accessibilityRole="button"
      accessibilityHint={categoryTitle
        ? t("tasks.accessibility.addTaskHintCategory", { category: categoryTitle })
        : t("tasks.accessibility.addTaskHint")}
      style={({ pressed }) => [
        styles.controlsContainer,
        isInline ? styles.inlineButton : null,
        {
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      onPress={onPress}
    >
      <Ionicons name="add" size={isInline ? 24 : 28} color="#ffffff" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  inlineButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});

export default AddTaskButton;
