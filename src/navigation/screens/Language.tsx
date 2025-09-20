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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="globe" size={24} color="#28a745" />
            <Text style={styles.sectionTitle}>Lingua attuale</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.languageItem, styles.selectedLanguageItem]}
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
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={24} color="#28a745" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Available Languages Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={24} color="#17a2b8" />
            <Text style={styles.sectionTitle}>Lingue disponibili</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Al momento è disponibile solo la lingua italiana
          </Text>

          {/* Future Languages */}
          <View style={styles.futureLanguagesList}>
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
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={32} color="#17a2b8" />
            <Text style={styles.infoTitle}>Localizzazione in sviluppo</Text>
            <Text style={styles.infoDescription}>
              Stiamo lavorando per aggiungere il supporto a più lingue. 
              Le nuove lingue saranno disponibili nei prossimi aggiornamenti dell&apos;app.
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
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    fontFamily: 'System',
    marginLeft: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'System',
    marginBottom: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedLanguageItem: {
    backgroundColor: '#f8fff8',
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
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  flagEmoji: {
    fontSize: 24,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    fontFamily: 'System',
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'System',
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  futureLanguagesList: {
    marginTop: 8,
  },
  futureLanguageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    opacity: 0.8,
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
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    fontFamily: 'System',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'System',
  },
});