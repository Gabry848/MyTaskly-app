import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryHeaderProps {
  title: string;
  imageUrl?: string;
  taskCount: number;
  isLoading: boolean;
  screenWidth: number;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  title,
  imageUrl,
  taskCount,
  isLoading,
  screenWidth
}) => {
  return (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['rgba(11, 148, 153, 0.7)', 'rgba(11, 148, 153, 0.3)']}
        style={[styles.imageContainer, {
          width: screenWidth < 350 ? 40 : 50,
          height: screenWidth < 350 ? 40 : 50,
        }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={[styles.image, {
            width: screenWidth < 350 ? 28 : 36,
            height: screenWidth < 350 ? 28 : 36,
          }]} />
        ) : (
          <MaterialIcons
            name="category"
            size={screenWidth < 350 ? 20 : 24}
            color="#fff"
            style={{margin: screenWidth < 350 ? 6 : 8}}
          />
        )}
      </LinearGradient>

      <View style={[styles.categoryContainer, {
        marginHorizontal: screenWidth < 350 ? 10 : 15,
      }]}>
        <Text style={[styles.add, {
          fontSize: screenWidth < 350 ? 16 : 18,
          padding: screenWidth < 350 ? 3 : 5,
        }]}>{title}</Text>
        <View style={styles.counterRow}>
          <MaterialIcons name="check-circle" size={screenWidth < 350 ? 14 : 16} color="#4CAF50" />
          <Text style={[styles.title, {
            fontSize: screenWidth < 350 ? 12 : 14,
            marginLeft: screenWidth < 350 ? 4 : 6,
          }]}>
            {isLoading ? "Caricamento..." : `${taskCount} cose da fare`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  categoryContainer: {
    flex: 1,
    marginHorizontal: 15, // Aumentato per coerenza con Home20
  },
  add: {
    fontSize: 18,
    fontWeight: "400", // Alleggerito per coerenza con Home20
    padding: 5,
    color: "#000000", // Nero puro come Home20
    fontFamily: "System",
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: 5,
  },
  title: {
    fontSize: 14,
    color: "#666666", // Colore leggermente più morbido
    marginLeft: 6, // Leggermente aumentato
    fontFamily: "System",
    fontWeight: "300", // Più leggero per coerenza con Home20
  },
});

export default CategoryHeader;