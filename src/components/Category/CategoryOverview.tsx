import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, NavigationProp, CompositeNavigationProp } from "@react-navigation/native";
import { RootStackParamList, TabParamList } from "../../types";
import { getTasks, Task } from "../../services/taskService";

export interface CategoryProps {
  id: number | string;
  name: string;
  taskCount: number;
  color?: string;
}

export interface CategoryOverviewProps {
  categories: CategoryProps[];
  onCategoryPress: (categoryId: number | string) => void;
}

const CategoryOverview: React.FC<CategoryOverviewProps> = ({
  categories,
  onCategoryPress
}) => {
  // Aggiunto il navigation hook per navigare alla schermata Categories
  const navigation = useNavigation<NavigationProp<TabParamList>>();
  
  // Aggiungiamo uno stato per tenere traccia dei conteggi effettivi
  const [categoriesWithActualCounts, setCategoriesWithActualCounts] = useState<CategoryProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Colori predefiniti per le categorie
  const defaultColors = ["#FF9500", "#5AC8FA", "#FF2D55", "#5856D6", "#007AFF"];
  
  // Funzione per gestire la pressione del pulsante "Visualizza tutte"
  const handleViewAllPress = () => {
    navigation.navigate("Categories");
  };
  
  // Funzione per recuperare il conteggio effettivo dei task per ogni categoria
  useEffect(() => {
    const fetchTaskCounts = async () => {
      if (!categories || categories.length === 0) {
        setCategoriesWithActualCounts([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Crea un array di promesse per chiamate parallele
        const categoryPromises = categories.map(async (category) => {
          try {
            // Usa category.id se disponibile, altrimenti fallback su category.name
            const categoryIdentifier = category.id || category.name;
            const tasksData = await getTasks(categoryIdentifier);

            // Filtrare i task per quelli non completati (come in Category.tsx)
            const incompleteTasks = tasksData.filter((task: Task) =>
              task.status !== "Completato" && task.status !== "Completed"
            );

            return {
              ...category,
              taskCount: incompleteTasks.length
            };
          } catch (error) {
            console.error(`Errore durante il recupero dei task per ${category.name}:`, error);
            return category; // Mantiene il conteggio originale in caso di errore
          }
        });
        
        // Attendi che tutte le promesse siano risolte
        const updatedCategories = await Promise.all(categoryPromises);
        setCategoriesWithActualCounts(updatedCategories);
      } catch (error) {
        console.error("Errore durante il recupero dei conteggi dei task:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTaskCounts();
  }, [categories]);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Le tue categorie</Text>
      
      <View style={styles.categoriesContainer}>
        {categoriesWithActualCounts.length > 0 ? (
          categoriesWithActualCounts.map((category, index) => (
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
            {isLoading ? 'Caricamento categorie...' : 'Nessuna categoria disponibile'}
          </Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={handleViewAllPress}
      >
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