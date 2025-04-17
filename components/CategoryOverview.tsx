import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface CategoryProps {
  id: number | string;
  name: string;
  taskCount: number;
  color?: string;
}

interface CategoryOverviewProps {
  categories: CategoryProps[];
  onCategoryPress: (categoryId: number | string) => void;
}

const CategoryOverview: React.FC<CategoryOverviewProps> = ({ 
  categories, 
  onCategoryPress 
}) => {
  // Colori predefiniti per le categorie
  const defaultColors = ["#FF9500", "#5AC8FA", "#FF2D55", "#5856D6", "#007AFF"];
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Le tue categorie</Text>
      
      <View style={styles.categoriesContainer}>
        {categories.length > 0 ? (
          categories.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                { 
                  backgroundColor: category.color || defaultColors[index % defaultColors.length],
                  opacity: 0.85
                }
              ]}
              onPress={() => onCategoryPress(category.id)}
            >
              <Text style={styles.categoryName} numberOfLines={1}>
                {category.name}
              </Text>
              <View style={styles.taskCountContainer}>
                <Text style={styles.taskCount}>{category.taskCount}</Text>
                <MaterialIcons name="assignment" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Nessuna categoria disponibile
          </Text>
        )}
      </View>
      
      <TouchableOpacity style={styles.viewAllButton}>
        <Text style={styles.viewAllText}>Visualizza tutte</Text>
        <MaterialIcons name="chevron-right" size={18} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryItem: {
    width: "48%",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryName: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 10,
  },
  taskCountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskCount: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginRight: 5,
  },
  emptyText: {
    fontStyle: "italic",
    color: "#999",
    textAlign: "center",
    width: "100%",
    padding: 10,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 8,
  },
  viewAllText: {
    color: "#007AFF",
    fontWeight: "500",
    fontSize: 14,
  },
});

export default CategoryOverview;