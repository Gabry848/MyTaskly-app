import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { View, StyleSheet } from "react-native";
import dayjs from "dayjs";
import "dayjs/locale/it"; // Importa la locale italiana per dayjs
import CategoryView from "./CategoryView";
import globalEventEmitter, { EVENTS } from "../src/utils/eventEmitter";

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

const CategoryList = forwardRef((props, ref) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const categoryViewRef = React.useRef<{ fetchCategories: () => void } | null>(null);

  // Forza l'aggiornamento del componente e ricarica dal server
  const refreshComponent = () => {
    setRefreshKey(prevKey => prevKey + 1);
    // Se abbiamo il ref di CategoryView, chiamiamo il fetch
    if (categoryViewRef.current && categoryViewRef.current.fetchCategories) {
      categoryViewRef.current.fetchCategories();
    }
  };
  
  // Configura i listener per gli eventi globali
  useEffect(() => {
    // Aggiungi listener per gli eventi delle categorie
    const categoryAddedListener = () => {
      console.log("Evento CATEGORY_ADDED ricevuto, aggiornamento vista");
      // Forza il ricaricamento delle categorie dal server per mostrare immediatamente la nuova categoria
      if (categoryViewRef.current && categoryViewRef.current.fetchCategories) {
        categoryViewRef.current.fetchCategories(true);
      }
    };
    
    const categoryUpdatedListener = () => {
      console.log("Evento CATEGORY_UPDATED ricevuto, aggiornamento vista");
      // Forza il ricaricamento delle categorie dal server per mostrare i cambiamenti
      if (categoryViewRef.current && categoryViewRef.current.fetchCategories) {
        categoryViewRef.current.fetchCategories(true);
      }
    };
    
    const categoryDeletedListener = () => {
      console.log("Evento CATEGORY_DELETED ricevuto, aggiornamento vista");
      refreshComponent();
    };

    // Aggiungi i listener all'EventEmitter
    globalEventEmitter.addListener(EVENTS.CATEGORY_ADDED, categoryAddedListener);
    globalEventEmitter.addListener(EVENTS.CATEGORY_UPDATED, categoryUpdatedListener);
    globalEventEmitter.addListener(EVENTS.CATEGORY_DELETED, categoryDeletedListener);
    
    // Rimuovi i listener quando il componente viene smontato
    return () => {
      globalEventEmitter.removeListener(EVENTS.CATEGORY_ADDED, categoryAddedListener);
      globalEventEmitter.removeListener(EVENTS.CATEGORY_UPDATED, categoryUpdatedListener);
      globalEventEmitter.removeListener(EVENTS.CATEGORY_DELETED, categoryDeletedListener);
    };
  }, []);

  // Funzione per ricaricare le categorie (esposta tramite ref)
  const reloadCategories = () => {
    console.log("Ricarico le categorie");
    // Chiama direttamente fetchCategories invece di refreshComponent
    if (categoryViewRef.current && categoryViewRef.current.fetchCategories) {
      categoryViewRef.current.fetchCategories();
    }
  };

  // Esponi la funzione reloadCategories tramite ref
  useImperativeHandle(ref, () => ({
    reloadCategories
  }));
  // Il gestore dell'aggiunta della categoria
  const handleCategoryAdded = (newCategory: CategoryType) => {
    console.log("handleCategoryAdded chiamato con:", newCategory);
    // Non abbiamo più bisogno di gestire manualmente l'aggiunta,
    // poiché ora utilizziamo l'EventEmitter
  };

  // Gestori per l'editing e la cancellazione delle categorie
  const handleCategoryDeleted = () => {
    console.log("Categoria eliminata, aggiornamento vista");
    // Forza il ricaricamento delle categorie dal server per aggiornare immediatamente la vista
    if (categoryViewRef.current && categoryViewRef.current.fetchCategories) {
      categoryViewRef.current.fetchCategories(true);
    }
  };

  const handleCategoryEdited = () => {
    console.log("Categoria modificata, aggiornamento vista");
    refreshComponent();
  };

  return (
    <View style={styles.container} key={refreshKey}>
      <CategoryView
        ref={categoryViewRef}
        onCategoryAdded={handleCategoryAdded}
        onCategoryDeleted={handleCategoryDeleted}
        onCategoryEdited={handleCategoryEdited}
        reloadCategories={reloadCategories}
      />
    </View>
  );
});

CategoryList.displayName = 'CategoryList';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});

export default CategoryList;
