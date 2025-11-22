import { Text } from '@react-navigation/elements';
import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

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
          <Text style={styles.appName}>{t('about.appName')}</Text>
          <Text style={styles.version}>{t('about.version')} 1.0.0 Beta</Text>
        </View>

        {/* App Info Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('about.aboutApp')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.description}>
            Mytaskly è un'applicazione per la gestione delle attività quotidiane,
            progettata per aiutarti a organizzare il tuo tempo e aumentare la tua produttività.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.description}>
            L'app è attualmente in fase beta e viene costantemente migliorata
            con nuove funzionalità e aggiornamenti.
          </Text>
        </View>

        {/* Developer Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sviluppatore</Text>
        </View>

        <View style={styles.developerItem}>
          <Ionicons name="person-circle-outline" size={48} color="#000000" />
          <View style={styles.developerText}>
            <Text style={styles.developerName}>Gabry848 Studio</Text>
            <Text style={styles.developerRole}>Sviluppatore & Designer</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.description}>
            Mytaskly è sviluppata con passione da Gabry848 Studio,
            con l'obiettivo di creare strumenti semplici ed efficaci
            per la produttività personale.
          </Text>
        </View>

        {/* Status Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stato dell'app</Text>
        </View>

        <View style={styles.statusItem}>
          <View style={styles.betaBadge}>
            <Ionicons name="flask" size={16} color="#000000" />
            <Text style={styles.betaText}>BETA</Text>
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.betaDescription}>
              Questa è una versione beta dell'applicazione.
              Potrebbero essere presenti alcuni bug o funzionalità incomplete.
            </Text>
            <Text style={styles.betaNote}>
              I tuoi feedback sono preziosi per migliorare l'app!
            </Text>
          </View>
        </View>

        {/* Features in Development */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>In sviluppo</Text>
        </View>

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
    paddingTop: 20,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    color: '#6c757d',
    fontFamily: 'System',
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
  description: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    fontFamily: 'System',
    fontWeight: '400',
  },
  developerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  developerText: {
    marginLeft: 16,
  },
  developerName: {
    fontSize: 18,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 4,
  },
  developerRole: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'System',
  },
  statusItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  betaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  betaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    marginLeft: 4,
  },
  statusTextContainer: {
    marginTop: 4,
  },
  betaDescription: {
    fontSize: 14,
    color: '#495057',
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
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureText: {
    fontSize: 17,
    color: '#000000',
    fontFamily: 'System',
    marginLeft: 15,
    fontWeight: '400',
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
    color: '#6c757d',
    fontFamily: 'System',
  },
});
