import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { lotService } from '../../services/mock/mockServices';
import { localStorage } from '../../data/local/storage';
import { User } from '../../domain/models';

interface CreateLotWizardProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateLotWizard: React.FC<CreateLotWizardProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [cropName, setCropName] = useState('Maize');
  const [variety, setVariety] = useState('Nyirakaragaza');
  const [totalQuantityKg, setTotalQuantityKg] = useState('5000');
  const [pricePerKgRwf, setPricePerKgRwf] = useState('420');
  const [harvestDate, setHarvestDate] = useState('2026-10-10');
  const [availabilityDate, setAvailabilityDate] = useState('2026-10-20');
  const [harvestConfirmed, setHarvestConfirmed] = useState(true);
  const [pickupDistrict, setPickupDistrict] = useState('Nyagatare');
  const [pickupSector, setPickupSector] = useState('Karangazi');
  const [pickupLocationDetails, setPickupLocationDetails] = useState('Main cooperative silo, Karangazi centre');
  const [photos] = useState<string[]>([
    'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600',
  ]);

  const handleSaveDraft = async () => {
    try {
      await localStorage.saveLotDraft({
        id: `draft-${Date.now()}`,
        cropName,
        variety,
        totalQuantityKg: Number(totalQuantityKg),
        pricePerKgRwf: Number(pricePerKgRwf),
        pickupDistrict,
        savedAt: new Date().toISOString(),
      });
      Alert.alert('Draft Saved', 'Your lot declaration draft has been saved on this device.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await lotService.createLot(
        {
          cropName,
          variety,
          totalQuantityKg: Number(totalQuantityKg),
          pricePerKgRwf: Number(pricePerKgRwf),
          harvestDate,
          availabilityDate,
          pickupDistrict,
          pickupSector,
          pickupLocationDetails,
          photos,
          harvestConfirmed,
        },
        user
      );
      Alert.alert(
        'Lot Submitted',
        'Your harvest lot declaration has been submitted for field agent grading and inspection (FR-LOT-01).',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Wizard Step Indicator */}
      <View style={styles.stepIndicatorRow}>
        <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
          <Text style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>1</Text>
        </View>
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
          <Text style={[styles.stepDotText, step >= 2 && styles.stepDotTextActive]}>2</Text>
        </View>
        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
          <Text style={[styles.stepDotText, step >= 3 && styles.stepDotTextActive]}>3</Text>
        </View>
      </View>

      <Text style={styles.wizardTitle}>
        {step === 1 && 'Step 1: Crop & Quantity'}
        {step === 2 && 'Step 2: Harvest Verification'}
        {step === 3 && 'Step 3: Location & Photos'}
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {step === 1 && (
        <View>
          <FormField
            label={t.supplier.cropType}
            value={cropName}
            onChangeText={setCropName}
            placeholder="Maize, Dry Beans, Irish Potatoes"
          />
          <FormField
            label={t.supplier.variety}
            value={variety}
            onChangeText={setVariety}
            placeholder="e.g. Nyirakaragaza, Yellow beans"
          />
          <FormField
            label={t.supplier.quantityKg}
            value={totalQuantityKg}
            onChangeText={setTotalQuantityKg}
            keyboardType="numeric"
            placeholder="5000"
            helper="Minimum quantity is 50 kg"
          />
          <FormField
            label={t.supplier.pricePerKg}
            value={pricePerKgRwf}
            onChangeText={setPricePerKgRwf}
            keyboardType="numeric"
            placeholder="420"
            helper="Whole number in Rwandan Francs"
          />
        </View>
      )}

      {step === 2 && (
        <View>
          {/* BR-01 Harvest Confirmation Gate */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setHarvestConfirmed(!harvestConfirmed)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, harvestConfirmed && styles.checkboxActive]}>
              {harvestConfirmed && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>{t.supplier.harvestConfirmation}</Text>
          </TouchableOpacity>

          <FormField
            label={t.supplier.harvestDate}
            value={harvestDate}
            onChangeText={setHarvestDate}
            placeholder="YYYY-MM-DD"
            helper="Must be today or earlier (BR-01)"
          />

          <FormField
            label={t.supplier.availabilityDate}
            value={availabilityDate}
            onChangeText={setAvailabilityDate}
            placeholder="YYYY-MM-DD"
            helper="Date produce is ready for pickup/dispatch"
          />
        </View>
      )}

      {step === 3 && (
        <View>
          <FormField
            label={t.supplier.pickupDistrict}
            value={pickupDistrict}
            onChangeText={setPickupDistrict}
            placeholder="e.g. Nyagatare, Huye, Musanze"
          />

          <FormField
            label={t.supplier.pickupSector}
            value={pickupSector}
            onChangeText={setPickupSector}
            placeholder="e.g. Karangazi"
          />

          <FormField
            label={t.supplier.pickupDetails}
            value={pickupLocationDetails}
            onChangeText={setPickupLocationDetails}
            multiline
            numberOfLines={2}
            placeholder="Warehouse address or collection point"
          />

          <Text style={styles.photoHeader}>{t.supplier.photoEvidence}:</Text>
          <View style={styles.photoPreviewCard}>
            <Ionicons name="image-outline" size={32} color={colors.primary} />
            <Text style={styles.photoCountText}>1 Produce Photo Attached</Text>
          </View>
        </View>
      )}

      {/* Buttons */}
      <View style={styles.buttonRow}>
        {step > 1 ? (
          <Button
            title={t.common.back}
            onPress={() => setStep(step - 1)}
            variant="secondary"
            style={styles.btnHalf}
          />
        ) : (
          <Button
            title={t.common.cancel}
            onPress={onCancel}
            variant="secondary"
            style={styles.btnHalf}
          />
        )}

        {step < 3 ? (
          <Button
            title={t.common.next}
            onPress={() => setStep(step + 1)}
            style={styles.btnHalf}
          />
        ) : (
          <Button
            title={t.supplier.submitLot}
            onPress={handleSubmit}
            loading={loading}
            style={styles.btnHalf}
          />
        )}
      </View>

      <Button
        title={t.supplier.saveDraft}
        onPress={handleSaveDraft}
        variant="text"
        style={styles.draftBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotText: {
    color: '#64748B',
    fontWeight: '700',
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 48,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  wizardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutralDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: 12,
    borderRadius: radii.md,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#B45309',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
    backgroundColor: '#FFF',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  photoHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutralDark,
    marginBottom: 8,
  },
  photoPreviewCard: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  photoCountText: {
    marginTop: 6,
    fontSize: 13,
    color: colors.neutralDark,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  btnHalf: {
    flex: 1,
  },
  draftBtn: {
    marginTop: 12,
  },
});
