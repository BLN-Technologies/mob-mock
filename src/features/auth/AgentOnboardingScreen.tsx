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

interface AgentOnboardingScreenProps {
  user: User;
  organization?: Organization;
  onComplete: () => void;
}

export const AgentOnboardingScreen: React.FC<AgentOnboardingScreenProps> = ({
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeWrap}>
              <Ionicons name="clipboard" size={32} color={colors.warningDark} />
            </View>
            <Text style={styles.title}>{t.auth.agentOnboardingTitle}</Text>
            <Text style={styles.subtitle}>{t.auth.agentOnboardingSubtitle}</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeaderRow}>
              <View>
                <Text style={styles.profileName}>{user.fullName}</Text>
                <Text style={styles.profileOrg}>
                  {language === 'rw' ? 'Umugenzuzi wemewe' : 'Certified Field Inspector'}
                </Text>
              </View>
              <View style={styles.statusPill}>
                <Ionicons name="shield-checkmark" size={13} color={colors.successDark} />
                <Text style={styles.statusText}>
                  {language === 'rw' ? 'Yemejwe' : 'Authorized'}
                </Text>
              </View>
            </View>

            <View style={styles.profileMetaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={colors.neutralGray} />
                <Text style={styles.metaText}>{organization?.district || 'Operations Network'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="call-outline" size={14} color={colors.neutralGray} />
                <Text style={styles.metaText}>{user.phone}</Text>
              </View>
            </View>
          </View>

          {/* Core Agent Guidance */}
          <View style={styles.roadmapCard}>
            <Text style={styles.roadmapTitle}>
              {language === 'rw' ? 'Ibyo Uzasabwa mu Kazi' : 'Field Operations Protocols'}
            </Text>

            <View style={styles.stepRow}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="list" size={18} color={colors.warningDark} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>{t.auth.agentStep1Title}</Text>
                <Text style={styles.stepBody}>{t.auth.agentStep1Desc}</Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="cloud-offline" size={18} color={colors.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>{t.auth.agentStep2Title}</Text>
                <Text style={styles.stepBody}>{t.auth.agentStep2Desc}</Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <Button
            title={t.auth.goToAgentTasks}
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
    color: colors.warningDark,
    fontWeight: '600',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    gap: 4,
  },
  statusText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.successDark,
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
