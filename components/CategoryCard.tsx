import React from "react";
import { StyleSheet, TouchableOpacity, Animated, Dimensions, View, Text } from "react-native";
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
  isShared?: boolean;
  isOwned?: boolean;
  permissionLevel?: "READ_ONLY" | "READ_WRITE";
  onAddTask: () => void;
  onLongPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  imageUrl,
  taskCount,
  isLoading,
  isShared = false,
  isOwned = true,
  permissionLevel = "READ_WRITE",
  onAddTask,
  onLongPress
}) => {
  const navigation = useNavigation<CategoryScreenNavigationProp>();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const screenWidth = Dimensions.get('window').width;

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

  // Get sharing indicator text and icon
  const getSharingIndicator = () => {
    if (!isOwned) {
      return {
        icon: permissionLevel === "READ_ONLY" ? "🔒" : "✏️",
        text: permissionLevel === "READ_ONLY" ? "Sola lettura" : "Condivisa",
      };
    } else if (isShared) {
      return {
        icon: "👥",
        text: "Condivisa",
      };
    }
    return null;
  };

  const sharingIndicator = getSharingIndicator();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.view, {
          marginHorizontal: screenWidth < 350 ? 8 : 15,
          padding: screenWidth < 350 ? 12 : 16,
          flexDirection: screenWidth < 320 ? 'column' : 'row',
        }]}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        onPress={() => {
          navigation.navigate("TaskList", { category_name: title });
        }}
      >
        <View style={styles.contentContainer}>
          <CategoryHeader
            title={title}
            imageUrl={imageUrl}
            taskCount={taskCount}
            isLoading={isLoading}
            screenWidth={screenWidth}
          />

          {sharingIndicator && (
            <View style={styles.sharingIndicator}>
              <Text style={styles.sharingIcon}>{sharingIndicator.icon}</Text>
              <Text style={styles.sharingText}>{sharingIndicator.text}</Text>
            </View>
          )}
        </View>

        <AddTaskButton onPress={onAddTask} screenWidth={screenWidth} />
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
  contentContainer: {
    flex: 1,
  },
  sharingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sharingIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  sharingText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
});

export default CategoryCard;