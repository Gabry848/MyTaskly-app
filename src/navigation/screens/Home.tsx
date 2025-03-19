import React, { useRef } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";

import Badge from "../../../components/Badge"; // nuovo import
import { useNavigation } from "@react-navigation/native"; // nuovo import
import AddCategoryButton from "../../../components/AddCategoryButton"; // nuovo import
import CategoryList from "../../../components/CategoryList"; // nuovo import
import { Button } from "react-native";

export default function Home() {
  const navigation = useNavigation();
  const categoryListRef = useRef<{ reloadCategories: () => void } | null>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "Home",
      headerRight: () => <Badge letter="U" />,
    });
  }, [navigation]);

  const handleCategoryAdded = () => {
    if (categoryListRef.current) {
      categoryListRef.current.reloadCategories();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Taskly</Text>
        <Badge letter="A" /> 
      </View>
      <ScrollView style={styles.container}>
        <CategoryList ref={categoryListRef} />
      </ScrollView>
      <AddCategoryButton onCategoryAdded={handleCategoryAdded} />
      <Button
        title="Go to Home"
        onPress={() => navigation.navigate("HomePage")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(245, 245, 245, 0.8)", // semi-transparent background
    // backgroundImage:
    //   "linear-gradient(45deg,rgb(255, 255, 255),rgb(49, 200, 238))", // light blue color added
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
    marginStart: "10%",
    marginTop: "10%",
    flexWrap: "wrap",
    width: "45%",
    lineHeight: 40, // added line height for spacing between lines
    color: "black",
  },
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
  imageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 20, // rounded corners
    borderWidth: 2,
    borderColor: "white",
    marginLeft: 20, // added margin to separate the image from the text
    marginEnd: 20,
    marginTop: 30,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  feedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
  badgeStyle: {
    marginLeft: 10, // Spazio tra il testo e il badge
  },
  logoutButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "lightblue",
    borderRadius: 5,
  },
});
