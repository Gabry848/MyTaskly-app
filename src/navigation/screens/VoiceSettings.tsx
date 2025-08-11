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
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getVoiceSettings, 
  updateVoiceSettings, 
  VoiceSettings, 
  VOICE_SETTINGS_OPTIONS 
} from '../../services/voiceSettingsService';

export default function VoiceSettingsScreen() {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<VoiceSettings>({
    voice_model: 'base',
    voice_gender: 'female',
    voice_quality: 'medium'
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
      Alert.alert('Errore', 'Impossibile caricare le impostazioni vocali');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (
    settingKey: keyof VoiceSettings,
    value: string
  ) => {
    const newSettings = {
      ...settings,
      [settingKey]: value
    };

    setSettings(newSettings);
    
    // Salva automaticamente le modifiche
    await saveSettings(newSettings);
  };

  const saveSettings = async (settingsToSave: VoiceSettings) => {
    try {
      setSaving(true);
      const success = await updateVoiceSettings(settingsToSave);
      
      if (success) {
        // Successo silenzioso per un'esperienza fluida
        console.log('Impostazioni vocali salvate con successo');
      } else {
        Alert.alert('Errore', 'Impossibile salvare le impostazioni');
        // Ripristina le impostazioni precedenti in caso di errore
        await loadVoiceSettings();
      }
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      Alert.alert('Errore', 'Errore di connessione durante il salvataggio');
      await loadVoiceSettings();
    } finally {
      setSaving(false);
    }
  };

  const renderSettingSection = (
    title: string,
    description: string,
    settingKey: keyof VoiceSettings,
    options: { label: string; value: string }[]
  ) => (
    <View style={styles.settingSection}>
      <View style={styles.settingHeader}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionItem,
              settings[settingKey] === option.value && styles.selectedOption
            ]}
            onPress={() => handleSettingChange(settingKey, option.value)}
            disabled={loading || saving}
          >
            <Text style={[
              styles.optionText,
              settings[settingKey] === option.value && styles.selectedOptionText
            ]}>
              {option.label}
            </Text>
            {settings[settingKey] === option.value && (
              <Ionicons name="checkmark" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Caricamento impostazioni...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView style={styles.content}>
        {/* Introduzione */}
        <View style={styles.introSection}>
          <View style={styles.introIcon}>
            <Ionicons name="mic" size={32} color="#000000" />
          </View>
          <Text style={styles.introTitle}>Personalizza la Chat Vocale</Text>
          <Text style={styles.introText}>
            Configura come il bot vocale risponde alle tue domande. 
            Le impostazioni vengono applicate automaticamente a tutte le conversazioni vocali.
          </Text>
        </View>

        {/* Modello Vocale */}
        {renderSettingSection(
          'Modello Vocale',
          'Scegli il livello di intelligenza del bot vocale',
          'voice_model',
          VOICE_SETTINGS_OPTIONS.voice_model
        )}

        {/* Genere Voce */}
        {renderSettingSection(
          'Genere della Voce',
          'Seleziona se preferisci una voce femminile o maschile',
          'voice_gender',
          VOICE_SETTINGS_OPTIONS.voice_gender
        )}

        {/* Qualità Audio */}
        {renderSettingSection(
          'Qualità Audio',
          'Maggiore qualità richiede più tempo per generare la risposta',
          'voice_quality',
          VOICE_SETTINGS_OPTIONS.voice_quality
        )}

        {/* Info Aggiuntive */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={20} color="#000000" />
            <Text style={styles.infoText}>
              Le impostazioni vengono salvate automaticamente
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="cloud-outline" size={20} color="#000000" />
            <Text style={styles.infoText}>
              Sincronizzate su tutti i tuoi dispositivi
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#000000" />
            <Text style={styles.infoText}>
              Applicate alla prossima conversazione vocale
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerRight: {
    width: 30,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#ffffff',
  },
  introSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#ffffff',
  },
  introIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
  },
  settingSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  settingHeader: {
    marginBottom: 15,
  },
  settingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  optionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  selectedOption: {
    backgroundColor: '#000000',
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 20,
    backgroundColor: '#ffffff',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 10,
    flex: 1,
  },
});
