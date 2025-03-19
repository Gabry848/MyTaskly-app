import React, { Component } from "react";
import { StyleSheet, View, Text } from "react-native";

function Index(props) {
  return (
    <View style={styles.container}>
      <Text style={styles.leMieCategorie}>Le mie categorie</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 225,
    height: 37
  },
  leMieCategorie: {
    fontFamily: "roboto-700",
    color: "#121212",
    fontSize: 30
  }
});

export default Index;
