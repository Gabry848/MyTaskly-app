import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styles } from "./styles";

// Assicurati di avere il componente Filter, o importalo dal percorso corretto
// import { Filter } from '...'; // Importa il componente Filter

interface TaskListHeaderProps {
  title: string;
  onFilterPress: () => void;
}

export const TaskListHeader = ({
  title,
  onFilterPress,
}: TaskListHeaderProps) => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
        <MaterialIcons name="filter-list" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};
