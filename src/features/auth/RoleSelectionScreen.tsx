import React, { useState } from 'react';
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
import { UserRole } from '../../domain/enums';

interface RoleSelectionScreenProps {
  onSelectRole: (role: UserRole.SUPPLIER | UserRole.BUYER) => void;
  onNavigateBack: () => void;
  onNavigateToLogin: () => void;
  onNavigateToAgentInvite: () => void;
  initialRole?: UserRole.SUPPLIER | UserRole.BUYER;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  onSelectRole,
  onNavigateBack,
  onNavigateToLogin,
  onNavigateToAgentInvite,
  initialRole,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<UserRole.SUPPLIER | UserRole.BUYER | null>(
    initialRole || null
  );

  const toggleLanguage = () => {
    const nextLang: Language = language === 'rw' ? 'en' : 'rw';
    setLanguage(nextLang);
  };

  const handleContinue = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Top Navigation Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onNavigateBack}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
              <Text style={styles.backBtnText}>
                {language === 'rw' ? 'Gusubira Inyuma' : 'Back'}
              </Text>
            </TouchableOpacity>

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

          {/* Screen Header */}
          <View style={styles.headerContainer}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="person-circle" size={32} color={colors.primary} />
            </View>
            <Text style={styles.screenHeading}>{t.auth.howWillYouUseCargo}</Text>
            <Text style={styles.screenSubheading}>{t.auth.chooseExperience}</Text>
          </View>

          {/* Role Cards Container */}
          <View style={styles.cardsContainer}>
            {/* 1. Supplier Card */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === UserRole.SUPPLIER && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole(UserRole.SUPPLIER)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedRole === UserRole.SUPPLIER }}
              accessibilityLabel={t.auth.roleSupplierTitle}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="leaf" size={24} color={colors.primary} />
                </View>
                <View
                  style={[
                    styles.radioIndicator,
                    selectedRole === UserRole.SUPPLIER && styles.radioIndicatorSelected,
                  ]}
                >
                  {selectedRole === UserRole.SUPPLIER && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
              </View>

              <Text
                style={[
                  styles.roleCardTitle,
                  selectedRole === UserRole.SUPPLIER && styles.roleCardTitleSelected,
                ]}
              >
                {t.auth.roleSupplierTitle}
              </Text>

              <Text style={styles.roleCardDesc}>{t.auth.roleSupplierDesc}</Text>

              <View style={styles.perksList}>
                <View style={styles.perkItem}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  <Text style={styles.perkText}>{t.auth.supplierPerk1}</Text>
                </View>
                <View style={styles.perkItem}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  <Text style={styles.perkText}>{t.auth.supplierPerk2}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* 2. Buyer Card */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === UserRole.BUYER && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole(UserRole.BUYER)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedRole === UserRole.BUYER }}
              accessibilityLabel={t.auth.roleBuyerTitle}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconBadge, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="business" size={24} color={colors.infoDark} />
                </View>
                <View
                  style={[
                    styles.radioIndicator,
                    selectedRole === UserRole.BUYER && styles.radioIndicatorSelected,
                  ]}
                >
                  {selectedRole === UserRole.BUYER && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
              </View>

              <Text
                style={[
                  styles.roleCardTitle,
                  selectedRole === UserRole.BUYER && styles.roleCardTitleSelected,
                ]}
              >
                {t.auth.roleBuyerTitle}
              </Text>

              <Text style={styles.roleCardDesc}>{t.auth.roleBuyerDesc}</Text>

              <View style={styles.perksList}>
                <View style={styles.perkItem}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.infoDark} />
                  <Text style={styles.perkText}>{t.auth.buyerPerk1}</Text>
                </View>
                <View style={styles.perkItem}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.infoDark} />
                  <Text style={styles.perkText}>{t.auth.buyerPerk2}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Administrative Field Agent Notice (Explicitly excluded from public role self-selection) */}
          <View style={styles.agentNoticeBox}>
            <Ionicons name="information-circle-outline" size={18} color="#DCFCE7" />
            <Text style={styles.agentNoticeText}>
              {language === 'rw'
                ? 'Abagenzuzi bo mu murima bakeneye ubutumire bwemewe kugira ngo binjire.'
                : 'Field agents and agronomists join through authorized administrative invitations.'}{' '}
              <Text
                style={styles.agentNoticeLink}
                onPress={onNavigateToAgentInvite}
              >
                {language === 'rw' ? 'Injiza kode hano' : 'Enter invite code'}
              </Text>
            </Text>
          </View>

          {/* Action Footer */}
          <View style={styles.actionFooter}>
            <Button
              title={t.auth.continueAction}
              onPress={handleContinue}
              disabled={!selectedRole}
              size="large"
              fullWidth
              style={styles.continueBtn}
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
    maxWidth: 460,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
  },
  backBtnText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  screenHeading: {
    ...typography.h1,
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  screenSubheading: {
    ...typography.caption,
    fontSize: 13,
    color: '#DCFCE7',
    textAlign: 'center',
    marginTop: 4,
  },
  cardsContainer: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.md,
  },
  roleCardSelected: {
    borderColor: '#06EFAC',
    backgroundColor: '#F0FDF4',
    ...shadows.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.neutralLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIndicatorSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  roleCardTitle: {
    ...typography.h3,
    fontSize: 18,
    color: colors.neutralHeadings,
    fontWeight: '800',
    marginBottom: 4,
  },
  roleCardTitleSelected: {
    color: colors.primaryDark,
  },
  roleCardDesc: {
    ...typography.caption,
    fontSize: 13,
    color: colors.neutralGray,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  perksList: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs + 2,
    gap: 4,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perkText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutralBody,
  },
  agentNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  agentNoticeText: {
    ...typography.caption,
    fontSize: 11,
    color: '#E2E8F0',
    flex: 1,
    lineHeight: 16,
  },
  agentNoticeLink: {
    fontWeight: '700',
    color: '#06EFAC',
    textDecorationLine: 'underline',
  },
  actionFooter: {
    width: '100%',
    alignItems: 'center',
  },
  continueBtn: {
    marginBottom: spacing.md,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
});
