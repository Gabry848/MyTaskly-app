import { Text } from '@react-navigation/elements';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  available: boolean;
}

const LANGUAGES: Language[] = [
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', available: true },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', available: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', available: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', available: false },
];

export default function Language() {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageSelect = async (languageCode: string) => {
    if (languageCode === currentLanguage || isChanging) {
      return;
    }

    try {
      setIsChanging(true);
      await changeLanguage(languageCode);

      // Show success message
      Alert.alert(
        t('common.messages.success'),
        t('language.messages.changed')
      );
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('common.messages.error'),
        t('errors.unknown')
      );
    } finally {
      setIsChanging(false);
    }
  };

  const availableLanguages = LANGUAGES.filter(lang => lang.available);
  const comingSoonLanguages = LANGUAGES.filter(lang => !lang.available);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Current Language Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('language.currentLanguage')}</Text>
        </View>

        {availableLanguages.map((language) => {
          const isSelected = currentLanguage === language.code;

          return (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                isSelected && styles.selectedLanguageItem
              ]}
              onPress={() => handleLanguageSelect(language.code)}
              disabled={isChanging}
            >
              <View style={styles.languageContent}>
                <View style={styles.flagContainer}>
                  <Text style={styles.flagEmoji}>{language.flag}</Text>
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{language.nativeName}</Text>
                  <Text style={styles.languageNative}>{language.name}</Text>
                </View>
              </View>
              {isChanging && isSelected ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : isSelected ? (
                <Ionicons name="checkmark-circle" size={24} color="#28a745" />
              ) : null}
            </TouchableOpacity>
          );
        })}

        {/* Available Languages Section */}
        {availableLanguages.length > 1 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('language.availableLanguages')}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionSubtitle}>
                {t('language.availableLanguages')} {availableLanguages.length}
              </Text>
            </View>
          </>
        )}

        {/* Coming Soon Languages */}
        {comingSoonLanguages.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('language.comingSoon')}</Text>
            </View>

            {comingSoonLanguages.map((language) => (
              <View key={language.code} style={styles.futureLanguageItem}>
                <View style={styles.languageContent}>
                  <View style={styles.flagContainer}>
                    <Text style={styles.flagEmoji}>{language.flag}</Text>
                  </View>
                  <View style={styles.languageInfo}>
                    <Text style={[styles.languageName, styles.disabledText]}>
                      {language.nativeName}
                    </Text>
                    <Text style={[styles.languageNative, styles.disabledText]}>
                      {language.name}
                    </Text>
                  </View>
                </View>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>{t('language.comingSoon')}</Text>
                </View>
              </View>
            ))}
          </>
        )}
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
  selectedLanguageItem: {
    backgroundColor: '#f8f9fa',
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
});
