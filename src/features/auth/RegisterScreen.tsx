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
import { UserRole } from '../../domain/enums';

interface RegisterScreenProps {
  onRegisterSuccess: (user: User) => void;
  onNavigateToLogin: () => void;
  onBackToRoleSelect?: () => void;
  selectedRole?: UserRole.SUPPLIER | UserRole.BUYER;
}

const RWANDA_DISTRICTS = [
  'Nyagatare',
  'Huye',
  'Musanze',
  'Bugesera',
  'Kirehe',
  'Rwamagana',
  'Gasabo (Kigali)',
  'Kicukiro (Kigali)',
  'Nyarugenge (Kigali)',
  'Rubavu',
];

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onBackToRoleSelect,
  selectedRole = UserRole.SUPPLIER,
}) => {
  const { t, language, setLanguage } = useTranslation();

  // Form State
  const [role, setRole] = useState<UserRole.SUPPLIER | UserRole.BUYER>(selectedRole);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [district, setDistrict] = useState('Nyagatare');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Validation & UI State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalType, setTermsModalType] = useState<'terms' | 'privacy'>('terms');

  const toggleLanguage = () => {
    const nextLang: Language = language === 'rw' ? 'en' : 'rw';
    setLanguage(nextLang);
  };

  const validate = (): boolean => {
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

    if ((role === UserRole.SUPPLIER || role === UserRole.BUYER) && !orgName.trim()) {
      errors.orgName = t.auth.errOrgRequired;
    }

    if (!district) {
      errors.district = t.auth.errDistrictRequired;
    }

    if (!password || password.length < 6) {
      errors.password = t.auth.errPasswordMin;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = t.auth.errPasswordMismatch;
    }

    if (!agreedToTerms) {
      errors.terms = t.auth.errTermsRequired;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    setServerError(null);
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        role,
        organizationName: orgName.trim() || undefined,
        district,
        preferredLanguage: language,
      });

      setPendingUser(result.user);
      if (result.requiresOtp) {
        setShowOtp(true);
      } else {
        onRegisterSuccess(result.user);
      }
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    try {
      await authService.verifyOtp(code);
      setShowOtp(false);
      if (pendingUser) {
        onRegisterSuccess(pendingUser);
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
            {/* 1. Top Bar with Back Button and Language Pill */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backToLoginBtn}
                onPress={onBackToRoleSelect || onNavigateToLogin}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
                <Text style={styles.backToLoginText}>
                  {onBackToRoleSelect
                    ? language === 'rw'
                      ? 'Guhindura'
                      : 'Role Selection'
                    : t.auth.signInLink}
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

            {/* 2. Brand Header */}
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <Ionicons name="leaf" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.appName}>{t.common.appName}</Text>
              <Text style={styles.tagline}>{t.common.tagline}</Text>
            </View>

            {/* 3. Main Registration Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{t.auth.createAccount}</Text>
              <Text style={styles.formSubtitle}>{t.auth.createAccountSubtitle}</Text>

              {/* Server or Global Error */}
              {serverError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text style={styles.errorBoxText}>{serverError}</Text>
                </View>
              ) : null}

              {/* Selected Role Banner (Pre-selected from role choice journey) */}
              <View style={styles.selectedRoleBanner}>
                <View
                  style={[
                    styles.selectedRoleIconWrap,
                    {
                      backgroundColor:
                        role === UserRole.SUPPLIER ? '#DCFCE7' : '#DBEAFE',
                    },
                  ]}
                >
                  <Ionicons
                    name={role === UserRole.SUPPLIER ? 'leaf' : 'business'}
                    size={22}
                    color={role === UserRole.SUPPLIER ? colors.primary : colors.infoDark}
                  />
                </View>

                <View style={styles.selectedRoleTextWrap}>
                  <Text style={styles.selectedRolePreTitle}>
                    {t.auth.selectedRoleBanner}
                  </Text>
                  <Text style={styles.selectedRoleMainTitle}>
                    {role === UserRole.SUPPLIER
                      ? t.auth.roleSupplierTitle
                      : t.auth.roleBuyerTitle}
                  </Text>
                  <Text style={styles.selectedRoleSubDesc}>
                    {role === UserRole.SUPPLIER
                      ? t.auth.roleSupplierDesc
                      : t.auth.roleBuyerDesc}
                  </Text>
                </View>

                {onBackToRoleSelect && (
                  <TouchableOpacity
                    style={styles.changeRoleBtn}
                    onPress={onBackToRoleSelect}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t.auth.changeRole}
                  >
                    <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
                    <Text style={styles.changeRoleText}>{t.auth.changeRole}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Personal Information Step */}
              <View style={styles.sectionDividerRow}>
                <View style={styles.sectionNumberBadge}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <Text style={styles.sectionTitle}>
                  {language === 'rw' ? 'Imyirondoro Yawe' : 'Personal Details'}
                </Text>
              </View>

              <FormField
                label={t.auth.fullName}
                value={fullName}
                onChangeText={text => {
                  setFullName(text);
                  setFieldErrors(prev => ({ ...prev, fullName: '' }));
                }}
                placeholder={t.auth.fullNamePlaceholder}
                icon="person-outline"
                error={fieldErrors.fullName}
                autoCapitalize="words"
              />

              <FormField
                label={t.auth.phoneLabel}
                value={phone}
                onChangeText={text => {
                  setPhone(text);
                  setFieldErrors(prev => ({ ...prev, phone: '' }));
                }}
                placeholder={t.auth.phonePlaceholder}
                prefix="+250"
                keyboardType="phone-pad"
                error={fieldErrors.phone}
              />

              <FormField
                label={t.auth.emailLabel}
                value={email}
                onChangeText={setEmail}
                placeholder={t.auth.emailPlaceholder}
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* 2. Role-Specific Business Information */}
              <View style={styles.sectionDividerRow}>
                <View style={styles.sectionNumberBadge}>
                  <Text style={styles.sectionNumberText}>2</Text>
                </View>
                <Text style={styles.sectionTitle}>
                  {role === UserRole.SUPPLIER
                    ? language === 'rw'
                      ? 'Amakuru ya Koperative'
                      : 'Cooperative Information'
                    : role === UserRole.BUYER
                    ? language === 'rw'
                      ? 'Amakuru y\'Ubucuruzi'
                      : 'Business Information'
                    : language === 'rw'
                    ? 'Akarere k\'Umurimo'
                    : 'Field Operations Area'}
                </Text>
              </View>

              {(role === UserRole.SUPPLIER || role === UserRole.BUYER) && (
                <FormField
                  label={
                    role === UserRole.SUPPLIER
                      ? t.auth.cooperativeName
                      : t.auth.buyerBusinessName
                  }
                  value={orgName}
                  onChangeText={text => {
                    setOrgName(text);
                    setFieldErrors(prev => ({ ...prev, orgName: '' }));
                  }}
                  placeholder={
                    role === UserRole.SUPPLIER
                      ? t.auth.cooperativePlaceholder
                      : t.auth.buyerBusinessPlaceholder
                  }
                  icon="business-outline"
                  error={fieldErrors.orgName}
                  autoCapitalize="words"
                />
              )}

              {/* District Selector Chips */}
              <View style={styles.districtWrap}>
                <Text style={styles.inputLabel}>{t.auth.districtLabel}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.districtScroll}>
                  {RWANDA_DISTRICTS.map(d => {
                    const isSelected = district === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[styles.districtChip, isSelected && styles.districtChipActive]}
                        onPress={() => setDistrict(d)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="location"
                          size={12}
                          color={isSelected ? '#FFFFFF' : colors.primary}
                          style={styles.districtIcon}
                        />
                        <Text
                          style={[
                            styles.districtChipText,
                            isSelected && styles.districtChipTextActive,
                          ]}
                        >
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 3. Security & Passwords */}
              <View style={styles.sectionDividerRow}>
                <View style={styles.sectionNumberBadge}>
                  <Text style={styles.sectionNumberText}>3</Text>
                </View>
                <Text style={styles.sectionTitle}>
                  {language === 'rw' ? 'Umutekano & Ijambobanga' : 'Security & Password'}
                </Text>
              </View>

              <FormField
                label={t.auth.passwordLabel}
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  setFieldErrors(prev => ({ ...prev, password: '', confirmPassword: '' }));
                }}
                secureTextEntry
                placeholder="••••••••"
                icon="lock-closed-outline"
                error={fieldErrors.password}
                helper={t.auth.passwordHelper}
              />

              <FormField
                label={t.auth.confirmPasswordLabel}
                value={confirmPassword}
                onChangeText={text => {
                  setConfirmPassword(text);
                  setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                secureTextEntry
                placeholder="••••••••"
                icon="shield-checkmark-outline"
                error={fieldErrors.confirmPassword}
              />

              {/* Real-time Password Match Feedback */}
              {confirmPassword.length > 0 && (
                <View style={styles.passwordMatchRow}>
                  <Ionicons
                    name={
                      password === confirmPassword ? 'checkmark-circle' : 'close-circle'
                    }
                    size={14}
                    color={password === confirmPassword ? colors.success : colors.danger}
                  />
                  <Text
                    style={[
                      styles.passwordMatchText,
                      {
                        color:
                          password === confirmPassword ? colors.successDark : colors.danger,
                      },
                    ]}
                  >
                    {password === confirmPassword
                      ? t.auth.passwordsMatch
                      : t.auth.passwordsDoNotMatch}
                  </Text>
                </View>
              )}

              {/* 8. Terms of Service & Privacy Consent */}
              <TouchableOpacity
                style={styles.termsConsentRow}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                activeOpacity={0.8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreedToTerms }}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreedToTerms && styles.checkboxActive,
                    fieldErrors.terms && styles.checkboxError,
                  ]}
                >
                  {agreedToTerms && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>

                <View style={styles.termsTextWrap}>
                  <Text style={styles.termsMainText}>
                    {language === 'rw'
                      ? 'Ndemera amategeko n\'amabwiriza bya Cargo n\'umutekano w\'amakuru.'
                      : 'I agree to Cargo\'s '}{' '}
                    <Text
                      style={styles.termsLinkText}
                      onPress={() => {
                        setTermsModalType('terms');
                        setShowTermsModal(true);
                      }}
                    >
                      {t.auth.termsOfService}
                    </Text>
                    {language === 'rw' ? ' na ' : ' and '}
                    <Text
                      style={styles.termsLinkText}
                      onPress={() => {
                        setTermsModalType('privacy');
                        setShowTermsModal(true);
                      }}
                    >
                      {t.auth.privacyPolicy}
                    </Text>
                    .
                  </Text>
                </View>
              </TouchableOpacity>

              {fieldErrors.terms ? (
                <Text style={styles.termsErrorText}>{fieldErrors.terms}</Text>
              ) : null}

              {/* 9. Primary Action Button */}
              <Button
                title={loading ? t.auth.creatingAccount : t.auth.createAccountAction}
                onPress={handleRegister}
                loading={loading}
                size="large"
                style={styles.submitBtn}
                fullWidth
              />

              {/* 10. Direct Sign-in Link */}
              <View style={styles.bottomSignInRow}>
                <Text style={styles.bottomSignInText}>{t.auth.alreadyHaveAccount} </Text>
                <TouchableOpacity
                  onPress={onNavigateToLogin}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.bottomSignInLink}>{t.auth.signInLink}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 11. Terms & Privacy Policy Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.termsModalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons
                  name={termsModalType === 'terms' ? 'document-text' : 'shield-checkmark'}
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.modalTitle}>
                  {termsModalType === 'terms' ? t.auth.termsOfService : t.auth.privacyPolicy}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowTermsModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.neutralGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {termsModalType === 'terms' ? (
                <View style={styles.termsContent}>
                  <Text style={styles.policyHeading}>1. Platform Rules & Business Standards</Text>
                  <Text style={styles.policyBody}>
                    Cargo operates a verified agricultural trading network across Rwanda. Suppliers confirm harvested produce under BR-01. Buyers purchase inspected lots with Cargo escrow settlement under BR-03.
                  </Text>
                  <Text style={styles.policyHeading}>2. Quality & Inspections</Text>
                  <Text style={styles.policyBody}>
                    All produce lots undergo moisture, defect, and foreign-matter physical verification by licensed field agents before buyer catalog visibility (BR-02).
                  </Text>
                  <Text style={styles.policyHeading}>3. Trade Settlement & Delivery</Text>
                  <Text style={styles.policyBody}>
                    Payment is secured upon order confirmation and released to suppliers following verified delivery receipts.
                  </Text>
                </View>
              ) : (
                <View style={styles.termsContent}>
                  <Text style={styles.policyHeading}>1. Farmer Privacy Assurance (BR-05)</Text>
                  <Text style={styles.policyBody}>
                    Individual farmer coordinates and personal contacts remain confidential. Trades are coordinated through verified cooperatives and Cargo aggregation hubs.
                  </Text>
                  <Text style={styles.policyHeading}>2. Data Security</Text>
                  <Text style={styles.policyBody}>
                    Your account phone number and personal details are encrypted and utilized strictly for commercial order coordination and two-factor SMS security.
                  </Text>
                </View>
              )}
            </ScrollView>

            <Button
              title={t.common.confirm}
              onPress={() => setShowTermsModal(false)}
              fullWidth
              style={styles.modalCloseBtn}
            />
          </View>
        </View>
      </Modal>

      {/* 12. Two-Factor Verification Modal */}
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
    paddingBottom: spacing.xxxl,
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
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
  },
  backToLoginText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.md,
  },
  appName: {
    ...typography.h1,
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.caption,
    fontSize: 12,
    color: '#DCFCE7',
    marginTop: 2,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...shadows.lg,
  },
  formTitle: {
    ...typography.h2,
    fontSize: 20,
    color: colors.neutralHeadings,
  },
  formSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.neutralGray,
    marginTop: 3,
    marginBottom: spacing.md,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBoxText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.danger,
    flex: 1,
    lineHeight: 16,
  },
  sectionDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionTitle: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '800',
    color: colors.neutralHeadings,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedRoleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  selectedRoleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRoleTextWrap: {
    flex: 1,
  },
  selectedRolePreTitle: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutralGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedRoleMainTitle: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '800',
    color: colors.neutralHeadings,
  },
  selectedRoleSubDesc: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
    marginTop: 1,
    lineHeight: 14,
  },
  changeRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.md,
  },
  changeRoleText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  districtWrap: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutralHeadings,
    marginBottom: spacing.xs,
  },
  districtScroll: {
    flexDirection: 'row',
  },
  districtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    marginRight: spacing.xs + 2,
    gap: 4,
  },
  districtChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  districtIcon: {
    marginRight: 2,
  },
  districtChipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutralHeadings,
  },
  districtChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  passwordMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  passwordMatchText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  termsConsentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.neutralGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxError: {
    borderColor: colors.danger,
  },
  termsTextWrap: {
    flex: 1,
  },
  termsMainText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralBody,
    lineHeight: 16,
  },
  termsLinkText: {
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  termsErrorText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  bottomSignInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  bottomSignInText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.neutralGray,
  },
  bottomSignInLink: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  termsModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '80%',
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  modalTitle: {
    ...typography.h3,
    fontSize: 17,
    color: colors.neutralHeadings,
  },
  modalBody: {
    marginBottom: spacing.md,
  },
  termsContent: {
    gap: spacing.sm,
  },
  policyHeading: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginTop: spacing.xs,
  },
  policyBody: {
    ...typography.caption,
    fontSize: 12,
    color: colors.neutralBody,
    lineHeight: 18,
  },
  modalCloseBtn: {
    marginTop: spacing.xs,
  },
});
