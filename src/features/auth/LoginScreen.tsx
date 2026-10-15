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
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { OtpModal } from './OtpModal';
import { authService } from '../../services/mock/mockServices';
import { User } from '../../domain/models';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Ionicons name="leaf" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>{t.common.appName}</Text>
            <Text style={styles.tagline}>{t.common.tagline}</Text>
          </View>

          {/* Form */}
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
              placeholder="+250788111222"
            />

            <FormField
              label={t.auth.password}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <Button
              title={loading ? t.auth.loggingIn : t.auth.login}
              onPress={handleLogin}
              loading={loading}
              style={styles.submitBtn}
            />

            {/* Quick Demo Fill Buttons */}
            <View style={styles.demoSection}>
              <Text style={styles.demoSectionTitle}>{t.auth.quickFill}:</Text>
              <View style={styles.demoButtonsContainer}>
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => quickFill('+250788111222')}
                >
                  <Text style={styles.demoChipText}>🌾 {t.auth.supplierDemo}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => quickFill('+250788333444')}
                >
                  <Text style={styles.demoChipText}>📋 {t.auth.agentDemo}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => quickFill('+250788555666')}
                >
                  <Text style={styles.demoChipText}>🏢 {t.auth.buyerDemo}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => quickFill('+250788999000')}
                >
                  <Text style={styles.demoChipText}>⚙️ {t.auth.adminDemo}</Text>
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
    backgroundColor: '#0FAA38',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0B3B24',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#DCFCE7',
    marginTop: 4,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.neutralGray,
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: 10,
    borderRadius: radii.sm,
    marginBottom: 16,
  },
  errorBoxText: {
    color: colors.danger,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  submitBtn: {
    marginTop: 8,
  },
  demoSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  demoSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  demoButtonsContainer: {
    gap: 8,
  },
  demoChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoChipText: {
    fontSize: 13,
    color: colors.neutralDark,
    fontWeight: '500',
  },
});
