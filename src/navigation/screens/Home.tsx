import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import GoToPage from "../../../components/GoToPage";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types";
import { LineChart } from "react-native-chart-kit";
import Badge from "../../../components/Badge";

function Home() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(Dimensions.get("window").width);
    };

    const subscription = Dimensions.addEventListener("change", handleResize);
    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Taskly</Text>
        <Badge letter="A" />
      </View>
      <View style={styles.statistics}>
        <View style={styles.chartWrapper}>
          <Text style={styles.chartTitle}>Statistiche Mensili</Text> {/* Titolo del grafico */}
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
      <View style={styles.rect2}>
        <GoToPage
          text="Le mie categorie"
          onPress={() => navigation.navigate("Categories")}
        />
        <GoToPage
          text="La mia giornata"
          onPress={() => navigation.navigate("Categories")}
        />
        <GoToPage
          text="Appunti rapidi"
          onPress={() => navigation.navigate("Categories")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 30,
    paddingTop: 35,
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
    marginTop: 20,
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
