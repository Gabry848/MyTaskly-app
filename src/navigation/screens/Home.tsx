import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Dimensions, ScrollView, TouchableOpacity, Animated, StatusBar } from "react-native";
import GoToPage from "../../../components/GoToPage";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types";
import { LineChart } from "react-native-chart-kit";
import Badge from "../../../components/Badge";
import Task from "../../../components/Task";
import { getLastTask } from "../../services/taskService";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import { useFocusEffect } from '@react-navigation/native';


function Home() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [tasks, setTasks] = useState<
    { title: string; description: string; end_time: string; priority: string }[]
  >([]);
  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const [isTaskCardOpen, setIsTaskCardOpen] = useState(true);
  const [animationHeight] = useState(new Animated.Value(1)); // Inizializzato a 1 invece di 0


  useFocusEffect(
    React.useCallback(() => {
        // riprendi i task piu` recenti, quando la schermata viene visualizzata
        const fetchTasks = async () => {
          const lastTasks = await getLastTask(5); // Assuming getLastTask takes a number as an argument
          setTasks(lastTasks);
        }
        fetchTasks();
    }, [])
  );

  useEffect(() => {
    const fetchTasks = async () => {
      const lastTasks = await getLastTask(5); // Assuming getLastTask takes a number as an argument
      setTasks(lastTasks);
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(Dimensions.get("window").width);
    };

    const subscription = Dimensions.addEventListener("change", handleResize);
    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      const lastTasks = await getLastTask(5); // Assuming getLastTask takes a number as an argument
      setTasks(lastTasks);
    };

    fetchTasks();
  }, []);

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Taskly</Text>
        <Badge/>
      </View>
      <View style={styles.statistics}>
        <View style={styles.chartWrapper}>
          <Text style={styles.chartTitle}>Statistiche Mensili</Text>{" "}
          {/* Titolo del grafico */}
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: ["J", "F", "M", "A", "M", "J"],
                datasets: [
                  {
                    data: [20, 45, 28, 80, 99, 43],
                  },
                ],
              }}
              width={windowWidth * 0.87} // Adjusted width to take more space
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
      </View>
      <View style={[styles.chartWrapper, { marginBottom: 20 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text
            style={[styles.chartTitle, { textAlign: "left", marginBottom: 10 }]}
          >
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
              outputRange: [0, tasks.length > 0 ? Math.max(tasks.length * 120, 200) : 80], // Aumentato il moltiplicatore e il valore minimo
            }),
            overflow: "hidden",
          }}
        >
          {isTaskCardOpen && (
            <View>
              {tasks.length > 0 ? (
                tasks.map((element, index) => (
                  <Task
                    key={index}  // Aggiungo key per evitare avvisi React
                    task={{
                      id: index,
                      title: element.title,
                      description: element.description,
                      priority: element.priority,
                      end_time: element.end_time,
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
      <View style={styles.rect2}>
        <GoToPage
          text="La mia giornata"
          onPress={() => navigation.navigate("Categories")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 30,
    paddingTop: 50,
    backgroundColor: "#F9c9F9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 15, // Aggiunto margine inferiore
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  container: {
    width: "100%",
    height: "100%",
  },
  rect2: {
    marginTop: 0,
    marginBottom: 20,
  },
  chartWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    marginHorizontal: 10,
  },
  chartContainer: {
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 20,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  statistics: {
    paddingBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default Home;
