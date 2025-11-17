import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, NavigationProp , useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../src/types';

import { getCategories } from '../src/services/taskService';
import Category from './Category';

interface CategoryType {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string;
  category_id?: number;
  status_code?: number;
  // Campi per la condivisione
  is_shared?: boolean;
  owner_id?: number;
  owner_name?: string; // Nome del proprietario (per categorie condivise)
  is_owned?: boolean;
  permission_level?: "READ_ONLY" | "READ_WRITE";
}

interface CategoryViewProps {
  onCategoryAdded: (category: CategoryType) => void;
  onCategoryDeleted: () => void;
  onCategoryEdited: () => void;
  reloadCategories: () => void;
}

interface CategoryViewRef {
  fetchCategories: (forceRefresh?: boolean) => void;
}

const CategoryView = forwardRef<CategoryViewRef, CategoryViewProps>(({
  onCategoryAdded,
  onCategoryDeleted,
  onCategoryEdited,
  reloadCategories
}, ref) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const previousCategoriesRef = React.useRef<CategoryType[]>([]);

  const categoriesAreEqual = (cat1: CategoryType[], cat2: CategoryType[]): boolean => {
    if (cat1.length !== cat2.length) return false;

    return cat1.every(c1 =>
      cat2.some(c2 =>
        c1.id === c2.id &&
        c1.name === c2.name &&
        c1.description === c2.description &&
        c1.category_id === c2.category_id
      )
    );
  };

  const fetchCategories = async (forceRefresh: boolean = false) => {
    try {
      const categoriesData = await getCategories(!forceRefresh);
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

  const reloadCategoriesAsync = async () => {
    setIsReloading(true);
    setCategories([]); // Nasconde tutte le categorie
    try {
      const categoriesData = await getCategories(false); // Force refresh
      if (Array.isArray(categoriesData)) {
        // Confronta le categorie con le precedenti
        if (!categoriesAreEqual(categoriesData, previousCategoriesRef.current)) {
          setCategories(categoriesData);
          previousCategoriesRef.current = categoriesData;
          console.log("Categorie aggiornate - differenze rilevate");
        } else {
          // Se non ci sono differenze, mostra comunque le categorie
          setCategories(categoriesData);
          console.log("Categorie ricaricate - nessuna differenza");
        }
      } else {
        console.error("getCategories non ha restituito un array:", categoriesData);
      }
    } catch (error) {
      console.error("Errore nel ricaricamento delle categorie:", error);
      // Ripristina le categorie precedenti in caso di errore
      setCategories(previousCategoriesRef.current);
    } finally {
      setIsReloading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // Al focus, ricarica le categorie in modo asincrono
      reloadCategoriesAsync();
    }, [])
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  // Esponi fetchCategories tramite ref
  useImperativeHandle(ref, () => ({
    fetchCategories
  }));

  return (
    <ScrollView style={styles.container}>
      {/* Header container con pulsante ricarica */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => reloadCategoriesAsync()}
          disabled={isReloading}
        >
          <Icon
            name="refresh"
            size={24}
            color={isReloading ? "#cccccc" : "#000000"}
          />
        </TouchableOpacity>
      </View>
      {/* Mostra le categorie solo se non stiamo ricaricando */}
      {!isReloading && categories && categories.length > 0
        ? categories.map((category, index) => (
            <Category
              key={`${category.id || category.name}-${index}`}
              title={category.name}
              description={category.description}
              imageUrl={category.imageUrl}
              categoryId={category.category_id || category.id}
              isShared={category.is_shared}
              isOwned={category.is_owned}
              ownerName={category.owner_name}
              permissionLevel={category.permission_level}
              onDelete={onCategoryDeleted}
              onEdit={onCategoryEdited}
            />
          ))
        : !loading && !isReloading && (
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
      {(loading || isReloading) && (
        <View style={styles.loadingSpinner}>
          <View style={styles.spinner}></View>
        </View>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-end", // Allinea il pulsante a destra
    alignItems: "center",
    marginTop: 5,
    marginBottom: 5,
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
  },
  reloadButton: {
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
  refreshButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 20,
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
    minWidth: 44,
    minHeight: 44,
  },
});

CategoryView.displayName = 'CategoryView';

export default CategoryView;