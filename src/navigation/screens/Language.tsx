import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
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
    if (languageCode === currentLanguage || isChanging) return;

    try {
      setIsChanging(true);
      await changeLanguage(languageCode);
      Alert.alert(t('common.messages.success'), t('language.messages.changed'));
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('common.messages.error'), t('errors.unknown'));
    } finally {
      setIsChanging(false);
    }
  };

  const availableLanguages = LANGUAGES.filter((l) => l.available);
  const comingSoonLanguages = LANGUAGES.filter((l) => !l.available);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ───────────────── LINGUA ATTUALE ───────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('language.currentLanguage')}</Text>
          <Text style={styles.sectionDescription}>{t('language.currentLanguageDesc')}</Text>
        </View>

        {availableLanguages.map((language) => {
          const isSelected = currentLanguage === language.code;
          return (
            <TouchableOpacity
              key={language.code}
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => handleLanguageSelect(language.code)}
              disabled={isChanging}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.flagContainer}>
                  <Text style={styles.flagEmoji}>{language.flag}</Text>
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>
                    {language.nativeName}
                  </Text>
                  <Text style={styles.rowHint}>{language.name}</Text>
                </View>
              </View>
              {isChanging && isSelected ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : isSelected ? (
                <Ionicons name="checkmark-circle" size={24} color="#000000" />
              ) : null}
            </TouchableOpacity>
          );
        })}

        {/* ───────────────── PROSSIMAMENTE ───────────────── */}
        {comingSoonLanguages.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('language.comingSoon')}</Text>
              <Text style={styles.sectionDescription}>{t('language.comingSoonDesc')}</Text>
            </View>

            {comingSoonLanguages.map((language) => (
              <View key={language.code} style={styles.rowDisabled}>
                <View style={styles.rowLeft}>
                  <View style={styles.flagContainer}>
                    <Text style={styles.flagEmoji}>{language.flag}</Text>
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={[styles.rowLabel, styles.disabledText]}>{language.nativeName}</Text>
                    <Text style={[styles.rowHint, styles.disabledText]}>{language.name}</Text>
                  </View>
                </View>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>{t('language.comingSoon')}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ───────────────── INFO ───────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('notificationSettings.sections.info')}</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="globe-outline" size={20} color="#000000" />
          <Text style={styles.infoItemText}>{t('language.info.autoApply')}</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="refresh-outline" size={20} color="#000000" />
          <Text style={styles.infoItemText}>{t('language.info.restart')}</Text>
        </View>

        <View style={{ height: 32 }} />
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
  // Section header — identico a NotificationSettings
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'System',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    fontFamily: 'System',
  },
  // Row lingua disponibile
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowSelected: {
    backgroundColor: '#f8f9fa',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 2,
  },
  rowLabelSelected: {
    fontWeight: '600',
  },
  rowHint: {
    fontSize: 13,
    color: '#6c757d',
    fontFamily: 'System',
  },
  // Flag
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
    fontSize: 22,
  },
  // Row disabilitata (coming soon)
  rowDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    opacity: 0.55,
  },
  disabledText: {
    color: '#adb5bd',
  },
  comingSoonBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'System',
  },
  // Info list — identico a NotificationSettings
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoItemText: {
    fontSize: 15,
    color: '#495057',
    marginLeft: 15,
    flex: 1,
    fontFamily: 'System',
    lineHeight: 20,
  },
});
