import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import it from '../locales/it.json';
import en from '../locales/en.json';

const LANGUAGE_STORAGE_KEY = '@mytaskly:language';

// Risorse di traduzione
const resources = {
  it: { translation: it },
  en: { translation: en },
};

// Funzione per ottenere la lingua salvata
const getStoredLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && (savedLanguage === 'it' || savedLanguage === 'en')) {
      return savedLanguage;
    }
  } catch (error) {
    console.error('Error getting stored language:', error);
  }

  // Se non c'è lingua salvata, usa quella del dispositivo
  const locales = Localization.getLocales();
  const deviceLanguage = locales[0]?.languageCode?.split('-')[0] || 'it';
  return deviceLanguage === 'it' || deviceLanguage === 'en' ? deviceLanguage : 'it';
};

// Funzione per salvare la lingua
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Inizializzazione i18n sincronizzata
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'it', // Lingua di default
    fallbackLng: 'it',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Carica la lingua salvata dopo l'inizializzazione
getStoredLanguage().then((language) => {
  if (i18n.language !== language) {
    i18n.changeLanguage(language);
  }
});

export default i18n;
