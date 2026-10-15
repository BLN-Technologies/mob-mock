import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { colors, radii, typography } from '../../theme/tokens';
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
        <Image
          source={require('../../../assets/splash-icon.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.brandTitle}>{t.common.appName}</Text>
      <Text style={styles.brandTagline}>{t.common.tagline}</Text>

      <ActivityIndicator size="small" color="#06EFAC" style={styles.loader} />

      <Text style={styles.versionText}>Cargo V1 Mobile · Rwanda</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 108,
    height: 108,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#06EFAC',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 15,
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
