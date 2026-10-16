import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation, Language } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { OtpModal } from './OtpModal';
import { authService } from '../../services/mock/mockServices';
import { User } from '../../domain/models';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister?: () => void;
  onNavigateBack?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateBack,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const [identifier, setIdentifier] = useState('+250788111222');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await authService.login(identifier, password);
      setPendingUser(result.user);
      if (result.requiresOtp) {
        setShowOtp(true);
      } else {
        onLoginSuccess(result.user);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    try {
      await authService.verifyOtp(code);
      setShowOtp(false);
      if (pendingUser) {
        onLoginSuccess(pendingUser);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const quickFill = (phone: string) => {
    setIdentifier(phone);
    setPassword('password123');
    setError(null);
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === 'rw' ? 'en' : 'rw';
    setLanguage(nextLang);
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
            {/* Top Bar with Back Button, Language Pill, and Settings Button */}
            <View style={styles.topBar}>
              {onNavigateBack ? (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={onNavigateBack}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Back to Welcome"
                >
                  <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
                  <Text style={styles.backBtnText}>
                    {language === 'rw' ? 'Ahabanza' : 'Welcome'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              <View style={styles.topBarRight}>
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

                <TouchableOpacity
                  style={styles.settingsIconBtn}
                  onPress={() => setShowSettingsModal(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="App Settings and Information"
                >
                  <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Brand Header */}
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <Ionicons name="leaf" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.appName}>{t.common.appName}</Text>
              <Text style={styles.tagline}>{t.common.tagline}</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{t.auth.welcomeBack}</Text>
              <Text style={styles.formSubtitle}>{t.auth.signInPrompt}</Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text style={styles.errorBoxText}>{error}</Text>
                </View>
              ) : null}

              <FormField
                label={t.auth.phoneOrEmail}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                placeholder="+250 788..."
                icon="call-outline"
              />

              <FormField
                label={t.auth.password}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                icon="lock-closed-outline"
              />

              <Button
                title={loading ? t.auth.loggingIn : t.auth.login}
                onPress={handleLogin}
                loading={loading}
                size="large"
                style={styles.submitBtn}
                fullWidth
              />

              {onNavigateToRegister && (
                <View style={styles.registerLinkRow}>
                  <Text style={styles.registerLinkText}>{t.auth.noAccountPrompt} </Text>
                  <TouchableOpacity
                    onPress={onNavigateToRegister}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.registerHighlightText}>{t.auth.createAccount}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Quick Demo Fill Buttons */}
              <View style={styles.demoSection}>
                <View style={styles.demoHeaderRow}>
                  <Text style={styles.demoSectionTitle}>{t.auth.quickFill}</Text>
                  <Text style={styles.demoSectionHint}>Tap to load credentials</Text>
                </View>

                <View style={styles.demoButtonsContainer}>
                  <TouchableOpacity
                    style={styles.demoChip}
                    onPress={() => quickFill('+250788111222')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.demoIconWrap, { backgroundColor: '#DCFCE7' }]}>
                      <Ionicons name="leaf" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.demoTextWrap}>
                      <Text style={styles.demoChipTitle}>{t.auth.supplierDemo}</Text>
                      <Text style={styles.demoChipPhone}>+250 788 111 222 (Cooperative)</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={colors.neutralLight} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.demoChip}
                    onPress={() => quickFill('+250788333444')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.demoIconWrap, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="clipboard" size={16} color={colors.warningDark} />
                    </View>
                    <View style={styles.demoTextWrap}>
                      <Text style={styles.demoChipTitle}>{t.auth.agentDemo}</Text>
                      <Text style={styles.demoChipPhone}>+250 788 333 444 (Field Agent)</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={colors.neutralLight} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.demoChip}
                    onPress={() => quickFill('+250788555666')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.demoIconWrap, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="business" size={16} color={colors.infoDark} />
                    </View>
                    <View style={styles.demoTextWrap}>
                      <Text style={styles.demoChipTitle}>{t.auth.buyerDemo}</Text>
                      <Text style={styles.demoChipPhone}>+250 788 555 666 (Millers Ltd)</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={colors.neutralLight} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.demoChip}
                    onPress={() => quickFill('+250788999000')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.demoIconWrap, { backgroundColor: '#F1F5F9' }]}>
                      <Ionicons name="settings" size={16} color={colors.neutralDark} />
                    </View>
                    <View style={styles.demoTextWrap}>
                      <Text style={styles.demoChipTitle}>{t.auth.adminDemo}</Text>
                      <Text style={styles.demoChipPhone}>+250 788 999 000 (Admin)</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={colors.neutralLight} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Settings / System Info Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="settings-sharp" size={20} color={colors.primary} />
                <Text style={styles.modalTitle}>System Settings & Info</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSettingsModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.neutralGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Platform</Text>
                <Text style={styles.infoValue}>Cargo Rwanda Marketplace V1</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Server Gateway</Text>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Connected</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Timezone</Text>
                <Text style={styles.infoValue}>Central Africa Time (CAT, UTC+2)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Language</Text>
                <TouchableOpacity
                  style={styles.langToggleBtn}
                  onPress={toggleLanguage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.langToggleBtnText}>
                    {language === 'rw' ? 'Kinyarwanda (Changer)' : 'English (Change)'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title="Close"
              onPress={() => setShowSettingsModal(false)}
              variant="secondary"
              fullWidth
              style={styles.modalCloseBtn}
            />
          </View>
        </View>
      </Modal>

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
    paddingHorizontal: spacing.md,
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
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    gap: 6,
  },
  langPillText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.md,
  },
  appName: {
    ...typography.h1,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    ...typography.caption,
    fontSize: 13,
    color: '#DCFCE7',
    marginTop: 2,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  formTitle: {
    ...typography.h2,
    fontSize: 20,
    color: colors.neutralHeadings,
  },
  formSubtitle: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  errorBoxText: {
    ...typography.caption,
    color: colors.danger,
    marginLeft: spacing.xs,
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
  registerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  registerLinkText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.neutralGray,
  },
  registerHighlightText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  demoSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  demoSectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoSectionHint: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralLight,
  },
  demoButtonsContainer: {
    gap: spacing.xs + 2,
  },
  demoChip: {
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  demoTextWrap: {
    flex: 1,
  },
  demoChipTitle: {
    ...typography.bodyMedium,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralHeadings,
  },
  demoChipPhone: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settingsModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  modalTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.neutralHeadings,
  },
  modalBody: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.neutralGray,
  },
  infoValue: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutralHeadings,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.successDark,
  },
  langToggleBtn: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langToggleBtnText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  modalCloseBtn: {
    marginTop: spacing.xs,
  },
});
