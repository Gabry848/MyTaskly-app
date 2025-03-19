import React from "react";
import { View, StyleSheet } from "react-native";
import GoToPage from "../../../components/GoToPage";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rect: {
    width: 100,
    height: 100,
    backgroundColor: "red",
  },
  rect2: {
    width: 100,
    height: 100,
    backgroundColor: "blue",
  },
});

function HomePage() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <View style={styles.rect}></View>
      <View style={styles.rect2}>
        <GoToPage
          text="Le mie categorie"
          onPress={() => navigation.navigate("Categories")}
        />
      </View>
    </View>
  );
}

export default HomePage;
