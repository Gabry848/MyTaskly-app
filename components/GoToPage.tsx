import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Entypo";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../src/types";

type Props = {
  text: string;
  onPress: () => void;
};

function GoToPage({ text, onPress }: Props) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
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
  },
  rect1: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(187,182,216,1)",
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
  },
});

export default GoToPage;
