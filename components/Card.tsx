import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

interface CardProps {
  title: string;
  image: string;
  descrizione: string;
  importanza: number;
  scadenza: string;
}

const Card: React.FC<CardProps> = ({ title, image, descrizione, importanza, scadenza }) => {
  const borderWidth = importanza === 3 ? 4 : importanza === 2 ? 2 : 1;

  return (
    <View style={[styles.card, { borderWidth }]}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{descrizione}</Text>
        <Text style={styles.deadline}>Scadenza: {scadenza}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderColor: "red",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 20,
    marginTop: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
    color: "#6c757d",
  },
  importance: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "500",
  },
  deadline: {
    fontSize: 14,
    color: "#dc3545",
    fontWeight: "500",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#343a40",
  },
});

export default Card;
