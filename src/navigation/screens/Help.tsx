import { Text } from '@react-navigation/elements';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function Help() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Content */}
      <ScrollView style={styles.content}>
        {/* App Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={28} color="#000000" />
            <Text style={styles.sectionTitle}>Cos&apos;è Mytaskly?</Text>
          </View>
          <Text style={styles.sectionText}>
            Mytaskly è la tua app personale per la gestione delle attività quotidiane. 
            Organizza le tue task, crea categorie personalizzate e mantieni tutto sotto controllo 
            con un&apos;interfaccia semplice e intuitiva.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={28} color="#000000" />
            <Text style={styles.sectionTitle}>Funzionalità principali</Text>
          </View>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#000000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Gestione Task</Text>
                <Text style={styles.featureDescription}>
                  Crea, modifica ed elimina le tue attività con facilità
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="folder" size={20} color="#000000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Categorie</Text>
                <Text style={styles.featureDescription}>
                  Organizza le tue task in categorie personalizzate
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="document-text" size={20} color="#000000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Note</Text>
                <Text style={styles.featureDescription}>
                  Aggiungi note e appunti per non dimenticare nulla
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="chatbubbles" size={20} color="#000000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Assistant AI</Text>
                <Text style={styles.featureDescription}>
                  Chatta con l&apos;assistente AI per organizzare meglio le tue attività
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="notifications" size={20} color="#000000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Notifiche</Text>
                <Text style={styles.featureDescription}>
                  Ricevi promemoria per non perdere mai una scadenza
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* How to Use Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={28} color="#000000" />
            <Text style={styles.sectionTitle}>Come utilizzare l&apos;app</Text>
          </View>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Inizia dalla Home</Text>
                <Text style={styles.stepDescription}>
                  La schermata principale ti mostra una panoramica delle tue attività
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Crea le tue categorie</Text>
                <Text style={styles.stepDescription}>
                  Vai nella sezione Categorie per organizzare le tue task
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Aggiungi le tue task</Text>
                <Text style={styles.stepDescription}>
                  Crea nuove attività e assegnale alle categorie appropriate
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Usa l&apos;AI Assistant</Text>
                <Text style={styles.stepDescription}>
                  Chatta con l&apos;assistente per ricevere suggerimenti e organizzare meglio il tuo tempo
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={28} color="#000000" />
            <Text style={styles.sectionTitle}>Suggerimenti</Text>
          </View>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="time" size={16} color="#000000" />
              <Text style={styles.tipText}>
                Imposta delle priorità per le tue task più importanti
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Ionicons name="calendar" size={16} color="#000000" />
              <Text style={styles.tipText}>
                Utilizza le date di scadenza per non perdere appuntamenti importanti
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Ionicons name="sync" size={16} color="#000000" />
              <Text style={styles.tipText}>
                Mantieni l&apos;app sempre aggiornata per ricevere le ultime funzionalità
              </Text>
            </View>
          </View>
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    marginLeft: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
    fontFamily: 'System',
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    fontFamily: 'System',
  },
  stepsList: {
    marginTop: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'System',
  },
  stepTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    fontFamily: 'System',
  },
  tipsList: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    fontFamily: 'System',
    marginLeft: 8,
    flex: 1,
  },
});