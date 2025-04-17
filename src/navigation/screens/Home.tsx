import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Text, Dimensions, ScrollView, TouchableOpacity, Animated, StatusBar } from "react-native";
import { useNavigation, NavigationProp, useFocusEffect } from "@react-navigation/native";
import { LineChart } from "react-native-chart-kit";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import Fuse from 'fuse.js';

// Componenti esistenti
import GoToPage from "../../../components/GoToPage";
import Badge from "../../../components/Badge";
import Task from "../../../components/Task";

// Nuovi componenti
import QuickAddButton from "../../../components/QuickAddButton";
import TaskSummary from "../../../components/TaskSummary";
import CategoryOverview from "../../../components/CategoryOverview";
import SearchBar from "../../../components/SearchBar";
import CompletedTasksList from "../../../components/CompletedTasksList";
import AddTask from "../../../components/AddTask";

// Servizi
import { getLastTask, getCategories, getAllTasks } from "../../services/taskService";
import { RootStackParamList } from "../../types";

function Home() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [windowWidth, setWindowWidth] = useState(Dimensions.get("window").width);
  const [isTaskCardOpen, setIsTaskCardOpen] = useState(true);
  const [animationHeight] = useState(new Animated.Value(1));
  
  // Stati per i task
  const [recentTasks, setRecentTasks] = useState<{
    status: string;
    start_time: string; 
    title: string; 
    description: string; 
    end_time: string; 
    priority: string;
  }[]>([]);
  
  // Nuovi stati per le funzionalità aggiunte
  const [todayTasks, setTodayTasks] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [allTasks, setAllTasks] = useState<any[]>([]);

  // Stati per la ricerca con Fuse.js
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Configurazione di Fuse.js con useMemo per migliorare le prestazioni
  const fuse = useMemo(() => {
    const options = {
      keys: ['title', 'description', 'status', 'priority', 'category_name'],
      includeScore: true,
      threshold: 0.4, // Più basso = corrispondenza più precisa
      minMatchCharLength: 2
    };
    
    return new Fuse(allTasks, options);
  }, [allTasks]);

  // Carica i dati quando la schermata viene visualizzata
  useFocusEffect(
    React.useCallback(() => {
      fetchAllData();
    }, [])
  );

  // Funzione per recuperare tutti i dati necessari
  const fetchAllData = async () => {
    try {
      // Recupera i task recenti
      const lastTasks = await getLastTask(5);
      setRecentTasks(lastTasks);
      
      // Recupera le categorie
      const categoriesData = await getCategories();
      
      // Recupera tutti i task per calcolare statistiche
      const allTasksData = await getAllTasks();
      setAllTasks(allTasksData);
      
      // Calcola statistiche
      calculateTaskStatistics(allTasksData);
      
      // Prepara le categorie con il conteggio dei task
      prepareCategories(categoriesData, allTasksData);
      
      // Prepara i task completati
      prepareCompletedTasks(allTasksData);

      // Resetta la ricerca quando aggiorniamo i dati
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setIsSearching(false);
      }
    } catch (error) {
      console.error("Errore durante il recupero dei dati:", error);
    }
  };

  // Calcola le statistiche dei task
  const calculateTaskStatistics = (tasks: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    
    let todayCount = 0;
    let overdueCount = 0;
    let completedWeekCount = 0;
    
    tasks.forEach(task => {
      const taskDate = new Date(task.end_time);
      taskDate.setHours(0, 0, 0, 0);
      
      // Task di oggi
      if (taskDate.getTime() === today.getTime() && task.status !== "Completato") {
        todayCount++;
      }
      
      // Task scaduti
      if (taskDate < today && task.status !== "Completato") {
        overdueCount++;
      }
      
      // Task completati questa settimana
      if (task.status === "Completato") {
        const completedDate = new Date(task.end_time);
        if (completedDate >= oneWeekAgo && completedDate <= today) {
          completedWeekCount++;
        }
      }
    });
    
    setTodayTasks(todayCount);
    setOverdueTasks(overdueCount);
    setCompletedThisWeek(completedWeekCount);
  };

  // Prepara i dati delle categorie
  const prepareCategories = (categoriesData: any[], tasksData: any[]) => {
    if (!categoriesData || !Array.isArray(categoriesData)) {
      setCategories([]);
      return;
    }
    
    const preparedCategories = categoriesData.map(category => {
      const categoryTasks = tasksData.filter(
        task => task.category_name === category.name
      );
      
      return {
        id: category.id || category.name,
        name: category.name,
        taskCount: categoryTasks.length,
      };
    });
    
    setCategories(preparedCategories.slice(0, 4)); // Limitiamo a 4 categorie per la visualizzazione
  };

  // Prepara i task completati
  const prepareCompletedTasks = (tasksData: any[]) => {
    const completed = tasksData
      .filter(task => task.status === "Completato")
      .map(task => ({
        id: task.id,
        title: task.title,
        completedDate: task.end_time
      }))
      .sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime())
      .slice(0, 3); // Limitiamo a 3 task completati
    
    setCompletedTasks(completed);
  };

  // Gestori per le dimensioni della finestra
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(Dimensions.get("window").width);
    };

    const subscription = Dimensions.addEventListener("change", handleResize);
    return () => {
      subscription?.remove();
    };
  }, []);

  // Gestisce il toggle della card dei task
  const toggleTaskCard = () => {
    if (isTaskCardOpen) {
      Animated.timing(animationHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsTaskCardOpen(false));
    } else {
      setIsTaskCardOpen(true);
      Animated.timing(animationHeight, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  // Gestisce la ricerca con Fuse.js
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const results = fuse.search(query);
    
    // Estraiamo gli item dai risultati della ricerca
    const searchItems = results.map(result => result.item);
    
    // Ordiniamo i risultati in base alla scadenza
    searchItems.sort((a, b) => {
      return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
    });
    
    setSearchResults(searchItems);
  };

  // Gestisce la ricerca
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  // Gestisce il click su una categoria
  const handleCategoryPress = (categoryId: number | string) => {
    navigation.navigate("Categories");
  };

  // Gestisce il click su un task completato
  const handleCompletedTaskPress = (taskId: number | string) => {
    // Qui puoi implementare la logica per visualizzare i dettagli del task
    console.log(`Visualizzazione dettagli task completato: ${taskId}`);
  };

  // Gestisce il salvataggio di un nuovo task
  const handleSaveTask = (title: string, description: string, dueDate: string, priority: number) => {
    // Dopo aver salvato il task, aggiorniamo i dati
    fetchAllData();
  };

  return (
    <View style={styles.pageContainer}>
      <ScrollView style={styles.container}>
        {/* Header della pagina */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Taskly</Text>
          <Badge/>
        </View>
        
        {/* Barra di ricerca */}
        <SearchBar onSearch={handleSearch} placeholder="Cerca impegni..." />
        
        {/* Risultati della ricerca */}
        {isSearching && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>
              {searchResults.length > 0 
                ? `Trovati ${searchResults.length} risultati` 
                : "Nessun risultato trovato"}
            </Text>
            
            {searchResults.length > 0 && (
              <View>
                {searchResults.map((task, index) => (
                  <Task
                    key={`search-${task.id || index}`}
                    task={{
                      id: task.id || index,
                      title: task.title,
                      description: task.description,
                      priority: task.priority,
                      end_time: task.end_time,
                      start_time: task.start_time || "",
                      status: task.status,
                      completed: task.status === "Completato",
                    }}
                    onTaskComplete={() => fetchAllData()}
                    onTaskDelete={() => fetchAllData()}
                    onTaskEdit={() => fetchAllData()}
                  />
                ))}
              </View>
            )}
          </View>
        )}
        
        {/* Mostra il resto dell'interfaccia solo se non stiamo cercando */}
        {!isSearching && (
          <>
            {/* Riepilogo giornaliero/settimanale */}
            <TaskSummary 
              todayTasks={todayTasks} 
              overdueTasks={overdueTasks} 
              completedThisWeek={completedThisWeek} 
            />
            
            {/* Panoramica delle categorie */}
            <CategoryOverview 
              categories={categories} 
              onCategoryPress={handleCategoryPress} 
            />
            
            {/* Grafico statistiche */}
            <View style={styles.chartWrapper}>
              <Text style={styles.chartTitle}>Statistiche Mensili</Text>
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: ["G", "F", "M", "A", "M", "G"],
                    datasets: [
                      {
                        data: [20, 45, 28, 80, 99, 43],
                      },
                    ],
                  }}
                  width={windowWidth * 0.87}
                  height={200}
                  chartConfig={{
                    backgroundColor: "#ffffff",
                    backgroundGradientFrom: "#f7f7f7",
                    backgroundGradientTo: "#e1e1e1",
                    decimalPlaces: 2,
                    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: "6",
                      strokeWidth: "2",
                      stroke: "#007bff",
                    },
                  }}
                />
              </View>
            </View>
            
            {/* Task completati di recente */}
            <CompletedTasksList 
              tasks={completedTasks} 
              onTaskPress={handleCompletedTaskPress} 
            />
            
            {/* Prossimi impegni */}
            <View style={[styles.chartWrapper, { marginBottom: 20 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={[styles.chartTitle, { textAlign: "left", marginBottom: 10 }]}>
                  Prossimi impegni
                </Text>
                <TouchableOpacity onPress={toggleTaskCard} style={{ padding: 5 }}>
                  {isTaskCardOpen ? (
                    <ChevronDown size={20} color="#007bff" />
                  ) : (
                    <ChevronRight size={20} color="#007bff" />
                  )}
                </TouchableOpacity>
              </View>
              <Animated.View
                style={{
                  height: animationHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, recentTasks.length > 0 ? Math.max(recentTasks.length * 120, 200) : 80],
                  }),
                  overflow: "hidden",
                }}
              >
                {isTaskCardOpen && (
                  <View>
                    {recentTasks.length > 0 ? (
                      recentTasks.map((element, index) => (
                        <Task
                          key={index}
                          task={{
                            id: index,
                            title: element.title,
                            description: element.description,
                            priority: element.priority,
                            end_time: element.end_time,
                            start_time: element.start_time || "",
                            status: element.status || "pending",
                            completed: false,
                          }}
                          onTaskComplete={() => console.log(`Task ${index} completed`)}
                          onTaskDelete={() => console.log(`Task ${index} deleted`)}
                          onTaskEdit={() => console.log(`Task ${index} edited`)}
                        />
                      ))
                    ) : (
                      <Text style={{ padding: 5, fontSize: 16 }}>
                        Nessun impegno trovato 😔
                      </Text>
                    )}
                  </View>
                )}
              </Animated.View>
            </View>
          </>
        )}
        
        {/* Spazio per il pulsante flottante */}
        <View style={{ height: 80 }} />
      </ScrollView>
      
      {/* Pulsante di aggiunta rapida */}
      <QuickAddButton onPress={() => setShowAddTaskModal(true)} />
      
      {/* Modal per aggiungere task */}
      <AddTask 
        visible={showAddTaskModal} 
        onClose={() => setShowAddTaskModal(false)}
        onSave={handleSaveTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    width: "100%",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 30,
    paddingTop: 50,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  chartWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chartContainer: {
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  searchResultsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
    padding: 4,
  },
});

export default Home;
