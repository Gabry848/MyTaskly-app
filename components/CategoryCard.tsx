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

  // Get sharing indicator text and icon
  const getSharingIndicator = () => {
    if (!isOwned) {
      // Categoria condivisa con me da un altro utente
      // Mostra il nome del proprietario se disponibile, altrimenti una descrizione generica
      const ownerText = ownerName ? `da ${ownerName}` : "da altro utente";
      const permissionText = permissionLevel === "READ_ONLY" ? "Sola lettura" : "Lettura/Scrittura";

      return {
        icon: permissionLevel === "READ_ONLY" ? "🔒" : "✏️",
        text: `Condivisa ${ownerText}`,
        subText: permissionText,
      };
    } else if (isShared) {
      // Categoria mia condivisa con altri
      return {
        icon: "👥",
        text: "Condivisa con altri",
        subText: null,
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
          navigation.navigate("TaskList", {
            categoryId: categoryId || title,
            category_name: title
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
          />

          {sharingIndicator && (
            <View style={styles.sharingIndicator}>
              <View style={styles.sharingMainRow}>
                <Text style={styles.sharingIcon}>{sharingIndicator.icon}</Text>
                <Text style={styles.sharingText}>{sharingIndicator.text}</Text>
              </View>
              {sharingIndicator.subText && (
                <Text style={styles.sharingSubText}>{sharingIndicator.subText}</Text>
              )}
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
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sharingMainRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sharingIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  sharingText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  sharingSubText: {
    fontSize: 11,
    color: "#888",
    fontWeight: "400",
    marginTop: 2,
    marginLeft: 20, // Allineato con il testo sopra (icon width + margin)
  },
});

export default CategoryCard;