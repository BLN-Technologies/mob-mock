import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation, Language } from '../../i18n';
import { Button } from '../../components/ui/Button';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onNavigateToLogin: () => void;
  onNavigateToAgentInvite: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onNavigateToLogin,
  onNavigateToAgentInvite,
}) => {
  const { t, language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    const nextLang: Language = language === 'rw' ? 'en' : 'rw';
    setLanguage(nextLang);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Top Bar with Language Pill */}
          <View style={styles.topBar}>
            <View style={styles.brandPill}>
              <View style={styles.onlineDot} />
              <Text style={styles.brandPillText}>Rwanda · V1 Live</Text>
            </View>

            <TouchableOpacity
              style={styles.langPill}
              onPress={toggleLanguage}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Toggle Language"
            >
              <Ionicons name="globe-outline" size={15} color="#FFFFFF" />
              <Text style={styles.langPillText}>
                {language === 'rw' ? 'English' : 'Ikinyarwanda'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hero Branding */}
          <View style={styles.heroSection}>
            <View style={styles.logoBadge}>
              <Ionicons name="leaf" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.brandName}>{t.common.appName}</Text>
            <Text style={styles.brandTagline}>{t.common.tagline}</Text>
            <Text style={styles.heroHeadline}>{t.auth.welcomeTitle}</Text>
            <Text style={styles.heroSubhead}>{t.auth.welcomeSubtitle}</Text>
          </View>

          {/* Value Proposition Cards */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>
                  {language === 'rw' ? 'Umusaruro Wemejwe (BR-01 & BR-02)' : 'Verified Lots & Grades'}
                </Text>
                <Text style={styles.featureDesc}>
                  {language === 'rw'
                    ? 'Igenzura ry\'ubuhehere n\'inenge rikorwa n\'abagenzuzi babifitiye ububasha mbere yo kugaragara ku isoko.'
                    : 'Physical inspection for moisture and quality defects by certified agronomists before listing.'}
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="lock-closed" size={20} color={colors.infoDark} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>
                  {language === 'rw' ? 'Umutekano wa Escrow (BR-03)' : 'Escrow Trade Settlement'}
                </Text>
                <Text style={styles.featureDesc}>
                  {language === 'rw'
                    ? 'Amafaranga acungwa mu buryo bwizewe akarekurwa ari uko umusaruro wagemuwe kandi wemejwe.'
                    : 'Buyer payments secured in escrow; supplier payouts released upon verified physical delivery receipts.'}
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="people" size={20} color={colors.warningDark} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>
                  {language === 'rw' ? 'Guhuza Koperative n\'Abaguzi' : 'Direct Cooperative Trading'}
                </Text>
                <Text style={styles.featureDesc}>
                  {language === 'rw'
                    ? 'Ihuze n\'ibigo bikomeye bigura umusaruro w\'ibigori n\'ibishyimbo mu buryo buzwi kandi bweruye.'
                    : 'Transparent commodity sourcing directly between farmer cooperatives and commercial buyers.'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons Section */}
          <View style={styles.actionSection}>
            <Button
              title={t.auth.getStarted}
              onPress={onGetStarted}
              size="large"
              fullWidth
              style={styles.primaryBtn}
            />

            <View style={styles.signInRow}>
              <Text style={styles.signInPrompt}>{t.auth.alreadyHaveAccount} </Text>
              <TouchableOpacity
                onPress={onNavigateToLogin}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={t.auth.signInLink}
              >
                <Text style={styles.signInLinkText}>{t.auth.signInLink}</Text>
              </TouchableOpacity>
            </View>

            {/* Field Agent Authorized Access Path (Flow D) */}
            <View style={styles.agentInviteDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>
                {language === 'rw' ? 'CYANGWA' : 'OR'}
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.agentInviteBtn}
              onPress={onNavigateToAgentInvite}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t.auth.fieldAgentInviteLink}
            >
              <Ionicons name="key-outline" size={16} color="#DCFCE7" />
              <Text style={styles.agentInviteText}>
                {t.auth.fieldAgentInvitePrompt}{' '}
                <Text style={styles.agentInviteHighlight}>{t.auth.fieldAgentInviteLink}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primaryDark,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? spacing.md : spacing.sm,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 440,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#06EFAC',
  },
  brandPillText: {
    ...typography.caption,
    fontSize: 11,
    color: '#DCFCE7',
    fontWeight: '600',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
  },
  langPillText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: '#06EFAC',
    ...shadows.lg,
  },
  brandName: {
    ...typography.h1,
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    ...typography.caption,
    fontSize: 13,
    color: '#DCFCE7',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  heroHeadline: {
    ...typography.h2,
    fontSize: 21,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 28,
  },
  heroSubhead: {
    ...typography.caption,
    fontSize: 13,
    color: '#E2E8F0',
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
    maxWidth: 360,
  },
  featuresContainer: {
    gap: spacing.sm + 2,
    marginBottom: spacing.xl,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralHeadings,
  },
  featureDesc: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
    marginTop: 2,
    lineHeight: 15,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  primaryBtn: {
    marginBottom: spacing.md,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  signInPrompt: {
    ...typography.caption,
    fontSize: 13,
    color: '#E2E8F0',
  },
  signInLinkText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '800',
    color: '#06EFAC',
  },
  agentInviteDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: spacing.xs,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  agentInviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  agentInviteText: {
    ...typography.caption,
    fontSize: 12,
    color: '#E2E8F0',
  },
  agentInviteHighlight: {
    color: '#06EFAC',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
