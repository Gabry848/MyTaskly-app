import React, { Fragment } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import Section from "../../../components/Section";
import data from "../../../data/data.json";

type DataType = {
  macchina: { title: string; image: string; descrizione: string; importanza: number; scadenza: string; }[];
  casa: { title: string; image: string; descrizione: string; importanza: number; scadenza: string; }[];
  categoria3: { title: string; image: string; descrizione: string; importanza: number; scadenza: string; }[];
};

const typedData: DataType = data;


const Category = () => { 
  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
          <Text style={styles.title}>Aggiungi una nuova attività</Text>
        <Image
          source={{
            uri: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWxpc3QtdG9kbyI+PHJlY3QgeD0iMyIgeT0iNSIgd2lkdGg9IjYiIGhlaWdodD0iNiIgcng9IjEiLz48cGF0aCBkPSJtMyAxNyAyIDIgNC00Ii8+PHBhdGggZD0iTTEzIDZoOCIvPjxwYXRoIGQ9Ik0xMyAxMmg4Ii8+PHBhdGggZD0iTTEzIDE4aDgiLz48L3N2Zz4=",
          }}
          style={styles.image}
        />
      </View>
      {Object.keys(data).map((key) => (
        <Section
          key={key}
          lista={data[key as keyof DataType]}
          image="https://picsum.photos/200/300"
          category={key}
        />
      ))}
    </ScrollView>
  );
};

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
    color: "white",
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
});

export default Category;
