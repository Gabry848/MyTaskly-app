import { Text } from '@react-navigation/elements';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';

export default function Settings() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleNavigateToHome20 = () => {
    navigation.navigate('Home20');
  };

  return (
    <View style={styles.container}>
      <Text>Settings Screen</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleNavigateToHome20}
      >
        <Text style={styles.buttonText}>Vai a Home 2.0</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
