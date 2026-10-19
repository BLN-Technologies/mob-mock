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
import { VerificationStatus } from '../../domain/enums';

interface SupplierOnboardingScreenProps {
  user: User;
  organization?: Organization;
  onComplete: () => Promise<void> | void;
}

export const SupplierOnboardingScreen: React.FC<SupplierOnboardingScreenProps> = ({
  user,
  organization,
  onComplete,
}) => {
  const { t, language } = useTranslation();

  const [orgName, setOrgName] = useState(
    organization?.name && !organization.name.includes('Organization')
      ? organization.name
      : `${user.fullName}'s Cooperative`
  );
  const [district, setDistrict] = useState(organization?.district || 'Nyagatare');
  const [sector, setSector] = useState(organization?.sector || 'Karangazi');
  const [address, setAddress] = useState('Main Depot / Warehouse Site');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);

    if (!orgName.trim()) {
      setError(
        language === 'rw'
          ? 'Izina rya Koperative cyangwa ishyirahamwe rirakenewe.'
          : 'Cooperative or supplier organization name is required.'
      );
      return;
    }

    setLoading(true);
    try {
      if (organization) {
        organization.name = orgName.trim();
        organization.district = district.trim();
        organization.sector = sector.trim();
      }
      await onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to complete supplier onboarding.');
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
                <Ionicons name="leaf" size={32} color="#174A35" />
              </View>
              <Text style={styles.title}>
                {language === 'rw' ? 'Kwinjiza Amakuru ya Koperative' : 'Supplier Organization Onboarding'}
              </Text>
              <Text style={styles.subtitle}>
                {language === 'rw'
                  ? 'Kuzuza amakuru y\'ibanze ya Koperative n\'aho iherereye kugira ngo ubashe kumenyekanisha umusaruro no kwakira abagenzuzi.'
                  : 'Confirm your cooperative or organization details so field inspectors can locate pickup sites and inspect harvest lots.'}
              </Text>
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#B42318" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.formCard}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {language === 'rw' ? 'Izina rya Koperative / Ishyirahamwe' : 'Cooperative / Organization Name'}{' '}
                  <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="people-outline" size={18} color="#66716A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={orgName}
                    onChangeText={setOrgName}
                    placeholder="e.g. Koperative Icyerekezo Nyagatare"
                    placeholderTextColor="#94A3B8"
                    accessibilityLabel="Cooperative Name"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {language === 'rw' ? 'Akarere' : 'District'} <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="location-outline" size={18} color="#66716A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={district}
                    onChangeText={setDistrict}
                    placeholder="Nyagatare"
                    placeholderTextColor="#94A3B8"
                    accessibilityLabel="District"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {language === 'rw' ? 'Umurenge' : 'Sector'} <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="map-outline" size={18} color="#66716A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={sector}
                    onChangeText={setSector}
                    placeholder="Karangazi"
                    placeholderTextColor="#94A3B8"
                    accessibilityLabel="Sector"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {language === 'rw' ? 'Icyicaro cy\'Ububiko / Ahakirirwa Umusaruro' : 'Pickup Site / Warehouse Location'}
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="home-outline" size={18} color="#66716A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="e.g. Central Warehouse, Nyagatare Town"
                    placeholderTextColor="#94A3B8"
                    accessibilityLabel="Pickup Site"
                  />
                </View>
              </View>

              {/* Submit */}
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
                      {language === 'rw' ? 'Emeza Ukomeze ku Dashboard' : 'Save & Enter Dashboard'}
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
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#202822',
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
