import { Text } from '@react-navigation/elements';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Language() {
  const handleLanguageSelect = (languageCode: string) => {
    // Placeholder per future implementazioni
    console.log('Language selected:', languageCode);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Current Language Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lingua attuale</Text>
        </View>

        <TouchableOpacity
          style={styles.languageItem}
          onPress={() => handleLanguageSelect('it')}
        >
          <View style={styles.languageContent}>
            <View style={styles.flagContainer}>
              <Text style={styles.flagEmoji}>🇮🇹</Text>
            </View>
            <View style={styles.languageInfo}>
              <Text style={styles.languageName}>Italiano</Text>
              <Text style={styles.languageNative}>Italiano</Text>
            </View>
          </View>
          <Ionicons name="checkmark-circle" size={24} color="#28a745" />
        </TouchableOpacity>

        {/* Available Languages Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lingue disponibili</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>
            Al momento è disponibile solo la lingua italiana
          </Text>
        </View>

        {/* Future Languages */}
        <View style={styles.futureLanguageItem}>
          <View style={styles.languageContent}>
            <View style={styles.flagContainer}>
              <Text style={styles.flagEmoji}>🇺🇸</Text>
            </View>
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, styles.disabledText]}>English</Text>
              <Text style={[styles.languageNative, styles.disabledText]}>English</Text>
            </View>
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Prossimamente</Text>
          </View>
        </View>

        <View style={styles.futureLanguageItem}>
          <View style={styles.languageContent}>
            <View style={styles.flagContainer}>
              <Text style={styles.flagEmoji}>🇪🇸</Text>
            </View>
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, styles.disabledText]}>Español</Text>
              <Text style={[styles.languageNative, styles.disabledText]}>Español</Text>
            </View>
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Prossimamente</Text>
          </View>
        </View>

        <View style={styles.futureLanguageItem}>
          <View style={styles.languageContent}>
            <View style={styles.flagContainer}>
              <Text style={styles.flagEmoji}>🇫🇷</Text>
            </View>
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, styles.disabledText]}>Français</Text>
              <Text style={[styles.languageNative, styles.disabledText]}>Français</Text>
            </View>
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Prossimamente</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informazioni</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="information-circle-outline" size={24} color="#000000" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Localizzazione in sviluppo</Text>
            <Text style={styles.infoDescription}>
              Stiamo lavorando per aggiungere il supporto a più lingue.
              Le nuove lingue saranno disponibili nei prossimi aggiornamenti dell'app.
            </Text>
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
  sectionSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    fontFamily: 'System',
    fontWeight: '400',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  flagEmoji: {
    fontSize: 24,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'System',
  },
  futureLanguageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    opacity: 0.6,
  },
  disabledText: {
    color: '#adb5bd',
  },
  comingSoonBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'System',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'left',
    lineHeight: 20,
    fontFamily: 'System',
  },
});
