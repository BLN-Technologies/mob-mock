import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation, Language } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { OtpModal } from './OtpModal';
import { authService, AgentInvitation } from '../../services/mock/mockServices';
import { User } from '../../domain/models';

interface AgentInviteScreenProps {
  onSuccess: (user: User) => void;
  onNavigateBack: () => void;
  onNavigateToLogin: () => void;
}

export const AgentInviteScreen: React.FC<AgentInviteScreenProps> = ({
  onSuccess,
  onNavigateBack,
  onNavigateToLogin,
}) => {
  const { t, language, setLanguage } = useTranslation();

  // Invite verification step
  const [inviteCode, setInviteCode] = useState('');
  const [verifiedInvite, setVerifiedInvite] = useState<AgentInvitation | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // OTP Modal
  const [showOtp, setShowOtp] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const toggleLanguage = () => {
    const nextLang: Language = language === 'rw' ? 'en' : 'rw';
    setLanguage(nextLang);
  };

  const handleVerifyInvite = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || inviteCode).trim();
    if (!targetCode) {
      setInviteError(t.auth.errInviteRequired);
      return;
    }

    setInviteError(null);
    setVerifying(true);
    try {
      const result = await authService.validateAgentInvitation(targetCode);
      setVerifiedInvite(result);
      setInviteCode(result.code);
    } catch (err: any) {
      setVerifiedInvite(null);
      setInviteError(err.message || t.auth.errInviteInvalid);
    } finally {
      setVerifying(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = t.auth.errFullNameRequired;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const phoneValid =
      cleanPhone.length >= 8 &&
      (/^(\+?250)?(7[2389]\d{7})$/.test(cleanPhone) || /^\d{8,12}$/.test(cleanPhone));
    if (!cleanPhone || !phoneValid) {
      errors.phone = t.auth.errPhoneRequired;
    }

    if (!nationalId.trim()) {
      errors.nationalId = t.auth.errNationalIdRequired;
    }

    if (!password || password.length < 6) {
      errors.password = t.auth.errPasswordMin;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = t.auth.errPasswordMismatch;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterAgent = async () => {
    if (!verifiedInvite) {
      setServerError(t.auth.errInviteRequired);
      return;
    }

    setServerError(null);
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await authService.registerFieldAgentWithInvite({
        code: verifiedInvite.code,
        fullName: fullName.trim(),
        phone: phone.trim(),
        nationalId: nationalId.trim(),
        password,
        preferredLanguage: language,
      });

      setPendingUser(result.user);
      if (result.requiresOtp) {
        setShowOtp(true);
      } else {
        onSuccess(result.user);
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to complete agent registration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    try {
      await authService.verifyOtp(code);
      setShowOtp(false);
      if (pendingUser) {
        onSuccess(pendingUser);
      }
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            {/* Top Navigation */}
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

            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.badgeWrap}>
                <Ionicons name="shield-checkmark" size={30} color={colors.primary} />
              </View>
              <Text style={styles.title}>{t.auth.agentInviteTitle}</Text>
              <Text style={styles.subtitle}>{t.auth.agentInviteSubtitle}</Text>
            </View>

            {/* Step 1: Invite Code Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>
                {language === 'rw' ? 'Intambwe 1: Kode y\'Ubutumire' : 'Step 1: Invitation Authorization'}
              </Text>

              <FormField
                label={t.auth.inviteCodeLabel}
                value={inviteCode}
                onChangeText={text => {
                  setInviteCode(text.toUpperCase());
                  setInviteError(null);
                }}
                placeholder={t.auth.inviteCodePlaceholder}
                autoCapitalize="characters"
                icon="key-outline"
                error={inviteError || undefined}
                editable={!verifiedInvite}
              />

              {!verifiedInvite ? (
                <>
                  <Button
                    title={verifying ? t.auth.verifyingInvite : t.auth.verifyInviteBtn}
                    onPress={() => handleVerifyInvite()}
                    loading={verifying}
                    variant="primary"
                    fullWidth
                    style={styles.verifyBtn}
                  />

                  {/* Quick-test invite chips */}
                  <View style={styles.demoSection}>
                    <Text style={styles.demoTitle}>
                      {language === 'rw' ? 'Kode z\'Icyitegererezo:' : 'Test Invitation Codes:'}
                    </Text>
                    <View style={styles.demoChipsRow}>
                      <TouchableOpacity
                        style={styles.demoChip}
                        onPress={() => {
                          setInviteCode('AGENT-2026-RW');
                          handleVerifyInvite('AGENT-2026-RW');
                        }}
                      >
                        <Text style={styles.demoChipText}>AGENT-2026-RW (Active)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.demoChip}
                        onPress={() => {
                          setInviteCode('INV-AG-HUYE');
                          handleVerifyInvite('INV-AG-HUYE');
                        }}
                      >
                        <Text style={styles.demoChipText}>INV-AG-HUYE (Active)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.demoChip, { borderColor: colors.dangerBorder }]}
                        onPress={() => {
                          setInviteCode('AGENT-EXP-2025');
                          handleVerifyInvite('AGENT-EXP-2025');
                        }}
                      >
                        <Text style={[styles.demoChipText, { color: colors.danger }]}>
                          AGENT-EXP-2025 (Expired)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.demoChip, { borderColor: colors.neutralLight }]}
                        onPress={() => {
                          setInviteCode('AGENT-USED-999');
                          handleVerifyInvite('AGENT-USED-999');
                        }}
                      >
                        <Text style={[styles.demoChipText, { color: colors.neutralGray }]}>
                          AGENT-USED-999 (Used)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.verifiedBox}>
                  <View style={styles.verifiedHeaderRow}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.verifiedTitle}>{t.auth.inviteVerifiedBadge}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setVerifiedInvite(null);
                        setInviteCode('');
                      }}
                      style={styles.changeCodeBtn}
                    >
                      <Text style={styles.changeCodeText}>{t.auth.changeRole}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t.auth.assignedDistrict}:</Text>
                      <Text style={styles.detailVal}>{verifiedInvite.district}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t.auth.assignedSector}:</Text>
                      <Text style={styles.detailVal}>{verifiedInvite.sector}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t.auth.supervisor}:</Text>
                      <Text style={styles.detailVal}>{verifiedInvite.supervisorName}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Step 2: Agent Account Details */}
            {verifiedInvite && (
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>
                  {language === 'rw' ? 'Intambwe 2: Umwirondoro w\'Umugenzuzi' : 'Step 2: Agent Credentials'}
                </Text>

                {serverError ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={18} color={colors.danger} />
                    <Text style={styles.errorBoxText}>{serverError}</Text>
                  </View>
                ) : null}

                <FormField
                  label={t.auth.fullName}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Alice Mukamana"
                  icon="person-outline"
                  error={fieldErrors.fullName}
                  autoCapitalize="words"
                />

                <FormField
                  label={t.auth.phoneLabel}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="788 333 444"
                  prefix="+250"
                  keyboardType="phone-pad"
                  error={fieldErrors.phone}
                />

                <FormField
                  label={t.auth.nationalIdLabel}
                  value={nationalId}
                  onChangeText={setNationalId}
                  placeholder={t.auth.nationalIdPlaceholder}
                  icon="card-outline"
                  error={fieldErrors.nationalId}
                />

                <FormField
                  label={t.auth.passwordLabel}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  icon="lock-closed-outline"
                  error={fieldErrors.password}
                  helper={t.auth.passwordHelper}
                />

                <FormField
                  label={t.auth.confirmPasswordLabel}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  icon="shield-checkmark-outline"
                  error={fieldErrors.confirmPassword}
                />

                <Button
                  title={submitting ? t.auth.completingAuth : t.auth.completeAgentAuth}
                  onPress={handleRegisterAgent}
                  loading={submitting}
                  size="large"
                  fullWidth
                  style={styles.submitBtn}
                />
              </View>
            )}

            {/* Back to Sign-in link */}
            <View style={styles.signInRow}>
              <Text style={styles.signInPrompt}>{t.auth.alreadyHaveAccount} </Text>
              <TouchableOpacity
                onPress={onNavigateToLogin}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.signInLinkText}>{t.auth.signInLink}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OtpModal
        visible={showOtp}
        onVerify={handleVerifyOtp}
        onCancel={() => setShowOtp(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primaryDark,
  },
  keyboardView: {
    flex: 1,
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
  },
  badgeWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
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
    fontSize: 12,
    color: '#DCFCE7',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  cardHeaderTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.neutralHeadings,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  verifyBtn: {
    marginTop: spacing.xs,
  },
  demoSection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  demoTitle: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutralGray,
    marginBottom: 6,
  },
  demoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  demoChip: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  demoChipText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  verifiedBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: colors.successLight,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  verifiedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  verifiedTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.successDark,
    flex: 1,
  },
  changeCodeBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  changeCodeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  detailsGrid: {
    gap: 4,
    marginTop: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  detailVal: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutralHeadings,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBoxText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
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
});
