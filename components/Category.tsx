import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../src/types';

type CategoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'TaskList'
>;

interface CategoryProps {
  title: string;
  imageUrl?: string;
}

const Category: React.FC<CategoryProps> = ({ title, imageUrl }) => {
  const navigation = useNavigation<CategoryScreenNavigationProp>();
  
  return (
    <TouchableOpacity
      style={styles.view}
      onPress={() => {
        console.log("Navigating to TaskList");
        navigation.navigate("TaskList", { category_name: title });
      }}
    >
      <View style={styles.imageContainer}>
        {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}
      </View>

      <View style={styles.categoryContainer}>
        <Text style={styles.add}>{title}</Text>
        <Text style={styles.title}>✅ 10 cose da fare</Text>
        {/*//TODO: add an automate counter*/}
      </View>

      <View style={styles.controlsContainer}>
        <Text>add task</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  view: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    padding: 10,
    margin: 10,
    borderColor: "rgba(0, 0, 0, 0)",
    borderRadius: 10,
  },
  imageContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 40,
    height: 50,
    borderRadius: 10,
    backgroundColor: "rgba(11, 148, 153, 0.41)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: 30,
    height: 40,
    borderRadius: 25,
    marginStart: 5,
    marginBottom: 5,
    marginTop: 5,
  },
  add: {
    fontSize: 20,
    fontWeight: "bold",
    padding: 5,
  },
  title: {
    fontSize: 14,
    fontStyle: "italic",
    color: "gray",
    paddingStart: 5,
    paddingBottom: 5,
  },
  categoryContainer: {
    width: "40%",
    backgroundColor: "white",
    borderColor: "rgba(0, 0, 0, 0)",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlsContainer: {
    width: "40%",
    height: 60,
    backgroundColor: "white",
    borderColor: "rgba(0, 0, 0, 0)",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  addImage: {
    width: 20,
    height: 20,
    margin: 5,
    paddingStart: 10,
  },
});

export default Category;
