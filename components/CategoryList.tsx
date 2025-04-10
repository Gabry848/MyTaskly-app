import React, {
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { View, StyleSheet, SafeAreaView, Platform } from "react-native";
import dayjs from "dayjs";
import "dayjs/locale/it"; // Importa la locale italiana per dayjs
import { ViewModeType } from "./ViewSelector";
import ViewSelector from "./ViewSelector";
import CategoryView from "./CategoryView";
import CalendarView from "./CalendarView";

// Inizializza dayjs con la locale italiana
dayjs.locale("it");

// Definiamo l'interfaccia della categoria
export interface CategoryType {
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
  const [viewMode, setViewMode] = useState<ViewModeType>('categories');
  
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
    
    // Aggiorna le categorie globali e forza un aggiornamento
    if (!globalCategoriesRef.categories.some(
      cat => cat.id === categoryWithId.id || cat.name === categoryWithId.name
    )) {
      globalCategoriesRef.categories.push(categoryWithId);
      // Forza l'aggiornamento ricaricando le categorie
      reloadCategories();
    }
  };

  // Funzione per ricaricare le categorie
  const reloadCategories = () => {
    // Usa useImperativeHandle per esporre questa funzione
    console.log("Ricarico le categorie");
  };

  useImperativeHandle(ref, () => ({
    reloadCategories
  }));

  // Il gestore dell'aggiunta della categoria
  const handleCategoryAdded = (newCategory: CategoryType) => {
    console.log("handleCategoryAdded chiamato con:", newCategory);
    globalCategoriesRef.addCategory(newCategory);
  };

  // Gestisce l'eliminazione di una categoria
  const handleCategoryDeleted = () => {
    console.log("Categoria eliminata, ricarico la lista");
    reloadCategories();
  };

  // Gestisce la modifica di una categoria
  const handleCategoryEdited = () => {
    console.log("Categoria modificata, ricarico la lista");
    reloadCategories();
  };

  // Gestisce il cambio di modalità di visualizzazione
  const handleViewModeChange = (mode: ViewModeType) => {
    setViewMode(mode);
  };

  return (
    <View style={styles.container}>
      {/* Visualizzazione condizionale in base alla modalità selezionata */}
      <View style={styles.contentContainer}>
        {viewMode === 'categories' ? (
          <CategoryView 
            onCategoryAdded={handleCategoryAdded}
            onCategoryDeleted={handleCategoryDeleted}
            onCategoryEdited={handleCategoryEdited}
            reloadCategories={reloadCategories}
          />
        ) : (
          <CalendarView />
        )}
      </View>

      {/* Selettore di vista fisso in basso */}
      <SafeAreaView style={styles.fixedSelectorContainer}>
        <ViewSelector 
          viewMode={viewMode} 
          onViewModeChange={handleViewModeChange} 
        />
      </SafeAreaView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 70, // Aggiunge spazio nella parte inferiore per evitare che il contenuto venga nascosto dal selettore fisso
  },
  fixedSelectorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Leggero effetto traslucido
    paddingTop: 5,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10, // Più padding per iOS a causa della barra di home
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default CategoryList;

// Esponiamo la funzione globale di aggiunta categoria
export const addCategoryToList = (category: CategoryType) => {
  console.log("addCategoryToList chiamata direttamente con:", category);
  globalCategoriesRef.addCategory(category);
};
