import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { View, StyleSheet, SafeAreaView, Platform } from "react-native";
import dayjs from "dayjs";
import "dayjs/locale/it"; // Importa la locale italiana per dayjs
import { ViewModeType } from "./ViewSelector";
import ViewSelector from "./ViewSelector";
import CategoryView from "./CategoryView";
import CalendarView from "./CalendarView";
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
  const [viewMode, setViewMode] = useState<ViewModeType>('categories');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Forza l'aggiornamento del componente
  const refreshComponent = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  // Configura i listener per gli eventi globali
  useEffect(() => {
    // Aggiungi listener per gli eventi delle categorie
    const categoryAddedListener = () => {
      console.log("Evento CATEGORY_ADDED ricevuto, aggiornamento vista");
      refreshComponent();
    };
    
    const categoryUpdatedListener = () => {
      console.log("Evento CATEGORY_UPDATED ricevuto, aggiornamento vista");
      refreshComponent();
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
    refreshComponent();
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
    refreshComponent();
  };

  const handleCategoryEdited = () => {
    console.log("Categoria modificata, aggiornamento vista");
    refreshComponent();
  };

  // Gestisce il cambio di modalità di visualizzazione
  const handleViewModeChange = (mode: ViewModeType) => {
    setViewMode(mode);
  };

  return (
    <View style={styles.container} key={refreshKey}>
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
    backgroundColor: "#ffffff", // Cambiato da #fff a #ffffff per coerenza
    display: "flex",
    flexDirection: "column",
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 70,
  },
  fixedSelectorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)', // Leggermente più opaco per coerenza
    paddingTop: 15, // Aumentato per dare più respiro
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9', // Stesso colore del bordo dell'input di Home20
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4, // Aumentato per coerenza con Home20
    },
    shadowOpacity: 0.08, // Stesso valore di Home20
    shadowRadius: 12, // Stesso valore di Home20
    elevation: 3, // Stesso valore di Home20
  },
});

export default CategoryList;
