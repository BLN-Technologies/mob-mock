import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from './en';
import { rw } from './rw';

export type Language = 'en' | 'rw';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: typeof en;
}

const I18nContext = createContext<I18nContextType>({
  language: 'rw',
  setLanguage: async () => {},
  t: rw,
});

const LANGUAGE_STORAGE_KEY = '@cargo_app_language_v1';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('rw'); // Default Kinyarwanda as required by SRS

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then(saved => {
      if (saved === 'en' || saved === 'rw') {
        setLanguageState(saved);
      }
    });
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
  };

  const t = language === 'rw' ? rw : en;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
