import React from "react";
import { Pressable, StyleSheet, Platform } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';

export interface AddTaskButtonProps {
  onPress: () => void;
  screenWidth: number;
  categoryTitle?: string;
}

const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onPress, screenWidth, categoryTitle }) => {
  return (
    <Pressable
      accessible={true}
      accessibilityLabel="Aggiungi nuova attività"
      accessibilityRole="button"
      accessibilityHint={categoryTitle ? `Aggiungi una nuova attività alla categoria ${categoryTitle}` : "Aggiungi una nuova attività"}
      style={({ pressed }) => [
        styles.controlsContainer,
        {
          paddingVertical: screenWidth < 350 ? 12 : 12,
          paddingHorizontal: screenWidth < 350 ? 12 : 12,
          marginTop: screenWidth < 320 ? 8 : 0,
        },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {({ pressed }) => (
        <MaterialIcons
          name="add-task"
          size={20}
          color={pressed ? "#424242" : "#000000"}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pressed: {
    backgroundColor: "#EEEEEE",
    borderColor: "#BDBDBD",
  },
});

export default AddTaskButton;
