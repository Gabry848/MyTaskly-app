import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import AddTask from "../../../components/AddTaskButton";
import Badge from "../../../components/Badge"; // nuovo import
import { useNavigation } from "@react-navigation/native"; // nuovo import
import * as authService from "../../services/authService";
import AddCategoryButton from "../../../components/AddCategoryButton"; // nuovo import
import CategoryList from "../../../components/CategoryList"; // nuovo import

export function Home() {
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
      <View style={styles.imageContainer}>
        <Text style={styles.title}>Aggiungi una nuova attività</Text>
        <Image
          source={{
            uri: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJrZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtbGlzdC10b2RvIj48cmVjdCB4PSIzIiB5PSI1IiB3aWR0aD0iNiIgaGVpZ2h0PSI2IiByeD0iMSIvPjxwYXRoIGQ9Im0zIDE3IDIgMiA0LTRoIi8+PHBhdGggZD0iTTEzIDZoOCIvPjxwYXRoIGQ9Ik0xMyAxMmg4Ii8+PHBhdGggZD0iTTEzIDE4aDgiLz48L3N2Zz4=",
          }}
          style={styles.image}
        />
      </View>
      <ScrollView style={styles.container}>
        <CategoryList ref={categoryListRef} />
      </ScrollView>
      {/* <AddTask
        onSave={(
          title: string,
          description: string,
          dueDate: string,
          priority: number
        ) => {
          console.log(title, description, dueDate, priority);
        }}
      /> */}
      <AddCategoryButton onCategoryAdded={handleCategoryAdded} /> {/* Aggiungi il nuovo componente qui */}
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
