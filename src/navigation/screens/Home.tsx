import React, { Fragment } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import Section from "../../../components/Section";
import AddTask from "../../../components/AddTaskButton";
import Badge from "../../../components/Badge"; // nuovo import
import { useNavigation } from "@react-navigation/native"; // nuovo import
//import data from "../../../data/data.json";

import axios from 'axios';

type DataType = {
  macchina: {
    title: string;
    image: string;
    descrizione: string;
    importanza: number;
    scadenza: string;
  }[];
  casa: {
    title: string;
    image: string;
    descrizione: string;
    importanza: number;
    scadenza: string;
  }[];
  categoria3: {
    title: string;
    image: string;
    descrizione: string;
    importanza: number;
    scadenza: string;
  }[];
};

const data = {
  macchina: [
    {
      title: "Task 1",
      image: "https://picsum.photos/200/300",
      descrizione: "Descrizione 100 🙃🙃",
      importanza: 3,
      scadenza: "2021-08-01",
    },
    {
      title: "Task 2",
      image: "https://picsum.photos/200/300",
      descrizione: "Descrizione 2",
      importanza: 2,
      scadenza: "2021-08-02",
    },
    {
      title: "Task 3",
      image: "https://picsum.photos/200/300",
      descrizione: "Descrizione 3",
      importanza: 1,
      scadenza: "2021-08-03",
    },
  ],
  casa: [
    {
      title: "Bollo macchina",
      image: "https://picsum.photos/200/300",
      descrizione: "pagare il bollo della macchina",
      importanza: 3,
      scadenza: "2021-08-04",
    },
    {
      title: "Task 4",
      image: "https://picsum.photos/200/300",
      descrizione: "Descrizione 4",
      importanza: 3,
      scadenza: "2021-08-04",
    },
    {
      title: "Task 6",
      image: "https://picsum.photos/200/300",
      descrizione: "Descrizione 6",
      importanza: 1,
      scadenza: "2021-08-06",
    },
  ],
  categoria3: [
    {
      title: "Task 7",
      image: "https://picsum.photos/200/300",
      descrizione: "Descrizione 7",
      importanza: 3,
      scadenza: "2021-08-07",
    },
    {
      title: "Task 8",
      image: "https://picsum.photos/200/300",
      descrizione: "Descrizione 8",
      importanza: 2,
      scadenza: "2021-08-08",
    },
    {
      title: "Task 9",
      image: "https://picsum.photos/200/300",
      descrizione: "Descrizione 9",
      importanza: 1,
      scadenza: "2021-08-09",
    },
  ],
};

export function Home() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <Badge letter="U" onPress={() => navigation.navigate("Login")} />
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
      <AddTask onSave={(title: string, description: string, dueDate: string, priority: number) => {
        console.log(title, description, dueDate, priority);
        console.log(Object.isFrozen(data.macchina));
        data.macchina.push({
          title: title || "Default Title",
          image: "https://picsum.photos/200/300",
          descrizione: description || "Default Description",
          importanza: priority || 1,
          scadenza: dueDate || "2021-08-01",
        });
        
      }} />
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text>Settings</Text>
      </TouchableOpacity>
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
});
