import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';

interface SectionProps {
  category: string;
  image: string;
  lista: Lista[];
}

type CardListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CardList'>;

const Section: React.FC<SectionProps> = ({ category, image, lista }) => {
  const navigation = useNavigation<CardListScreenNavigationProp>();
  console.log("lista da section.tsx:", lista);

  return (
    <TouchableOpacity
      style={styles.view}
      onPress={() => {
        console.log("cliccato su:", category);
        navigation.navigate("CardList", { lista });
      }}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} />
      </View>

      <View style={styles.categoryContainer}>
        <Text style={styles.add}>{category}</Text>
        <Text style={styles.title}>✅ 10 cose da fare</Text>{" "}
        {/*//TODO: add a automate counter*/}
      </View>

      <View style={styles.controlsContainer}>ciao</View>
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

export default Section;
