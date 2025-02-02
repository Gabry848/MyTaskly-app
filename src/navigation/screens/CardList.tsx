import React, { useState, useMemo } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import Card from "../../../components/Card"; // Assicurati di avere un componente Card separato

import axios from 'axios';

const getData = async () => {
  const token = 'TUO_BEARER_TOKEN';

  try {
    const response = await axios.get('https://tuo-server.com/api/data', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Dati ricevuti:', response.data);
    
    return response.data;

  } catch (error) {
    console.error('Errore nella richiesta:', error);
  }
};

const CardList: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, "CardList">>();
  const { lista } = route.params;

  const [filtroImportanza, setFiltroImportanza] = useState("Tutte");
  const [filtroScadenza, setFiltroScadenza] = useState("Tutte");

  // Funzione per applicare i filtri
  const listaFiltrata = useMemo(() => {
    return lista.filter((card) => {
      const matchesImportanza =
        filtroImportanza === "Tutte" || card.importanza.toString() === filtroImportanza;
      const matchesScadenza =
        filtroScadenza === "Tutte" || card.scadenza === filtroScadenza;

      return matchesImportanza && matchesScadenza;
    });
  }, [lista, filtroImportanza, filtroScadenza]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista di Task</Text>

      <Picker
        selectedValue={filtroImportanza}
        onValueChange={(itemValue) => setFiltroImportanza(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Tutte" value="Tutte" />
        <Picker.Item label="Alta" value="1" />
        <Picker.Item label="Media" value="2" />
        <Picker.Item label="Bassa" value="3" />
      </Picker>

      <Picker
        selectedValue={filtroScadenza}
        onValueChange={(itemValue) => setFiltroScadenza(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Tutte" value="Tutte" />
        {lista.map((card, index) => (
          <Picker.Item key={index} label={card.scadenza} value={card.scadenza} />
        ))}
      </Picker>

      <FlatList
        data={listaFiltrata}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Card
            key={index}
            title={item.title}
            image={item.image}
            descrizione={item.descrizione}
            importanza={item.importanza}
            scadenza={item.scadenza}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 10,
  },
});

export default CardList;
