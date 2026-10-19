import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing, shadows } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { authService } from '../../services/mock/mockServices';
import { User } from '../../domain/models';
import { UserRole } from '../../domain/enums';

interface VerificationStatusScreenProps {
  user: User;
  onStatusUpdated: (updatedUser: User) => void;
  onSignOut: () => void;
}

export const VerificationStatusScreen: React.FC<VerificationStatusScreenProps> = ({
  user,
  onStatusUpdated,
  onSignOut,
}) => {
  const { t, language } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [simulatingRole, setSimulatingRole] = useState<UserRole>(UserRole.BUYER);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const contactDisplay = currentUser.phone || currentUser.email || 'your registered contact';

  const handleVerify = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMessage(
        language === 'rw'
          ? 'Injiza imibare 6 y\'umutekano (urugero: 123456).'
          : 'Please enter the 6-digit verification code (e.g. 123456).'
      );
      return;
    }

    setLoading(true);
    try {
      const result = await authService.verifyContact(cleanCode, currentUser.id);
      setCurrentUser(result.user);
      setSuccessNotice(
        language === 'rw'
          ? 'Imyirondoro yemejwe neza! Konti yawe iri gusuzumwa na Cargo.'
          : 'Contact verified successfully! Your account is now pending Cargo Operations approval.'
      );
      onStatusUpdated(result.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldownSeconds > 0) return;
    setErrorMessage(null);
    setSuccessNotice(
      language === 'rw'
        ? `Kode nshya yoherejwe kuri ${contactDisplay}.`
        : `New verification code sent to ${contactDisplay}.`
    );
    setCooldownSeconds(60);
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { approvalStatus, user: refreshed } = await authService.checkApprovalStatus(currentUser.id);
      setCurrentUser(refreshed);
      if (approvalStatus === 'APPROVED') {
        onStatusUpdated(refreshed);
      } else {
        setSuccessNotice(
          language === 'rw'
            ? 'Konti iracyari mu isuzuma rya Cargo Operations.'
            : 'Account is still under review by Cargo Operations.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to refresh status.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateApproval = async (role: UserRole) => {
    setLoading(true);
    try {
      const approved = await authService.simulateCargoApproval(currentUser.id, role);
      setCurrentUser(approved);
      onStatusUpdated(approved);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to simulate approval.');
    } finally {
      setLoading(false);
    }
  };

  const isContactVerified = Boolean(currentUser.contactVerified);
  const isApprovalPending = isContactVerified && currentUser.approvalStatus === 'PENDING';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={isApprovalPending ? 'time-outline' : 'shield-checkmark-outline'}
                size={36}
                color="#174A35"
              />
            </View>
            <Text style={styles.title}>
              {isApprovalPending
                ? language === 'rw'
                  ? 'Gusuzuma Konti birakomeje'
                  : 'Cargo Approval Pending'
                : language === 'rw'
                ? 'Emeza Imyirondoro'
                : 'Verify Your Contact'}
            </Text>
            <Text style={styles.subtitle}>
              {isApprovalPending
                ? language === 'rw'
                  ? `Konti ya ${currentUser.fullName} yemejwe ku myirondoro, ubu iri gusuzumwa n'ubuyobozi bwa Cargo kugira ngo ihabwe uburenganzira bukwiye.`
                  : `Your contact has been verified. Cargo Operations is currently reviewing your account to authorize role permissions and dashboard access.`
                : language === 'rw'
                ? `Injiza kode y\'imibare 6 yoherejwe kuri ${contactDisplay}.`
                : `Enter the 6-digit code sent to ${contactDisplay} to confirm your account.`}
            </Text>
          </View>

          {/* Error & Success Feedback Banners */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#B42318" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {successNotice && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#174A35" />
              <Text style={styles.successText}>{successNotice}</Text>
            </View>
          )}

          {/* State 1: Contact Verification Code Input */}
          {!isContactVerified && (
            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>
                {language === 'rw' ? 'Kode y\'Umutekano (Imibare 6)' : 'Verification Code (6 Digits)'}
              </Text>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                accessibilityLabel="Verification Code Input"
              />

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      {language === 'rw' ? 'Emeza Ukomeze' : 'Verify & Continue'}
                    </Text>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>
                  {language === 'rw' ? 'Ntabwo wabonye kode?' : "Didn't receive code?"}{' '}
                </Text>
                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={cooldownSeconds > 0}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.resendLink,
                      cooldownSeconds > 0 && styles.resendLinkDisabled,
                    ]}
                  >
                    {cooldownSeconds > 0
                      ? language === 'rw'
                        ? `Ongera wohereze (${cooldownSeconds}s)`
                        : `Resend in ${cooldownSeconds}s`
                      : language === 'rw'
                      ? 'Ongera wohereze'
                      : 'Resend code'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.demoHint}>
                {language === 'rw'
                  ? 'Icyitonderwa cy\'Igerageza: Koresha kode 123456 kwemeza.'
                  : 'Demo Note: Enter 123456 to verify in prototype mode.'}
              </Text>
            </View>
          )}

          {/* State 2: Contact Verified, Cargo Approval Pending */}
          {isApprovalPending && (
            <View style={styles.approvalCard}>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusBadgeText}>
                  {language === 'rw' ? 'GUSUZUMA BIRAKOMEJE' : 'APPROVAL PENDING'}
                </Text>
              </View>

              <View style={styles.verifiedInfoRow}>
                <Ionicons name="checkmark-circle" size={18} color="#174A35" />
                <Text style={styles.verifiedInfoText}>
                  {contactDisplay} · {language === 'rw' ? 'Yemejwe' : 'Verified'}
                </Text>
              </View>

              <View style={styles.stepsList}>
                <View style={styles.stepItem}>
                  <Ionicons name="checkmark-done" size={16} color="#174A35" />
                  <Text style={styles.stepTextDone}>
                    {language === 'rw' ? '1. Konti yaremwe' : '1. Account Created'}
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <Ionicons name="checkmark-done" size={16} color="#174A35" />
                  <Text style={styles.stepTextDone}>
                    {language === 'rw' ? '2. Imyirondoro yemejwe' : '2. Contact Verified'}
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <ActivityIndicator size="small" color="#A96812" style={{ marginRight: 2 }} />
                  <Text style={styles.stepTextActive}>
                    {language === 'rw'
                      ? '3. Kwemeza n\'itangwa ry\'inshingano (Cargo Ops)'
                      : '3. Cargo Operations Role Authorization'}
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <Ionicons name="ellipse-outline" size={16} color="#94A3B8" />
                  <Text style={styles.stepTextPending}>
                    {language === 'rw' ? '4. Kwinjira mu mwanya w\'akazi' : '4. Dashboard Access Granted'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleCheckStatus}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#174A35" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={18} color="#174A35" />
                    <Text style={styles.refreshButtonText}>
                      {language === 'rw' ? 'Ongera Usure Imiterere' : 'Check Approval Status'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Demo Mode Role Approval Simulator */}
              <View style={styles.demoSimulatorBox}>
                <Text style={styles.demoSimulatorTitle}>
                  {language === 'rw'
                    ? 'Igerageza rya Cargo Operations:'
                    : 'Cargo Operations Demo Controls:'}
                </Text>
                <Text style={styles.demoSimulatorDesc}>
                  {language === 'rw'
                    ? 'Hitamo urwego rw\'inshingano wemeze muri demo kugira ngo urebe urugendo rwa buri role:'
                    : 'Authorize and assign a role to test role-specific onboarding & dashboards:'}
                </Text>
                <View style={styles.roleBtnRow}>
                  <TouchableOpacity
                    style={[styles.roleSelectBtn, { backgroundColor: '#174A35' }]}
                    onPress={() => handleSimulateApproval(UserRole.BUYER)}
                  >
                    <Ionicons name="cart" size={15} color="#FFFFFF" />
                    <Text style={styles.roleBtnText}>Approve as Buyer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleSelectBtn, { backgroundColor: '#2F6B4F' }]}
                    onPress={() => handleSimulateApproval(UserRole.SUPPLIER)}
                  >
                    <Ionicons name="cube" size={15} color="#FFFFFF" />
                    <Text style={styles.roleBtnText}>Approve as Supplier</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={onSignOut} style={styles.signOutButton} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={16} color="#66716A" />
              <Text style={styles.signOutText}>
                {language === 'rw' ? 'Gusohoka / Subira Kwinjira' : 'Sign Out / Return to Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8F5',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCE4DD',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#202822',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#66716A',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 340,
  },
  errorBanner: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#B42318',
    flex: 1,
  },
  successBanner: {
    width: '100%',
    backgroundColor: '#EAF2EC',
    borderColor: '#DCE4DD',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  successText: {
    fontSize: 13,
    color: '#174A35',
    flex: 1,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCE4DD',
    ...shadows.sm,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202822',
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: '#F7F8F5',
    borderWidth: 1.5,
    borderColor: '#174A35',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: 14,
    color: '#202822',
    marginBottom: 18,
  },
  primaryButton: {
    backgroundColor: '#174A35',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resendLabel: {
    fontSize: 13,
    color: '#66716A',
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#174A35',
  },
  resendLinkDisabled: {
    color: '#94A3B8',
  },
  demoHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  approvalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCE4DD',
    ...shadows.sm,
    gap: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A96812',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A96812',
    letterSpacing: 0.5,
  },
  verifiedInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF2EC',
    padding: 10,
    borderRadius: 8,
  },
  verifiedInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#174A35',
  },
  stepsList: {
    gap: 10,
    paddingVertical: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTextDone: {
    fontSize: 13,
    color: '#174A35',
    fontWeight: '600',
  },
  stepTextActive: {
    fontSize: 13,
    color: '#A96812',
    fontWeight: '700',
  },
  stepTextPending: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EAF2EC',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DCE4DD',
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#174A35',
  },
  demoSimulatorBox: {
    backgroundColor: '#F7F8F5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE4DD',
    gap: 8,
  },
  demoSimulatorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#202822',
  },
  demoSimulatorDesc: {
    fontSize: 11,
    color: '#66716A',
    lineHeight: 16,
  },
  roleBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  roleSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerRow: {
    marginTop: 24,
    alignItems: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  signOutText: {
    fontSize: 13,
    color: '#66716A',
    fontWeight: '600',
  },
});
