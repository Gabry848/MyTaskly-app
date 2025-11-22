import { Text } from '@react-navigation/elements';
import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Help() {

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* App Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cos'è Mytaskly?</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            Mytaskly è la tua app personale per la gestione delle attività quotidiane.
            Organizza le tue task, crea categorie personalizzate e mantieni tutto sotto controllo
            con un'interfaccia semplice e intuitiva.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Funzionalità principali</Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#000000" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Gestione Task</Text>
            <Text style={styles.featureDescription}>
              Crea, modifica ed elimina le tue attività con facilità
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="folder-outline" size={24} color="#000000" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Categorie</Text>
            <Text style={styles.featureDescription}>
              Organizza le tue task in categorie personalizzate
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="document-text-outline" size={24} color="#000000" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Note</Text>
            <Text style={styles.featureDescription}>
              Aggiungi note e appunti per non dimenticare nulla
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="chatbubbles-outline" size={24} color="#000000" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Assistant AI</Text>
            <Text style={styles.featureDescription}>
              Chatta con l'assistente AI per organizzare meglio le tue attività
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="notifications-outline" size={24} color="#000000" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Notifiche</Text>
            <Text style={styles.featureDescription}>
              Ricevi promemoria per non perdere mai una scadenza
            </Text>
          </View>
        </View>

        {/* How to Use Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Come utilizzare l'app</Text>
        </View>

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
            <Text style={styles.stepTitle}>Usa l'AI Assistant</Text>
            <Text style={styles.stepDescription}>
              Chatta con l'assistente per ricevere suggerimenti e organizzare meglio il tuo tempo
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>5</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>Visualizza le tue statistiche</Text>
            <Text style={styles.stepDescription}>
              Accedi alla sezione Statistiche per monitorare il tuo progresso, visualizzare i grafici e analizzare le tue prestazioni
            </Text>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suggerimenti</Text>
        </View>

        <View style={styles.tipItem}>
          <Ionicons name="time-outline" size={20} color="#000000" />
          <Text style={styles.tipText}>
            Imposta delle priorità per le tue task più importanti
          </Text>
        </View>

        <View style={styles.tipItem}>
          <Ionicons name="calendar-outline" size={20} color="#000000" />
          <Text style={styles.tipText}>
            Utilizza le date di scadenza per non perdere appuntamenti importanti
          </Text>
        </View>

        <View style={styles.tipItem}>
          <Ionicons name="sync-outline" size={20} color="#000000" />
          <Text style={styles.tipText}>
            Mantieni l'app sempre aggiornata per ricevere le ultime funzionalità
          </Text>
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
    paddingTop: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    fontFamily: 'System',
    fontWeight: '400',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    fontFamily: 'System',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    marginLeft: 15,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    fontFamily: 'System',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tipText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 20,
    fontFamily: 'System',
    marginLeft: 15,
    flex: 1,
    fontWeight: '400',
  },
});
