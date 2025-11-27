import React from "react";
import { StyleSheet, Pressable, Animated, Dimensions, View, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import CategoryHeader from './CategoryHeader';
import AddTaskButton from '../Task/AddTaskButton';
import SharingInfo from './SharingInfo';

type CategoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'TaskList'
>;

interface CategoryCardProps {
  title: string;
  categoryId?: string | number;
  imageUrl?: string;
  taskCount: number;
  isLoading: boolean;
  isShared?: boolean;
  isOwned?: boolean;
  ownerName?: string; // Nome del proprietario (per categorie condivise)
  permissionLevel?: "READ_ONLY" | "READ_WRITE";
  onAddTask: () => void;
  onLongPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  categoryId,
  imageUrl,
  taskCount,
  isLoading,
  isShared = false,
  isOwned = true,
  ownerName,
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

  // Determine badge type
  const getBadgeType = (): 'shared' | 'readOnly' | 'canEdit' | null => {
    if (isOwned && isShared) return 'shared';
    if (!isOwned && permissionLevel === 'READ_ONLY') return 'readOnly';
    if (!isOwned && permissionLevel === 'READ_WRITE') return 'canEdit';
    return null;
  };

  const badgeType = getBadgeType();

  // Generate accessibility label
  const getAccessibilityLabel = () => {
    let label = `Categoria ${title}, ${taskCount} attività`;

    if (isShared || !isOwned) {
      if (isOwned) {
        label += ', condivisa con altri';
      } else {
        const owner = ownerName || 'altro utente';
        const permission = permissionLevel === 'READ_ONLY' ? 'sola lettura' : 'puoi modificare';
        label += `, condivisa da ${owner}, ${permission}`;
      }
    }

    return label;
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        accessible={true}
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityRole="button"
        accessibilityHint="Tocca due volte per visualizzare le attività"
        style={({ pressed }) => [
          styles.view,
          {
            marginHorizontal: screenWidth < 350 ? 8 : 16,
            padding: screenWidth < 350 ? 12 : 16,
            flexDirection: screenWidth < 320 ? 'column' : 'row',
          },
          pressed && styles.pressed,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        onPress={() => {
          navigation.navigate("TaskList", {
            categoryId: categoryId || title,
            category_name: title,
            isOwned: isOwned,
            permissionLevel: permissionLevel
          });
        }}
      >
        <View style={styles.contentContainer}>
          <CategoryHeader
            title={title}
            imageUrl={imageUrl}
            taskCount={taskCount}
            isLoading={isLoading}
            screenWidth={screenWidth}
            badgeType={badgeType}
          />

          {(isShared || !isOwned) && (
            <SharingInfo
              isOwned={isOwned}
              ownerName={ownerName}
              permissionLevel={permissionLevel}
            />
          )}
        </View>

        {/* Hide add button for READ_ONLY shared categories */}
        {!(isShared && !isOwned && permissionLevel === 'READ_ONLY') && (
          <AddTaskButton onPress={onAddTask} screenWidth={screenWidth} categoryTitle={title} />
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  view: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E1E5E9",
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pressed: {
    backgroundColor: "#F9F9F9",
    borderColor: "#BDBDBD",
  },
  contentContainer: {
    flex: 1,
  },
});

export default CategoryCard;