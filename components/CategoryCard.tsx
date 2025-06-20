import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Animated, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../src/types';
import CategoryHeader from './CategoryHeader';
import AddTaskButton from './AddTaskButton';

type CategoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'TaskList'
>;

interface CategoryCardProps {
  title: string;
  imageUrl?: string;
  taskCount: number;
  isLoading: boolean;
  onAddTask: () => void;
  onLongPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  imageUrl,
  taskCount,
  isLoading,
  onAddTask,
  onLongPress
}) => {
  const navigation = useNavigation<CategoryScreenNavigationProp>();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.view}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        onPress={() => {
          navigation.navigate("TaskList", { category_name: title });
        }}
      >
        <CategoryHeader 
          title={title}
          imageUrl={imageUrl}
          taskCount={taskCount}
          isLoading={isLoading}
        />
        
        <AddTaskButton onPress={onAddTask} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  view: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16, // Aumentato per più respiro
    marginHorizontal: 15, // Margini orizzontali come Home20
    marginVertical: 8, // Margini verticali ridotti per compattezza
    backgroundColor: "#ffffff", // Bianco puro come Home20
    borderRadius: 16, // Mantenuto arrotondato
    borderWidth: 1.5, // Aggiunto bordo come Home20
    borderColor: "#e1e5e9", // Stesso colore del bordo dell'input di Home20
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4, // Aumentato per coerenza con Home20
    },
    shadowOpacity: 0.08, // Stesso valore di Home20
    shadowRadius: 12, // Stesso valore di Home20
    elevation: 3, // Stesso valore di Home20
  },
});

export default CategoryCard;