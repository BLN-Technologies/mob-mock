import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { shadows } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { User, Organization } from '../../domain/models';

interface BuyerOnboardingScreenProps {
  user: User;
  organization?: Organization;
  onComplete: () => Promise<void> | void;
}

export const BuyerOnboardingScreen: React.FC<BuyerOnboardingScreenProps> = ({
  user,
  organization,
  onComplete,
}) => {
  const { t, language } = useTranslation();

  const [businessName, setBusinessName] = useState(
    organization?.name && !organization.name.includes('Organization')
      ? organization.name
      : ''
  );
  const [tin, setTin] = useState(organization?.tin || '');
  const [district, setDistrict] = useState(organization?.district || 'Gasabo (Kigali)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!businessName.trim()) {
      errors.businessName =
        language === 'rw'
          ? 'Izina ry\'ubucuruzi cyangwa ikigo rirakenewe.'
          : 'Registered business or enterprise name is required.';
    }

    const cleanTin = tin.trim().replace(/\D/g, '');
    if (!cleanTin) {
      errors.tin =
        language === 'rw'
          ? 'Numero ya TIN irakenewe mu kwemeza ubucuruzi.'
          : 'TIN number is required for official procurement compliance.';
    } else if (cleanTin.length !== 9) {
      errors.tin =
        language === 'rw'
          ? 'TIN igomba kuba igizwe n\'imibare 9 y\'umwimerere.'
          : 'Rwanda TIN must consist of exactly 9 digits.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Save business details to organization record
      if (organization) {
        organization.name = businessName.trim();
        organization.tin = tin.trim().replace(/\D/g, '');
        organization.district = district.trim();
      }
      await onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save business details. Please try again.');
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="business" size={32} color="#174A35" />
              </View>
              <Text style={styles.title}>
                {language === 'rw' ? 'Kuzuza Amakuru y\'Ubucuruzi' : 'Buyer Business Onboarding'}
              </Text>
              <Text style={styles.subtitle}>
                {language === 'rw'
                  ? 'Kugira ngo ubashe kugura umusaruro no kwakira inyemezabwishyu za EBM, kuzuza amazina y\'ikigo n\'imibare ya TIN birakenewe.'
                  : 'To purchase agricultural warehouse stock and receive verified EBM trade invoices, enter your commercial registration details.'}
              </Text>
            </View>

            {/* Compliance Guarantee Callout */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#174A35" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoBoxTitle}>
                  {language === 'rw' ? 'Icyitonderwa cy\'Umutekano n\'Imisoro' : 'Regulatory & Tax Compliance'}
                </Text>
                <Text style={styles.infoBoxText}>
                  {language === 'rw'
                    ? 'Amakuru yawe akoreshwa gusa mu kwemeza amasezerano y\'ubuguzi n\'inyemezabwishyu z\'amategeko. Ntabwo ashyirwa ahabona.'
                    : 'Your business credentials are used strictly for settlement contracts and official EBM receipts. Never disclosed to third parties.'}
                </Text>
              </View>
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#B42318" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.formCard}>
              {/* Business Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {language === 'rw' ? 'Izina ry\'Ikigo / Ubucuruzi' : 'Business / Enterprise Name'}{' '}
                  <Text style={styles.required}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, fieldErrors.businessName && styles.inputWrapperError]}>
                  <Ionicons name="briefcase-outline" size={18} color="#66716A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="e.g. Kigali Wholesale Foods Ltd"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                    accessibilityLabel="Business Name"
                  />
                </View>
                {fieldErrors.businessName && (
                  <Text style={styles.errorTextSmall}>{fieldErrors.businessName}</Text>
                )}
              </View>

              {/* TIN Number */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {language === 'rw' ? 'Numero ya TIN (Imibare 9)' : 'TIN Number (9 Digits)'}{' '}
                  <Text style={styles.required}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, fieldErrors.tin && styles.inputWrapperError]}>
                  <Ionicons name="document-text-outline" size={18} color="#66716A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={tin}
                    onChangeText={t => setTin(t.replace(/\D/g, '').slice(0, 9))}
                    placeholder="100234567"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={9}
                    accessibilityLabel="TIN Number"
                  />
                </View>
                {fieldErrors.tin && <Text style={styles.errorTextSmall}>{fieldErrors.tin}</Text>}
              </View>

              {/* Operating District */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {language === 'rw' ? 'Akarere k\'Icyicaro' : 'Operating District'}
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="location-outline" size={18} color="#66716A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={district}
                    onChangeText={setDistrict}
                    placeholder="Gasabo (Kigali)"
                    placeholderTextColor="#94A3B8"
                    accessibilityLabel="Operating District"
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      {language === 'rw' ? 'Bika Ukomeze ku Isoko' : 'Save & Enter Dashboard'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  contentWrapper: {
    width: '100%',
    maxWidth: 440,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCE4DD',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#202822',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#66716A',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EAF2EC',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#DCE4DD',
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#174A35',
  },
  infoBoxText: {
    fontSize: 11,
    color: '#202822',
    lineHeight: 16,
    marginTop: 2,
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
  errorText: {
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
  errorTextSmall: {
    fontSize: 12,
    color: '#B42318',
    marginTop: 2,
  },
  primaryButton: {
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
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
