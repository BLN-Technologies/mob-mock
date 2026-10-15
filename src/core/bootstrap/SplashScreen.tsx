import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { localStorage } from '../../data/local/storage';
import { User } from '../../domain/models';

interface SplashScreenProps {
  onBootstrapComplete: (user: User | null) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onBootstrapComplete }) => {
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted) {
        onBootstrapComplete(null);
      }
    }, 2000); // 2s maximum hard safeguard

    const bootstrap = async () => {
      try {
        await new Promise(res => setTimeout(res, 800));
        const user = await localStorage.getSessionUser();
        if (isMounted) {
          clearTimeout(timeout);
          onBootstrapComplete(user);
        }
      } catch (err) {
        if (isMounted) {
          clearTimeout(timeout);
          onBootstrapComplete(null);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [onBootstrapComplete]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <Ionicons name="leaf" size={44} color="#FFFFFF" />
      </View>
      <Text style={styles.brandTitle}>{t.common.appName}</Text>
      <Text style={styles.brandTagline}>{t.common.tagline}</Text>

      <ActivityIndicator size="small" color="#FFFFFF" style={styles.loader} />

      <Text style={styles.versionText}>Cargo V1 Mobile · Rwanda</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0FAA38',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0B3B24',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 16,
    color: '#DCFCE7',
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  loader: {
    marginTop: 40,
  },
  versionText: {
    position: 'absolute',
    bottom: 30,
    fontSize: 12,
    color: '#DCFCE7',
    opacity: 0.8,
  },
});
