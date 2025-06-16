import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useAuth } from '../src/hooks/useAuth';

/**
 * Esempio di componente che utilizza il nuovo hook useAuth
 * per gestire automaticamente l'autenticazione con refresh token
 */
const ExampleAuthComponent: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();

  const handleProtectedAction = async () => {
    if (isAuthenticated) {
      // Esegui un'azione che richiede autenticazione
      Alert.alert('Successo', 'Azione eseguita con token valido!');
    } else {
      // L'hook ha già tentato il refresh se possibile
      Alert.alert('Errore', 'Autenticazione necessaria. Effettua il login.');
    }
  };

  const handleForceAuthCheck = async () => {
    // Forza un controllo dell'autenticazione (utile per pulsanti di refresh)
    await checkAuth();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Controllo autenticazione...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Stato autenticazione: {isAuthenticated ? '✅ Autenticato' : '❌ Non autenticato'}
      </Text>
      
      <Button
        title="Esegui azione protetta"
        onPress={handleProtectedAction}
      />
      
      <View style={{ marginTop: 10 }}>
        <Button
          title="Ricontrolla autenticazione"
          onPress={handleForceAuthCheck}
        />
      </View>
    </View>
  );
};

export default ExampleAuthComponent;
