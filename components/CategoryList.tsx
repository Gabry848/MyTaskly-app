import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { getCategories } from "../src/services/taskService";
import Category from "./Category";
import AddCategoryButton from "./AddCategoryButton";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../src/types";

// Definiamo l'interfaccia della categoria esattamente uguale a quella in AddCategoryButton
interface CategoryType {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string;
  category_id?: number;
  status_code?: number;
}

// Creiamo una variabile globale per condividere i dati tra componenti
let globalCategoriesRef = {
  addCategory: (category: CategoryType) => {},
  categories: [] as CategoryType[],
};

const CategoryList = forwardRef((props, ref) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Assegna la funzione di aggiornamento al riferimento globale
  globalCategoriesRef.addCategory = (newCategory: CategoryType) => {
    console.log("globalCategoriesRef.addCategory chiamata con:", newCategory);
    
    // Verifica che sia una categoria valida con nome
    if (!newCategory || !newCategory.name) {
      console.error("Categoria non valida:", newCategory);
      return;
    }
    
    // Assicurati che abbia un ID
    const categoryWithId = {
      ...newCategory,
      id: newCategory.id || newCategory.category_id || Date.now()
    };
    
    // Aggiorna lo stato diretto
    setCategories(prevState => {
      // Verifica che la categoria non esista già
      const exists = prevState.some(
        cat => cat.id === categoryWithId.id || cat.name === categoryWithId.name
      );
      
      if (exists) {
        console.log("La categoria esiste già, non viene aggiunta:", categoryWithId.name);
        return prevState;
      }
      
      console.log("Aggiunta categoria direttamente:", categoryWithId);
      return [...prevState, categoryWithId];
    });
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
        // Aggiorna anche la referenza globale
        globalCategoriesRef.categories = categoriesData;
      } else {
        console.error("getCategories non ha restituito un array:", categoriesData);
      }
    } catch (error) {
      console.error("Errore nel recupero delle categorie:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCategories();
    }, [])
  );

  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Aggiorna il riferimento globale quando cambia lo stato delle categorie
  useEffect(() => {
    globalCategoriesRef.categories = categories;
  }, [categories]);

  useImperativeHandle(ref, () => ({
    reloadCategories: () => {
      setLoading(true);
      fetchCategories();
    },
  }));

  // Il gestore originale dell'aggiunta della categoria (ora usa la funzione globale)
  const handleCategoryAdded = (newCategory: CategoryType) => {
    console.log("handleCategoryAdded chiamato con:", newCategory);
    globalCategoriesRef.addCategory(newCategory);
  };

  // Gestisce l'eliminazione di una categoria
  const handleCategoryDeleted = () => {
    console.log("Categoria eliminata, ricarico la lista");
    fetchCategories();
  };

  // Gestisce la modifica di una categoria
  const handleCategoryEdited = () => {
    console.log("Categoria modificata, ricarico la lista");
    fetchCategories();
  };

  return (
    <View>
      <ScrollView>
        <AddCategoryButton
          onCategoryAdded={handleCategoryAdded}
        />
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>
            <Text style={{ fontWeight: "bold" }}>Le mie categorie</Text>
          </Text>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={fetchCategories}
          >
            <Image
              source={require("../assets/refresh.png")}
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>
        </View>
        {categories && categories.length > 0
          ? categories.map((category, index) => (
              <Category
                key={`${category.id || category.name}-${index}`}
                title={category.name}
                description={category.description}
                imageUrl={category.imageUrl}
                onDelete={handleCategoryDeleted}
                onEdit={handleCategoryEdited}
              />
            ))
          : !loading && (
              <View style={styles.noCategoriesContainer}>
                <Text style={styles.noCategoriesMessage}>
                  Aggiungi la tua prima categoria per iniziare!{"\n"}
                </Text>
                <Text
                  style={[
                    styles.noCategoriesMessage,
                    { padding: 5, fontSize: 16, color: "black" },
                  ]}
                >
                  oppure{"\n"}
                </Text>
                <TouchableOpacity
                  style={[styles.reloadButton, styles.goToLoginButton]}
                  onPress={() => {
                    navigation.navigate("Login");
                  }}
                >
                  <Text style={[styles.reloadButtonText]}>Vai al login</Text>
                </TouchableOpacity>
              </View>
            )}
        {loading && (
          <View style={styles.loadingSpinner}>
            <View style={styles.spinner}></View>
          </View>
        )}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  noCategoriesContainer: {
    textAlign: "center",
    marginTop: 20,
  },
  noCategoriesMessage: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
  },
  reloadButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  goToLoginButton: {
    width: 150,
    alignSelf: "center",
  },
  reloadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingSpinner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: Dimensions.get("window").height,
  },
  spinner: {
    borderWidth: 4,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderLeftColor: "#22a6b3",
    borderRadius: 50,
    width: 40,
    height: 40,
  },
  iconButtonContainer: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 10,
  },
  headerTitle: {
    fontSize: 20,
  },
});

export default CategoryList;

// Esponiamo la funzione globale di aggiunta categoria
export const addCategoryToList = (category: CategoryType) => {
  console.log("addCategoryToList chiamata direttamente con:", category);
  globalCategoriesRef.addCategory(category);
};
