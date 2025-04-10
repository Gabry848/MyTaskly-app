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
    padding: 12,
    margin: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default CategoryCard;