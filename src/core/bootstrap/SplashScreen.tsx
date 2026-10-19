import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { lightColors } from '../../theme/tokens';
import { localStorage } from '../../data/local/storage';
import { User } from '../../domain/models';

interface SplashScreenProps {
  onBootstrapComplete: (user: User | null) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onBootstrapComplete }) => {
  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();
    const MINIMUM_DURATION_MS = 3000;

    const bootstrap = async () => {
      let resolvedUser: User | null = null;
      try {
        resolvedUser = await localStorage.getSessionUser();
      } catch (err) {
        resolvedUser = null;
      }

      // Ensure minimum visible duration of approximately 3 seconds on cold launch
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MINIMUM_DURATION_MS - elapsed);

      setTimeout(() => {
        if (isMounted) {
          onBootstrapComplete(resolvedUser);
        }
      }, remaining);
    };

    bootstrap();

    return () => {
      isMounted = false;
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
      <Text style={styles.brandTitle}>CARGO</Text>
      <Text style={styles.brandSub}>Rwanda Agricultural Exchange</Text>

      <ActivityIndicator size="small" color="#2F6B4F" style={styles.loader} />

      <Text style={styles.versionText}>Cargo V1 Mobile</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#103B2B', // Dark forest green visual identity
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#2F6B4F',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F7F8F5',
    letterSpacing: 2,
  },
  brandSub: {
    fontSize: 13,
    color: '#DCE4DD',
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  loader: {
    marginTop: 36,
  },
  versionText: {
    position: 'absolute',
    bottom: 32,
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
});
