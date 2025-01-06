import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import Card from "../../../components/Card";



const CardList: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, "CardList">>();
  
  const { lista } = route.params;

  console.log("lista da card_list.tsx:", lista);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Lista delle Card</Text>
      {lista.map((card, index) => (
        <Card
          key={index}
          title={card.title}
          image={card.image}
          descrizione={card.descrizione}
          importanza={card.importanza}
          scadenza={card.scadenza}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
});

export default CardList;
