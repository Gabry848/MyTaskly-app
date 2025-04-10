import React, {
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { View, StyleSheet } from "react-native";
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
      {/* Selettore per passare dalla visualizzazione categorie a calendario */}
      <ViewSelector 
        viewMode={viewMode} 
        onViewModeChange={handleViewModeChange} 
      />

      {/* Visualizzazione condizionale in base alla modalità selezionata */}
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
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default CategoryList;

// Esponiamo la funzione globale di aggiunta categoria
export const addCategoryToList = (category: CategoryType) => {
  console.log("addCategoryToList chiamata direttamente con:", category);
  globalCategoriesRef.addCategory(category);
};
