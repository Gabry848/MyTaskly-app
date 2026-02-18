import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  getVoiceSettings,
  updateVoiceSettings,
  VoiceSettings,
  VOICE_SETTINGS_OPTIONS,
} from '../../services/voiceSettingsService';

export default function VoiceSettingsScreen() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<VoiceSettings>({
    voice_model: 'base',
    voice_gender: 'female',
    voice_quality: 'medium',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVoiceSettings();
  }, []);

  const loadVoiceSettings = async () => {
    try {
      setLoading(true);
      const currentSettings = await getVoiceSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Errore nel caricamento delle impostazioni vocali:', error);
      Alert.alert(t('common.messages.error'), t('voiceSettings.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (
    settingKey: keyof VoiceSettings,
    value: string
  ) => {
    const newSettings = { ...settings, [settingKey]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const saveSettings = async (settingsToSave: VoiceSettings) => {
    try {
      setSaving(true);
      const success = await updateVoiceSettings(settingsToSave);
      if (!success) {
        Alert.alert(t('common.messages.error'), t('voiceSettings.errors.saveFailed'));
        await loadVoiceSettings();
      }
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      Alert.alert(t('common.messages.error'), t('voiceSettings.errors.connectionError'));
      await loadVoiceSettings();
    } finally {
      setSaving(false);
    }
  };

  const renderSettingSection = (
    titleKey: string,
    descKey: string,
    settingKey: keyof VoiceSettings,
    options: { label: string; value: string }[]
  ) => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t(titleKey)}</Text>
        <Text style={styles.sectionDescription}>{t(descKey)}</Text>
      </View>

      {options.map((option) => {
        const isSelected = settings[settingKey] === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.row, isSelected && styles.rowSelected]}
            onPress={() => handleSettingChange(settingKey, option.value)}
            disabled={loading || saving}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.optionDot, isSelected && styles.optionDotSelected]}>
                {isSelected && <View style={styles.optionDotInner} />}
              </View>
              <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>
                {option.label}
              </Text>
            </View>
            {isSelected && (
              <Ionicons name="checkmark" size={20} color="#000000" />
            )}
          </TouchableOpacity>
        );
      })}
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>{t('voiceSettings.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ───────────────── MODELLO VOCALE ───────────────── */}
        {renderSettingSection(
          'voiceSettings.sections.voiceModel',
          'voiceSettings.sections.voiceModelDesc',
          'voice_model',
          VOICE_SETTINGS_OPTIONS.voice_model
        )}

        {/* ───────────────── GENERE VOCE ───────────────── */}
        {renderSettingSection(
          'voiceSettings.sections.voiceGender',
          'voiceSettings.sections.voiceGenderDesc',
          'voice_gender',
          VOICE_SETTINGS_OPTIONS.voice_gender
        )}

        {/* ───────────────── QUALITÀ AUDIO ───────────────── */}
        {renderSettingSection(
          'voiceSettings.sections.voiceQuality',
          'voiceSettings.sections.voiceQualityDesc',
          'voice_quality',
          VOICE_SETTINGS_OPTIONS.voice_quality
        )}

        {/* ───────────────── INFO ───────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('voiceSettings.sections.info')}</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="information-circle-outline" size={20} color="#000000" />
          <Text style={styles.infoItemText}>{t('voiceSettings.info.autoSave')}</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="cloud-outline" size={20} color="#000000" />
          <Text style={styles.infoItemText}>{t('voiceSettings.info.sync')}</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={20} color="#000000" />
          <Text style={styles.infoItemText}>{t('voiceSettings.info.nextConversation')}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#495057',
    fontFamily: 'System',
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
  // Option row — stile toggle row di NotificationSettings
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
  rowLabel: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
    fontFamily: 'System',
  },
  rowLabelSelected: {
    fontWeight: '600',
  },
  // Radio dot
  optionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#dee2e6',
    backgroundColor: '#ffffff',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionDotSelected: {
    borderColor: '#000000',
  },
  optionDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
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
