import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const RegisterScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.avatar} />
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="user" size={20} color="white" style={styles.icon} />
        <TextInput
          placeholder="Username"
          placeholderTextColor="white"
          style={[styles.input, { width: width * 0.75 }]}
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome
          name="envelope"
          size={20}
          color="white"
          style={styles.icon}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor="white"
          style={[styles.input, { width: width * 0.75 }]}
          keyboardType="email-address"
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="lock" size={20} color="white" style={styles.icon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor="white"
          style={[styles.input, { width: width * 0.75 }]}
          secureTextEntry
        />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}>
        <FontAwesome name="lock" size={20} color="white" style={styles.icon} />
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="white"
          style={[styles.input, { width: width * 0.75 }]}
          secureTextEntry
        />
      </View>
      <TouchableOpacity style={[styles.registerButton, { width: width * 0.9 }]}>
        <Text style={styles.registerText}>Register Now</Text>
      </TouchableOpacity>
      <Text style={styles.loginText}>Already have an account?</Text>
      <TouchableOpacity style={styles.loginButton}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E88E5",
    width: "100%",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#64B5F6",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "white",
    height: 50,
  },
  registerButton: {
    backgroundColor: "#FF8A80",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
  },
  registerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginText: {
    color: "white",
    fontSize: 14,
    marginBottom: 5,
  },
  loginButton: {
    borderWidth: 1,
    borderColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "white",
    fontSize: 14,
  },
});

export default RegisterScreen;
