import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation, Language } from '../../i18n';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onNavigateToLogin: () => void;
  onNavigateToAgentInvite?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onNavigateToLogin,
}) => {
  const { t, language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    const nextLang: Language = language === 'rw' ? 'en' : 'rw';
    setLanguage(nextLang);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Header with Language Pill */}
      <View style={styles.topBar}>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>Rwanda · Cargo V1</Text>
        </View>

        <TouchableOpacity
          style={styles.langPill}
          onPress={toggleLanguage}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Toggle Language"
        >
          <Ionicons name="globe-outline" size={14} color="#DCE4DD" />
          <Text style={styles.langText}>
            {language === 'rw' ? 'English' : 'Kinyarwanda'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        <View style={styles.brandHero}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../../assets/splash-icon.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.brandTitle}>CARGO</Text>
          <Text style={styles.tagline}>
            {language === 'rw'
              ? 'Isoko ry\'ubuhinzi n\'ububiko bwizewe'
              : 'Managed Agricultural Trading & Warehouse Platform'}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.bulletItem}>
            <Ionicons name="checkmark-circle" size={18} color="#2F6B4F" />
            <Text style={styles.bulletText}>
              {language === 'rw'
                ? 'Umusaruro wemejwe mu bubiko bukuru'
                : 'Aggregated stock from approved cooperatives'}
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="shield-checkmark" size={18} color="#2F6B4F" />
            <Text style={styles.bulletText}>
              {language === 'rw'
                ? 'Igenzura ry\'ubuziranenge n\'amabwiriza'
                : 'Rigorous field inspection and grade verification'}
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="lock-closed" size={18} color="#2F6B4F" />
            <Text style={styles.bulletText}>
              {language === 'rw'
                ? 'Ubucuruzi n\'ubwishyu bwizewe'
                : 'Escrow-protected settlement and logistics'}
            </Text>
          </View>
        </View>
      </View>

      {/* Primary Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onGetStarted}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t.auth.getStarted}
        >
          <Text style={styles.primaryButtonText}>{t.auth.getStarted}</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onNavigateToLogin}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t.auth.signInLink}
        >
          <Text style={styles.secondaryButtonText}>{t.auth.signInLink}</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimerText}>
          {language === 'rw'
            ? 'Kwinjira bisaba konti yemewe na Cargo Operations.'
            : 'Access is governed by Cargo approval and role authorization.'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#103B2B', // Dark forest green
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2F6B4F',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DCE4DD',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DCE4DD',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
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
  tagline: {
    fontSize: 14,
    color: '#DCE4DD',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 300,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(23, 74, 53, 0.65)',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 228, 221, 0.15)',
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletText: {
    fontSize: 13,
    color: '#F7F8F5',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2F6B4F',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(220, 228, 221, 0.35)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F7F8F5',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
});
