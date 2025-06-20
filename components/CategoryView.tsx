import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../src/types';
import { useFocusEffect } from '@react-navigation/native';
import { getCategories } from '../src/services/taskService';
import Category from './Category';
import AddCategoryButton from './AddCategoryButton';

interface CategoryType {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string;
  category_id?: number;
  status_code?: number;
}

interface CategoryViewProps {
  onCategoryAdded: (category: CategoryType) => void;
  onCategoryDeleted: () => void;
  onCategoryEdited: () => void;
  reloadCategories: () => void;
}

const CategoryView: React.FC<CategoryViewProps> = ({
  onCategoryAdded,
  onCategoryDeleted,
  onCategoryEdited,
  reloadCategories
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
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
  return (
    <ScrollView style={styles.container}>
      {/* Header container ora più minimal */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={reloadCategories}
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
              onDelete={onCategoryDeleted}
              onEdit={onCategoryEdited}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-end", // Allinea il pulsante a destra
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 5,
    minHeight: 44, // Altezza minima per evitare che vada a capo
    flexWrap: "nowrap", // Impedisce il wrapping
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "200", // Stesso peso di Home20
    color: "#000000",
    fontFamily: "System",
    letterSpacing: -1.5,
  },
  noCategoriesContainer: {
    textAlign: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  noCategoriesMessage: {
    fontSize: 18,
    color: "#666666", // Colore più morbido
    textAlign: "center",
    fontFamily: "System",
    fontWeight: "300",
    lineHeight: 26,
  },  reloadButton: {
    backgroundColor: "#f0f0f0", // Stesso colore del send button di Home20
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20, // Stesso stile dei bottoni di Home20
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 44, // Larghezza minima per evitare problemi di layout
    minHeight: 44, // Altezza minima per evitare problemi di layout
    flexShrink: 0, // Impedisce al pulsante di ridursi
  },
  goToLoginButton: {
    width: 150,
    alignSelf: "center",
  },
  reloadButtonText: {
    color: "#000000",
    fontSize: 16,
    fontFamily: "System",
    fontWeight: "400",
  },
  loadingSpinner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: Dimensions.get("window").height * 0.6,
    paddingTop: 50,
  },
  spinner: {
    borderWidth: 3,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderLeftColor: "#000000", // Cambiato per coerenza con Home20
    borderRadius: 50,
    width: 40,
    height: 40,
  },
});

export default CategoryView;