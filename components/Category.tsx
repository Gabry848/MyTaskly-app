import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../src/types';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

type CategoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'TaskList'
>;

interface CategoryProps {
  title: string;
  imageUrl?: string;
  taskCount?: number;
}

const Category: React.FC<CategoryProps> = ({ title, imageUrl, taskCount = 10 }) => {
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
        onPress={() => {
          navigation.navigate("TaskList", { category_name: title });
        }}
      >
        <LinearGradient
          colors={['rgba(11, 148, 153, 0.7)', 'rgba(11, 148, 153, 0.3)']}
          style={styles.imageContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <MaterialIcons name="category" size={24} color="#fff" style={{margin: 8}} />
          )}
        </LinearGradient>

        <View style={styles.categoryContainer}>
          <Text style={styles.add}>{title}</Text>
          <View style={styles.counterRow}>
            <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.title}>{taskCount} cose da fare</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.controlsContainer}>
          <LinearGradient
            colors={['#4CAF50', '#2E7D32']}
            style={styles.addButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="add-task" size={22} color="#fff" />
            <Text style={styles.addButtonText}>Aggiungi</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  imageContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: 5,
  },
  add: {
    fontSize: 18,
    fontWeight: "700",
    padding: 5,
    color: "#333",
  },
  title: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  categoryContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  controlsContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default Category;