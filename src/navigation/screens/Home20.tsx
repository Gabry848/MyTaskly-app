import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const Home20 = () => {
  const [message, setMessage] = useState('');
  const navigation = useNavigation();

  const handleVoicePress = () => {
    // Gestione del pulsante microfono
    console.log('Voice button pressed');
  };

  const handleSubmit = () => {
    if (message.trim()) {
      console.log('Message submitted:', message);
      setMessage('');
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {/* Header con titolo principale */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.mainTitle}>Mytaskly</Text>
      </View>

      {/* Contenuto principale */}
      <View style={styles.content}>
        {/* Saluto personalizzato */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            Ciao Gabry,{'\n'}che vuoi fare oggi?
          </Text>
        </View>

        {/* Input area */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Scrivi un messaggio..."
              placeholderTextColor="#999999"
              value={message}
              onChangeText={setMessage}
              multiline={false}
              onSubmitEditing={handleSubmit}
              returnKeyType="send"
            />
            <TouchableOpacity 
              style={styles.voiceButton}
              onPress={handleVoicePress}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="mic" 
                size={24} 
                color="#666666" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },  header: {
    paddingTop: 20,
    paddingHorizontal: 40,
    paddingBottom: 40,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    marginTop: 12,
    marginRight: 20,
    padding: 8,
  },mainTitle: {
    fontSize: 52,
    fontWeight: '200', // Più leggero per un look più elegante
    color: '#000000',
    textAlign: 'left',
    fontFamily: 'System',
    letterSpacing: -1.5,
    marginBottom: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
  },
  greetingSection: {
    marginBottom: 80,
  },  greetingText: {
    fontSize: 34,
    fontWeight: '300', // Leggermente più leggero
    color: '#000000',
    textAlign: 'center',
    lineHeight: 44,
    fontFamily: 'System',
    letterSpacing: -0.8,
  },
  inputSection: {
    alignItems: 'center',
  },  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },  textInput: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
    fontFamily: 'System',
    fontWeight: '400',
    paddingVertical: 10,
  },
  voiceButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
});

export default Home20;
