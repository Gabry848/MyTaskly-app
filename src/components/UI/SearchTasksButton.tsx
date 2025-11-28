import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface SearchTasksButtonProps {
  onPress: () => void;
  style?: any;
}

const SearchTasksButton: React.FC<SearchTasksButtonProps> = ({
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <MaterialIcons
          name="search"
          size={20}
          color="#666666"
          style={styles.icon}
        />
        <Text style={styles.text}>Cerca tra tutti i task</Text>
        <MaterialIcons name="arrow-forward-ios" size={16} color="#cccccc" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  icon: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: "#333333",
    fontFamily: "System",
    fontWeight: "400",
  },
});

export default SearchTasksButton;
