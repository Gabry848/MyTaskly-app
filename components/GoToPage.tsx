import React, { useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from "react-native";
import Icon from "react-native-vector-icons/Entypo";

type Props = {
  text: string;
  onPress: () => void;
};

function GoToPage({ text, onPress }: Props) {
  useEffect(() => {
    const handleResize = () => {
      // Funzione per gestire il resize se necessario
    };

    const subscription = Dimensions.addEventListener("change", handleResize);
    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <TouchableOpacity style={[styles.container]} onPress={onPress}>
      <View style={styles.rect1}>
        <Text style={styles.leMieCategorie2}>{text}</Text>
        <Icon name="chevron-thin-right" style={styles.icon}></Icon>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 53,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    marginLeft: 10,
    marginRight: 10,
  },
  rect1: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(173,216,230,1)", // Cambiato in un azzurro chiaro
    borderWidth: 1,
    borderColor: "rgba(255,255,255,1)",
    borderRadius: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  leMieCategorie2: {
    fontFamily: "roboto-700",
    color: "rgba(0,0,0,1)",
    fontSize: 20,
    flex: 1,
  },
  icon: {
    color: "rgba(13,12,12,1)",
    fontSize: 20,
  }
});

export default GoToPage;
