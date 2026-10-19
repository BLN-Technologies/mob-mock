import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation, Language } from '../../i18n';
import { authService, normalizeRwandanPhone, isValidEmail } from '../../services/mock/mockServices';
import { User } from '../../domain/models';

interface RegisterScreenProps {
  onRegisterSuccess: (user: User) => void;
  onNavigateToLogin: () => void;
  onBackToRoleSelect?: () => void;
  onBackToWelcome?: () => void;
  selectedRole?: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onBackToWelcome,
}) => {
  const { t, language, setLanguage } = useTranslation();

  // Contact method toggle
  const [contactMethod, setContactMethod] = useState<'phone' | 'email'>('phone');

  // Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Status & Validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

    if (contactMethod === 'phone') {
      const clean = phone.trim().replace(/\s+/g, '');
      const normalized = normalizeRwandanPhone(clean);
      if (!clean || normalized.length < 10) {
        errors.phone = t.auth.errPhoneRequired;
      }
    } else {
      if (!email.trim() || !isValidEmail(email)) {
        errors.email = t.auth.errEmailRequired;
      }
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
    if (loading) return; // Prevent duplicate submissions
    setServerError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const result = await authService.registerAccount({
        fullName: fullName.trim(),
        phone: contactMethod === 'phone' ? phone.trim() : undefined,
        email: contactMethod === 'email' ? email.trim() : undefined,
        password,
        preferredLanguage: language,
        acceptedTerms: agreedToTerms,
      });

      onRegisterSuccess(result.user);
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onNavigateToLogin}
              accessibilityLabel="Back to sign in"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={20} color="#202822" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.langPill} onPress={toggleLanguage}>
              <Ionicons name="globe-outline" size={13} color="#174A35" />
              <Text style={styles.langText}>
                {language === 'rw' ? 'English' : 'Kinyarwanda'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>{t.auth.createAccount}</Text>
            <Text style={styles.subtitle}>
              {language === 'rw'
                ? 'Iyandikishe maze konti yawe yemerwe na Cargo mbere yo gukoresha umwanya w\'akazi.'
                : 'Create your account. Cargo Operations will verify your details and authorize your access.'}
            </Text>
          </View>

          {serverError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#B42318" />
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.formCard}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {t.auth.fullName} <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, fieldErrors.fullName && styles.inputWrapperError]}>
                <Ionicons name="person-outline" size={18} color="#66716A" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={language === 'rw' ? 'Urugero: Jean de Dieu Mugabo' : 'e.g. Jean de Dieu Mugabo'}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  accessibilityLabel={t.auth.fullName}
                />
              </View>
              {fieldErrors.fullName && <Text style={styles.fieldErrorText}>{fieldErrors.fullName}</Text>}
            </View>

            {/* Contact Method Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {language === 'rw' ? 'Uburyo bwo Kukubona' : 'Contact Method'} <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.methodSelector}>
                <TouchableOpacity
                  style={[styles.methodTab, contactMethod === 'phone' && styles.methodTabActive]}
                  onPress={() => setContactMethod('phone')}
                >
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={contactMethod === 'phone' ? '#FFFFFF' : '#66716A'}
                  />
                  <Text style={[styles.methodTabText, contactMethod === 'phone' && styles.methodTabTextActive]}>
                    {language === 'rw' ? 'Telefone' : 'Phone Number'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.methodTab, contactMethod === 'email' && styles.methodTabActive]}
                  onPress={() => setContactMethod('email')}
                >
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={contactMethod === 'email' ? '#FFFFFF' : '#66716A'}
                  />
                  <Text style={[styles.methodTabText, contactMethod === 'email' && styles.methodTabTextActive]}>
                    {language === 'rw' ? 'Imeli' : 'Email Address'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Phone Input */}
              {contactMethod === 'phone' && (
                <View style={[styles.inputWrapper, fieldErrors.phone && styles.inputWrapperError]}>
                  <View style={styles.countryCodeBadge}>
                    <Text style={styles.countryCodeText}>🇷🇼 +250</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="788 123 456"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    accessibilityLabel="Phone Number"
                  />
                </View>
              )}

              {/* Email Input */}
              {contactMethod === 'email' && (
                <View style={[styles.inputWrapper, fieldErrors.email && styles.inputWrapperError]}>
                  <Ionicons name="mail-outline" size={18} color="#66716A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@organization.rw"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    accessibilityLabel="Email Address"
                  />
                </View>
              )}

              {fieldErrors.phone && <Text style={styles.fieldErrorText}>{fieldErrors.phone}</Text>}
              {fieldErrors.email && <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {t.auth.password} <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, fieldErrors.password && styles.inputWrapperError]}>
                <Ionicons name="lock-closed-outline" size={18} color="#66716A" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  accessibilityLabel={t.auth.password}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(p => !p)}
                  style={styles.eyeBtn}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#66716A" />
                </TouchableOpacity>
              </View>
              {fieldErrors.password && <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {t.auth.confirmPassword} <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, fieldErrors.confirmPassword && styles.inputWrapperError]}>
                <Ionicons name="lock-closed-outline" size={18} color="#66716A" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  accessibilityLabel={t.auth.confirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(p => !p)}
                  style={styles.eyeBtn}
                  accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#66716A" />
                </TouchableOpacity>
              </View>
              {fieldErrors.confirmPassword && (
                <Text style={styles.fieldErrorText}>{fieldErrors.confirmPassword}</Text>
              )}
            </View>

            {/* Password Requirement notice */}
            <View style={styles.requirementBox}>
              <Ionicons
                name={password.length >= 6 ? 'checkmark-circle' : 'information-circle-outline'}
                size={14}
                color={password.length >= 6 ? '#174A35' : '#66716A'}
              />
              <Text style={[styles.requirementText, password.length >= 6 && { color: '#174A35' }]}>
                {language === 'rw' ? 'Byibura inyuguti cyangwa imibare 6' : 'Must contain at least 6 characters'}
              </Text>
            </View>

            {/* Terms and Privacy Checkbox */}
            <View style={styles.termsRow}>
              <TouchableOpacity
                style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}
                onPress={() => setAgreedToTerms(a => !a)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreedToTerms }}
              >
                {agreedToTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.termsLabel}>
                  {language === 'rw' ? 'Nemeye ' : 'I agree to Cargo '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => {
                      setTermsModalType('terms');
                      setShowTermsModal(true);
                    }}
                  >
                    {language === 'rw' ? 'Amategeko n\'Amabwiriza' : 'Terms & Conditions'}
                  </Text>
                  {language === 'rw' ? ' na ' : ' and '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => {
                      setTermsModalType('privacy');
                      setShowTermsModal(true);
                    }}
                  >
                    {language === 'rw' ? 'Politiki y\'Umutekano w\'Amakuru' : 'Privacy Policy'}
                  </Text>
                  .
                </Text>
              </View>
            </View>
            {fieldErrors.terms && <Text style={styles.fieldErrorText}>{fieldErrors.terms}</Text>}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>{t.auth.createAccount}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Sign in prompt */}
            <View style={styles.signInRow}>
              <Text style={styles.signInPrompt}>{t.auth.alreadyHaveAccount} </Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={styles.signInLinkText}>{t.auth.signInLink}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms Modal */}
      <Modal visible={showTermsModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {termsModalType === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
              </Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Ionicons name="close" size={22} color="#202822" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>
                {termsModalType === 'terms'
                  ? `Cargo Mobile V1 Platform Terms of Service\n\n1. Agricultural Stock & Warehousing:\nAll stock declarations are subject to certified agronomist inspection before buyer availability (BR-01, BR-02).\n\n2. Escrow & Settlement Integrity:\nPayments are placed into trusted escrow and disbursements strictly conserved according to fee schedules (BR-03, BR-04).\n\n3. Approval-Based Governance:\nCargo Operations oversees role provisioning to ensure market trust and food security compliance.`
                  : `Cargo Rwanda Privacy Commitment (BR-05)\n\n1. Farmer Privacy:\nPrivate farm coordinates and personal phone numbers of individual cooperative members are never exposed to commercial buyers.\n\n2. Secure Verification:\nContact data is solely used for authentication and logistics dispatch.`}
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowTermsModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8F5',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE4DD',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF2EC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE4DD',
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#174A35',
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#202822',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#66716A',
    marginTop: 6,
    lineHeight: 18,
  },
  errorBanner: {
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
  errorBannerText: {
    fontSize: 13,
    color: '#B42318',
    flex: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCE4DD',
    ...shadows.sm,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202822',
  },
  required: {
    color: '#B42318',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8F5',
    borderWidth: 1,
    borderColor: '#DCE4DD',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputWrapperError: {
    borderColor: '#B42318',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#202822',
  },
  countryCodeBadge: {
    marginRight: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#DCE4DD',
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202822',
  },
  eyeBtn: {
    padding: 6,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#B42318',
    marginTop: 2,
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F7F8F5',
    borderRadius: 10,
    padding: 3,
    gap: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DCE4DD',
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  methodTabActive: {
    backgroundColor: '#174A35',
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#66716A',
  },
  methodTabTextActive: {
    color: '#FFFFFF',
  },
  requirementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
  },
  requirementText: {
    fontSize: 12,
    color: '#66716A',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#66716A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#174A35',
    borderColor: '#174A35',
  },
  termsLabel: {
    fontSize: 12,
    color: '#66716A',
    lineHeight: 18,
  },
  termsLink: {
    color: '#174A35',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#174A35',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  signInPrompt: {
    fontSize: 13,
    color: '#66716A',
  },
  signInLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#174A35',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202822',
  },
  modalScroll: {
    marginVertical: 10,
  },
  modalBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  modalCloseBtn: {
    backgroundColor: '#174A35',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
