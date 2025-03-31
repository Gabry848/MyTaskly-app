import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { getCategories } from "../src/services/taskService";
import Category from "./Category"; // Importa il componente Category
import AddCategoryButton from "./AddCategoryButton"; // Importa il componente AddCategoryButton
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

interface CategoryType {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string; // Aggiungi l'URL dell'immagine
}

const CategoryList = forwardRef((props, ref) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCategories = async () => {
    try {
      const categories = await getCategories();
      setCategories(categories);
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

  useImperativeHandle(ref, () => ({
    reloadCategories: () => {
      setLoading(true);
      fetchCategories();
    },
  }));

  const onCategoryAddedEvent = (taskName) => {
    console.log("Nuova categoria aggiunta:", taskName); // Log per debug
    fetchCategories(); // Ricarica le categorie dopo l'aggiunta
  };

  // Gestisce l'eliminazione di una categoria
  const handleCategoryDeleted = () => {
    console.log("Categoria eliminata, ricarico la lista"); // Log per debug
    fetchCategories(); // Ricarica le categorie dopo l'eliminazione
  };

  // Gestisce la modifica di una categoria
  const handleCategoryEdited = () => {
    console.log("Categoria modificata, ricarico la lista"); // Log per debug
    fetchCategories(); // Ricarica le categorie dopo la modifica
  };

  return (
    <View>
      <ScrollView>
        <AddCategoryButton
          onCategoryAdded={(newCategory) => {
            console.log("Nuova categoria aggiunta:", newCategory); // Log per debug
            onCategoryAddedEvent(newCategory); // Passa la nuova categoria al gestore dell'evento
          }}
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
                key={category.id ?? index}
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
                <Text style={[styles.noCategoriesMessage, {padding: 5, fontSize: 16, color: "black"}]}>
                oppure{"\n"}
                </Text>
                <TouchableOpacity
                  style={[styles.reloadButton, styles.goToLoginButton]}
                  onPress={() => {
                    navigation.navigate("Login"); // Naviga alla schermata di login
                  }}
                >
                  <Text
                    style={[styles.reloadButtonText]}
                  >
                    Vai al login
                  </Text>
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
    alignSelf: "center"
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
