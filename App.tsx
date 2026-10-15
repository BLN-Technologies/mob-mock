import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider } from './src/i18n';
import { RootNavigator } from './src/core/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </I18nProvider>
    </SafeAreaProvider>
  );
}
