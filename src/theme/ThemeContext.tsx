import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { safeGetItem, safeSetItem } from '../data/local/storage';
import { lightColors, darkColors } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
  colors: typeof lightColors;
}

const THEME_STORAGE_KEY = '@cargo_app_theme_mode_v1';

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  setThemeMode: async () => {},
  isDark: false,
  colors: lightColors,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    safeGetItem(THEME_STORAGE_KEY)
      .then(saved => {
        if (saved === 'system' || saved === 'light' || saved === 'dark') {
          setModeState(saved as ThemeMode);
        }
      })
      .catch(() => {
        // Fallback safely to default 'system'
      });
  }, []);

  const setThemeMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await safeSetItem(THEME_STORAGE_KEY, newMode);
    } catch {
      // Ignored
    }
  };

  const isDark =
    mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  const themeColors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, setThemeMode, isDark, colors: themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
