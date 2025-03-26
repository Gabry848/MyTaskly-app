import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import GoToPage from "../../../components/GoToPage";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types";
import { LineChart } from "react-native-chart-kit"; // Rimuovi BarChart
import Badge from "../../../components/Badge";

function HomePage() {
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
        <Text style={styles.title}>Le mie statistiche</Text>
        <View style={styles.chartsContainer}>
          <View style={styles.chartWrapper}>
            <LineChart
              data={{
                labels: ["J", "F", "M", "A", "M", "J"],
                datasets: [
                  {
                    data: [20, 45, 28, 80, 99, 43],
                  },
                ],
              }}
              width={windowWidth * 0.9} // Modifica la larghezza per occupare più spazio
              height={200}
              chartConfig={{
                backgroundColor: "#1e2923",
                backgroundGradientFrom: "#08130d",
                backgroundGradientTo: "#1e2923",
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              style={{
                borderRadius: 16,
                padding: 10,
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
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  container: {
    width: "100%",
    height: "100%",
  },
  rect: {
    width: "100%",
    height: "100%",
    backgroundColor: "red",
  },
  rect2: {
    marginTop: 20,
  },
  chartsContainer: {
    flexDirection: "row",
    justifyContent: "center", // Centra il grafico
    marginTop: 10,
    width: "100%",
  },
  chartWrapper: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    backgroundColor: "#a0efe3",
    marginHorizontal: 5,
  },
  title: {
    fontSize: 30,
    padding: 10,
  },
  statistics: {
    paddingTop: 20,
    paddingBottom: 20,
  },
});

export default HomePage;
