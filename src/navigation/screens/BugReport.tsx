import { Text } from '@react-navigation/elements';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { getValidToken } from '../../services/authService';
import axios from '../../services/axiosInstance';

export default function BugReport() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Errore', 'Inserisci sia il titolo che la descrizione del bug');
      return;
    }

    setLoading(true);
    try {
      const token = await getValidToken();
      if (!token) {
        Alert.alert('Errore', 'Token di autenticazione non valido');
        return;
      }

      const response = await axios.post('/bugs/report-bug', {
        title: title.trim(),
        description: description.trim(),
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          'Successo', 
          'Il bug è stato segnalato con successo. Grazie per il tuo contributo!',
          [
            {
              text: 'OK',
              onPress: () => {
                setTitle('');
                setDescription('');
                navigation.goBack();
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Errore nell\'invio del bug report:', error);
      Alert.alert(
        'Errore', 
        'Si è verificato un errore durante l\'invio della segnalazione. Riprova più tardi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <Ionicons name="bug-outline" size={48} color="#FF3B30" />
          <Text style={styles.headerTitle}>Segnala un Bug</Text>
          <Text style={styles.headerDescription}>
            Aiutaci a migliorare l'app segnalando eventuali problemi che hai riscontrato.
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Titolo del bug *</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Breve descrizione del problema"
              placeholderTextColor="#999999"
              maxLength={100}
              multiline={false}
              editable={!loading}
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descrizione dettagliata *</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Descrivi il problema in dettaglio: cosa stavi facendo quando si è verificato, quale errore hai visto, come riprodurre il problema..."
              placeholderTextColor="#999999"
              maxLength={1000}
              multiline={true}
              textAlignVertical="top"
              editable={!loading}
            />
            <Text style={styles.characterCount}>{description.length}/1000</Text>
          </View>

          <View style={styles.tipsSection}>
            <View style={styles.tipsHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.tipsTitle}>Consigli per una buona segnalazione</Text>
            </View>
            <Text style={styles.tipsText}>
              • Sii specifico: descrivi esattamente cosa è successo{'\n'}
              • Includi i passi per riprodurre il problema{'\n'}
              • Menciona su quale schermata si è verificato l'errore{'\n'}
              • Descrivi il comportamento atteso vs quello riscontrato
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.submitButtonContent}>
                <Ionicons name="send-outline" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Invia Segnalazione</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    marginTop: 16,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'System',
  },
  formSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
    backgroundColor: '#ffffff',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
    backgroundColor: '#ffffff',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'System',
  },
  tipsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    fontFamily: 'System',
    marginLeft: 6,
  },
  tipsText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    fontFamily: 'System',
  },
  submitButton: {
    backgroundColor: '#000000ff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
    marginLeft: 8,
  },
});