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
import { authService } from '../../services/mock/mockServices';
import { User } from '../../domain/models';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { t, language, setLanguage } = useTranslation();
  const [identifier, setIdentifier] = useState('+250788111222');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Language Toggle */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.langPill}
              onPress={toggleLanguage}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Ionicons name="globe-outline" size={14} color="#FFFFFF" />
              <Text style={styles.langPillText}>
                {language === 'rw' ? 'English' : 'Ikinyarwanda'}
              </Text>
            </TouchableOpacity>
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
              prefix="📞"
            />

            <FormField
              label={t.auth.password}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              prefix="🔒"
            />

            <Button
              title={loading ? t.auth.loggingIn : t.auth.login}
              onPress={handleLogin}
              loading={loading}
              size="large"
              style={styles.submitBtn}
              fullWidth
            />

            {/* Quick Demo Fill Buttons with clean vector icons */}
            <View style={styles.demoSection}>
              <Text style={styles.demoSectionTitle}>{t.auth.quickFill}</Text>
              <View style={styles.demoButtonsContainer}>
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => quickFill('+250788111222')}
                  activeOpacity={0.8}
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
                  activeOpacity={0.8}
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
                  activeOpacity={0.8}
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
                  activeOpacity={0.8}
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
    justifyContent: 'center',
    padding: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    gap: 4,
  },
  langPillText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  appName: {
    ...typography.h1,
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    ...typography.caption,
    fontSize: 14,
    color: '#DCFCE7',
    marginTop: 2,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
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
  demoSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  demoSectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
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
});
