import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import { getCategories, getTasks, Task } from "../src/services/taskService";
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
  Switch,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../src/types";
import dayjs from "dayjs";
import "dayjs/locale/it"; // Importa la locale italiana per dayjs
import { Ionicons } from "@expo/vector-icons";

// Inizializza dayjs con la locale italiana
dayjs.locale("it");

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
  const [viewMode, setViewMode] = useState<'categories' | 'calendar'>('categories');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  
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

  // Funzione per caricare gli impegni
  const fetchTasks = useCallback(async () => {
    try {
      const tasksData = await getTasks();
      if (Array.isArray(tasksData)) {
        setTasks(tasksData);
      }
    } catch (error) {
      console.error("Errore nel recupero degli impegni:", error);
    }
  }, []);

  // Carica gli impegni quando cambia la modalità di visualizzazione
  useEffect(() => {
    if (viewMode === 'calendar') {
      fetchTasks();
    }
  }, [viewMode, fetchTasks]);

  // Aggiorna gli impegni quando la schermata riceve il focus
  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'calendar') {
        fetchTasks();
      }
    }, [viewMode, fetchTasks])
  );

  // Gruppo gli impegni per data
  const groupTasksByDate = () => {
    const groupedTasks: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      const taskDate = task.start_time ? 
        dayjs(task.start_time).format('YYYY-MM-DD') : 
        dayjs().format('YYYY-MM-DD');
        
      if (!groupedTasks[taskDate]) {
        groupedTasks[taskDate] = [];
      }
      
      groupedTasks[taskDate].push(task);
    });
    
    return groupedTasks;
  };
  
  // Ottengo gli impegni per la data selezionata
  const getTasksForSelectedDate = () => {
    const groupedTasks = groupTasksByDate();
    return groupedTasks[selectedDate] || [];
  };
  
  // Genero i giorni per il calendario
  const generateCalendarDays = () => {
    const daysInMonth = dayjs(selectedDate).daysInMonth();
    const currentMonth = dayjs(selectedDate).month();
    const currentYear = dayjs(selectedDate).year();
    const firstDayOfMonth = dayjs(`${currentYear}-${currentMonth + 1}-01`).day();
    
    const days = [];
    
    // Aggiungo giorni vuoti per allineare il calendario al primo giorno della settimana
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ date: null, day: '' });
    }
    
    // Aggiungo i giorni del mese
    for (let i = 1; i <= daysInMonth; i++) {
      const date = dayjs(`${currentYear}-${currentMonth + 1}-${i}`).format('YYYY-MM-DD');
      days.push({
        date,
        day: i.toString(),
        hasTask: groupTasksByDate()[date]?.length > 0
      });
    }
    
    return days;
  };
  
  // Navigo al mese precedente
  const goToPreviousMonth = () => {
    const newDate = dayjs(selectedDate).subtract(1, 'month').format('YYYY-MM-DD');
    setSelectedDate(newDate);
  };
  
  // Navigo al mese successivo
  const goToNextMonth = () => {
    const newDate = dayjs(selectedDate).add(1, 'month').format('YYYY-MM-DD');
    setSelectedDate(newDate);
  };
  
  // Seleziono una data specifica
  const selectDate = (date: string | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Renderizza una task card modterna
  const renderTaskCard = (task: Task) => {
    // Determina il colore in base alla priorità
    const priorityColors: Record<string, string> = {
      'Alta': '#ff6b6b',
      'Media': '#feca57',
      'Bassa': '#1dd1a1',
      'default': '#54a0ff'
    };
    
    const cardColor = task.priority ? 
      priorityColors[task.priority] || priorityColors.default : 
      priorityColors.default;
      
    return (
      <TouchableOpacity
        key={task.id}
        style={[styles.taskCard, { borderLeftColor: cardColor, borderLeftWidth: 5 }]}
        onPress={() => {
          // Qui puoi gestire il tap sulla card per visualizzare i dettagli
          console.log("Task selezionato:", task);
        }}
      >
        <View style={styles.taskCardContent}>
          <Text style={styles.taskTitle} numberOfLines={1} ellipsizeMode="tail">
            {task.title}
          </Text>
          
          {task.description ? (
            <Text style={styles.taskDescription} numberOfLines={2} ellipsizeMode="tail">
              {task.description}
            </Text>
          ) : null}
          
          <View style={styles.taskMetadata}>
            {task.category_name ? (
              <View style={styles.taskCategory}>
                <Text style={styles.taskCategoryText}>
                  {task.category_name}
                </Text>
              </View>
            ) : null}
            
            <View style={styles.taskStatus}>
              <Text style={[
                styles.taskStatusText, 
                { color: task.status === 'Completato' ? '#1dd1a1' : '#ff6b6b' }
              ]}>
                {task.status}
              </Text>
            </View>
          </View>
          
          {task.start_time || task.end_time ? (
            <View style={styles.taskTimeInfo}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.taskTimeText}>
                {task.start_time ? dayjs(task.start_time).format('HH:mm') : '--:--'}
                {task.end_time ? ' - ' + dayjs(task.end_time).format('HH:mm') : ''}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Selettore per passare dalla visualizzazione categorie a calendario */}
      <View style={styles.viewSelectorContainer}>
        <TouchableOpacity
          style={[
            styles.viewSelectorButton,
            viewMode === 'categories' && styles.viewSelectorButtonActive
          ]}
          onPress={() => setViewMode('categories')}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={viewMode === 'categories' ? "#fff" : "#007bff"} 
          />
          <Text style={[
            styles.viewSelectorText,
            viewMode === 'categories' && styles.viewSelectorTextActive
          ]}>Categorie</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.viewSelectorButton,
            viewMode === 'calendar' && styles.viewSelectorButtonActive
          ]}
          onPress={() => setViewMode('calendar')}
        >
          <Ionicons 
            name="calendar" 
            size={20} 
            color={viewMode === 'calendar' ? "#fff" : "#007bff"} 
          />
          <Text style={[
            styles.viewSelectorText,
            viewMode === 'calendar' && styles.viewSelectorTextActive
          ]}>Calendario</Text>
        </TouchableOpacity>
      </View>

      {/* Visualizzazione Categorie */}
      {viewMode === 'categories' ? (
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
      ) : (
        /* Visualizzazione Calendario */
        <View style={styles.calendarContainer}>
          {/* Intestazione del calendario con navigazione */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth}>
              <Ionicons name="chevron-back" size={24} color="#007bff" />
            </TouchableOpacity>
            
            <Text style={styles.calendarMonthTitle}>
              {dayjs(selectedDate).format('MMMM YYYY')}
            </Text>
            
            <TouchableOpacity onPress={goToNextMonth}>
              <Ionicons name="chevron-forward" size={24} color="#007bff" />
            </TouchableOpacity>
          </View>
          
          {/* Giorni della settimana */}
          <View style={styles.weekdaysRow}>
            {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day, index) => (
              <Text key={index} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>
          
          {/* Griglia del calendario */}
          <View style={styles.calendarGrid}>
            {generateCalendarDays().map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  day.date === selectedDate && styles.selectedDay,
                  day.hasTask && styles.dayWithTask,
                  !day.date && styles.emptyDay
                ]}
                onPress={() => selectDate(day.date)}
                disabled={!day.date}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    day.date === selectedDate && styles.selectedDayText,
                    day.hasTask && styles.dayWithTaskText
                  ]}
                >
                  {day.day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Lista degli impegni per la data selezionata */}
          <View style={styles.selectedDateHeader}>
            <Text style={styles.selectedDateTitle}>
              Impegni del {dayjs(selectedDate).format('DD MMMM YYYY')}
            </Text>
          </View>
          
          <ScrollView style={styles.taskList}>
            {getTasksForSelectedDate().length > 0 ? (
              getTasksForSelectedDate().map((task) => renderTaskCard(task))
            ) : (
              <View style={styles.noTasksContainer}>
                <Ionicons name="calendar-outline" size={50} color="#ccc" />
                <Text style={styles.noTasksText}>
                  Nessun impegno per questa data
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  viewSelectorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  viewSelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007bff",
    marginHorizontal: 5,
  },
  viewSelectorButtonActive: {
    backgroundColor: "#007bff",
  },
  viewSelectorText: {
    marginLeft: 5,
    color: "#007bff",
  },
  viewSelectorTextActive: {
    color: "#fff",
  },
  calendarContainer: {
    flex: 1,
    padding: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    color: "#007bff",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  calendarDayText: {
    fontSize: 16,
  },
  selectedDay: {
    backgroundColor: "#007bff",
    borderRadius: 20,
  },
  selectedDayText: {
    color: "#fff",
  },
  dayWithTask: {
    borderColor: "#007bff",
    borderWidth: 1,
    borderRadius: 20,
  },
  dayWithTaskText: {
    color: "#007bff",
  },
  emptyDay: {
    backgroundColor: "transparent",
  },
  selectedDateHeader: {
    marginTop: 10,
    marginBottom: 5,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  taskList: {
    flex: 1,
  },
  noTasksContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  noTasksText: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 10,
  },
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  taskCardContent: {
    flexDirection: "column",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  taskDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  taskMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  taskCategory: {
    backgroundColor: "#f1f1f1",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  taskCategoryText: {
    fontSize: 12,
    color: "#666",
  },
  taskStatus: {
    backgroundColor: "#f1f1f1",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  taskStatusText: {
    fontSize: 12,
  },
  taskTimeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskTimeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
});

export default CategoryList;

// Esponiamo la funzione globale di aggiunta categoria
export const addCategoryToList = (category: CategoryType) => {
  console.log("addCategoryToList chiamata direttamente con:", category);
  globalCategoriesRef.addCategory(category);
};
