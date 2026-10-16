import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { User, Organization } from '../../domain/models';
import { VerificationStatus } from '../../domain/enums';

interface SupplierOnboardingScreenProps {
  user: User;
  organization?: Organization;
  onComplete: () => void;
}

export const SupplierOnboardingScreen: React.FC<SupplierOnboardingScreenProps> = ({
  user,
  organization,
  onComplete,
}) => {
  const { t, language } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header Badge */}
          <View style={styles.header}>
            <View style={styles.badgeWrap}>
              <Ionicons name="leaf" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>{t.auth.supplierOnboardingTitle}</Text>
            <Text style={styles.subtitle}>{t.auth.supplierOnboardingSubtitle}</Text>
          </View>

          {/* Cooperative Profile Snapshot */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeaderRow}>
              <View>
                <Text style={styles.profileName}>{user.fullName}</Text>
                <Text style={styles.profileOrg}>
                  {organization?.name || 'Registered Cooperative'}
                </Text>
              </View>
              <View style={[
                styles.statusPill,
                organization?.verificationStatus === VerificationStatus.VERIFIED && { backgroundColor: '#DCFCE7' },
              ]}>
                <View style={[
                  styles.statusDot,
                  organization?.verificationStatus === VerificationStatus.VERIFIED && { backgroundColor: colors.successDark },
                ]} />
                <Text style={[
                  styles.statusText,
                  organization?.verificationStatus === VerificationStatus.VERIFIED && { color: colors.successDark },
                ]}>
                  {organization?.verificationStatus === VerificationStatus.VERIFIED
                    ? (language === 'rw' ? 'Koperative Yemejwe' : 'Accredited Cooperative')
                    : (language === 'rw' ? 'Biracyasuzumwa' : 'Accreditation Pending')}
                </Text>
              </View>
            </View>

            <View style={styles.profileMetaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={colors.neutralGray} />
                <Text style={styles.metaText}>{organization?.district || 'Rwanda'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="call-outline" size={14} color={colors.neutralGray} />
                <Text style={styles.metaText}>{user.phone}</Text>
              </View>
            </View>
          </View>

          {/* Onboarding Roadmap */}
          <View style={styles.roadmapCard}>
            <Text style={styles.roadmapTitle}>
              {language === 'rw' ? 'Intambwe zo Gutangira Gucuruza' : 'Next Steps to Trade'}
            </Text>

            {/* Step 1 */}
            <View style={styles.stepRow}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-done" size={18} color={colors.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>{t.auth.supplierStep1Title}</Text>
                <Text style={styles.stepBody}>{t.auth.supplierStep1Desc}</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.stepRow}>
              <View style={[
                styles.stepIconWrap,
                { backgroundColor: organization?.verificationStatus === VerificationStatus.VERIFIED ? '#DCFCE7' : '#FEF3C7' },
              ]}>
                <Ionicons
                  name={organization?.verificationStatus === VerificationStatus.VERIFIED ? 'checkmark-done' : 'hourglass-outline'}
                  size={18}
                  color={organization?.verificationStatus === VerificationStatus.VERIFIED ? colors.primary : colors.warningDark}
                />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>{t.auth.supplierStep2Title}</Text>
                <Text style={styles.stepBody}>
                  {organization?.verificationStatus === VerificationStatus.VERIFIED
                    ? (language === 'rw'
                        ? 'Koperative yawe yemejwe n’ubuyobozi bwa Cargo. Ushobora kumenyekanisha umusaruro.'
                        : 'Cooperative accreditation approved by Cargo Operations. You are authorized to declare harvest lots.')
                    : t.auth.supplierStep2Desc}
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.stepRow}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="cube-outline" size={18} color={colors.infoDark} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>{t.auth.supplierStep3Title}</Text>
                <Text style={styles.stepBody}>{t.auth.supplierStep3Desc}</Text>
              </View>
            </View>
          </View>

          {/* Primary Action Button */}
          <Button
            title={t.auth.goToSupplierDashboard}
            onPress={onComplete}
            size="large"
            fullWidth
            style={styles.actionBtn}
          />
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
    paddingTop: Platform.OS === 'android' ? spacing.lg : spacing.md,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 440,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  badgeWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  title: {
    ...typography.h2,
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    fontSize: 13,
    color: '#DCFCE7',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  profileName: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '800',
    color: colors.neutralHeadings,
  },
  profileOrg: {
    ...typography.caption,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warningDark,
  },
  statusText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.warningDark,
  },
  profileMetaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs + 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  roadmapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  roadmapTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.neutralHeadings,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepHeading: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralHeadings,
  },
  stepBody: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
    marginTop: 2,
    lineHeight: 15,
  },
  actionBtn: {
    marginTop: spacing.xs,
  },
});
