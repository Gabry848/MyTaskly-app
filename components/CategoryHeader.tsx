import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryHeaderProps {
  title: string;
  imageUrl?: string;
  taskCount: number;
  isLoading: boolean;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ 
  title, 
  imageUrl, 
  taskCount, 
  isLoading 
}) => {
  return (
    <>
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
          <Text style={styles.title}>
            {isLoading ? "Caricamento..." : `${taskCount} cose da fare`}
          </Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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