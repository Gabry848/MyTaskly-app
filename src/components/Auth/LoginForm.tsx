import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import GoogleSignInButton from "./GoogleSignInButton";

const { width } = Dimensions.get("window");

const LoginScreen = () => {
  const handleGoogleSignInSuccess = (user: any) => {
    Alert.alert(
      'Login Completato',
      `Benvenuto ${user.name}!\nEmail: ${user.email}`,
      [{ text: 'OK' }]
    );
  };

  const handleGoogleSignInError = (error: string) => {
    Alert.alert('Errore Login', error, [{ text: 'OK' }]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar} />
      <View style={[styles.inputContainer, { width: width * 0.9 }]}> 
        <FontAwesome name="user" size={20} color="white" style={styles.icon} />
        <TextInput placeholder="Username" placeholderTextColor="white" style={[styles.input, { width: width * 0.75 }]} />
      </View>
      <View style={[styles.inputContainer, { width: width * 0.9 }]}> 
        <FontAwesome name="lock" size={20} color="white" style={styles.icon} />
        <TextInput placeholder="Password" placeholderTextColor="white" style={[styles.input, { width: width * 0.75 }]} secureTextEntry />
      </View>
      <TouchableOpacity style={[styles.loginButton, { width: width * 0.9 }]}>
        <Text style={styles.loginText}>Login Now</Text>
      </TouchableOpacity>
      
      {/* Aggiungi il separatore */}
      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>oppure</Text>
        <View style={styles.separatorLine} />
      </View>
      
      {/* Bottone Google Sign-In */}
      <GoogleSignInButton
        onSignInSuccess={handleGoogleSignInSuccess}
        onSignInError={handleGoogleSignInError}
      />
      
      <View style={[styles.optionsContainer, { width: width * 0.9 }]}> 
        <TouchableOpacity>
          <Text style={styles.optionText}>Remember me</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.optionText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.signUpText}>Not a member?</Text>
      <TouchableOpacity style={styles.signUpButton}>
        <Text style={styles.signUpButtonText}>Create account</Text>
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
    padding: 5,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "white",
    height: 50,
  },
  loginButton: {
    backgroundColor: "#FF8A80",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
  },
  loginText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  optionText: {
    color: "white",
    fontSize: 14,
  },
  signUpText: {
    color: "white",
    fontSize: 14,
    marginBottom: 5,
  },
  signUpButton: {
    borderWidth: 1,
    borderColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  signUpButtonText: {
    color: "white",
    fontSize: 14,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: width * 0.9,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  separatorText: {
    color: 'white',
    marginHorizontal: 15,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;
