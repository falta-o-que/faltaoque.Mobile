import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { translate } from '../localization';

const STORAGE_KEY = '@faltaoque/app-preferences:v1';
const DEFAULT_PREFERENCES = { language: 'pt-BR', fontScale: 1 };
const VALID_LANGUAGES = new Set(['pt-BR', 'en', 'es']);
const VALID_FONT_SCALES = new Set([0.9, 1, 1.1]);
const AppPreferencesContext = createContext(null);

function normalizePreferences(value) {
  return {
    language: VALID_LANGUAGES.has(value?.language) ? value.language : DEFAULT_PREFERENCES.language,
    fontScale: VALID_FONT_SCALES.has(Number(value?.fontScale)) ? Number(value.fontScale) : DEFAULT_PREFERENCES.fontScale,
  };
}

export function AppPreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((rawValue) => {
        if (!isMounted || !rawValue) return;
        try {
          setPreferences(normalizePreferences(JSON.parse(rawValue)));
        } catch {
          setPreferences(DEFAULT_PREFERENCES);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsPreferencesLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const savePreferences = useCallback(async (nextPreferences) => {
    const normalized = normalizePreferences({ ...preferences, ...nextPreferences });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setPreferences(normalized);
    return normalized;
  }, [preferences]);

  const t = useCallback((key, values) => translate(preferences.language, key, values), [preferences.language]);
  const value = useMemo(() => ({
    ...preferences,
    isPreferencesLoading,
    savePreferences,
    t,
  }), [preferences, isPreferencesLoading, savePreferences, t]);

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);
  if (!context) throw new Error('useAppPreferences deve ser usado dentro de AppPreferencesProvider.');
  return context;
}
