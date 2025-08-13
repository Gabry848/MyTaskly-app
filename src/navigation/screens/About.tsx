import { Text } from '@react-navigation/elements';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function About() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Content */}
      <ScrollView style={styles.content}>
        {/* App Logo/Icon Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="checkmark-done-circle" size={80} color="#000000" />
          </View>
          <Text style={styles.appName}>Mytaskly</Text>
          <Text style={styles.version}>Versione 1.0.0 Beta</Text>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color="#000000" />
            <Text style={styles.sectionTitle}>Informazioni sull&apos;app</Text>
          </View>
          
          <Text style={styles.description}>
            Mytaskly è un&apos;applicazione per la gestione delle attività quotidiane, 
            progettata per aiutarti a organizzare il tuo tempo e aumentare la tua produttività.
          </Text>

          <Text style={styles.description}>
            L&apos;app è attualmente in fase beta e viene costantemente migliorata 
            con nuove funzionalità e aggiornamenti.
          </Text>
        </View>

        {/* Developer Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="code-slash" size={24} color="#000000" />
            <Text style={styles.sectionTitle}>Sviluppatore</Text>
          </View>
          
          <View style={styles.developerCard}>
            <View style={styles.developerInfo}>
              <Ionicons name="person-circle" size={48} color="#000000" />
              <View style={styles.developerText}>
                <Text style={styles.developerName}>Gabry848 Studio</Text>
                <Text style={styles.developerRole}>Sviluppatore & Designer</Text>
              </View>
            </View>
            
            <Text style={styles.developerDescription}>
              Mytaskly è sviluppata con passione da Gabry848 Studio, 
              con l&apos;obiettivo di creare strumenti semplici ed efficaci 
              per la produttività personale.
            </Text>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct" size={24} color="#000000" />
            <Text style={styles.sectionTitle}>Stato dell&apos;app</Text>
          </View>
          
          <View style={styles.statusCard}>
            <View style={styles.betaBadge}>
              <Ionicons name="flask" size={20} color="#ffffff" />
              <Text style={styles.betaText}>BETA</Text>
            </View>
            
            <Text style={styles.betaDescription}>
              Questa è una versione beta dell&apos;applicazione. 
              Potrebbero essere presenti alcuni bug o funzionalità incomplete.
            </Text>
            
            <Text style={styles.betaNote}>
              I tuoi feedback sono preziosi per migliorare l&apos;app!
            </Text>
          </View>
        </View>

        {/* Features in Development */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={24} color="#000000" />
            <Text style={styles.sectionTitle}>In sviluppo</Text>
          </View>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="ellipse-outline" size={16} color="#000000" />
              <Text style={styles.featureText}>Sincronizzazione cloud</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="ellipse-outline" size={16} color="#000000" />
              <Text style={styles.featureText}>Notifiche avanzate</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="ellipse-outline" size={16} color="#000000" />
              <Text style={styles.featureText}>Temi personalizzati</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="ellipse-outline" size={16} color="#000000" />
              <Text style={styles.featureText}>Statistiche avanzate</Text>
            </View>
          </View>
        </View>

        {/* Copyright Section */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2024 Gabry848 Studio
          </Text>
          
          <Text style={styles.copyrightSubtext}>
            Tutti i diritti riservati
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
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -1,
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
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
  description: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
    fontFamily: 'System',
    marginBottom: 16,
  },
  developerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#000000',
  },
  developerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  developerText: {
    marginLeft: 16,
  },
  developerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 4,
  },
  developerRole: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'System',
  },
  developerDescription: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    fontFamily: 'System',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#000000',
  },
  betaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  betaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'System',
    marginLeft: 4,
  },
  betaDescription: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    fontFamily: 'System',
    marginBottom: 12,
  },
  betaNote: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    fontFamily: 'System',
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'System',
    marginLeft: 12,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  copyrightText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'System',
  },
});