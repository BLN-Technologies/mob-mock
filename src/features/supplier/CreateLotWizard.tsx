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
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { CropBadge } from '../../components/ui/CropBadge';
import { lotService } from '../../services/mock/mockServices';
import { localStorage } from '../../data/local/storage';
import { User } from '../../domain/models';

interface CreateLotWizardProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

const COMMON_CROPS = [
  { name: 'Maize', variety: 'Nyirakaragaza' },
  { name: 'Dry Beans', variety: 'Yellow Beans' },
  { name: 'Irish Potatoes', variety: 'Kinigi' },
  { name: 'Fresh Tomatoes', variety: 'Anna F1' },
  { name: 'Rice', variety: 'Kigori / Basmati' },
  { name: 'Hass Avocados', variety: 'Export Grade' },
  { name: 'Cooking Bananas', variety: 'Injagi' },
  { name: 'Red Onions', variety: 'Red Creole' },
  { name: 'Soybeans', variety: 'Sopetrad' },
  { name: 'Coffee', variety: 'Arabica' },
];

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
      Alert.alert(t.common.appName, 'Your lot declaration draft has been saved on this device.');
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
        t.common.appName,
        'Your harvest lot declaration has been submitted for field agent grading and inspection (FR-LOT-01).',
        [{ text: t.common.done, onPress: onSuccess }]
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
        {step === 1 && `1. ${t.supplier.lotInformation}`}
        {step === 2 && `2. ${t.supplier.harvestDate} & BR-01`}
        {step === 3 && `3. ${t.supplier.pickupLocation}`}
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {step === 1 && (
        <View>
          {/* Staple Crop Selector Chips */}
          <Text style={styles.selectorLabel}>Select Staple Crop:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropSelectorRow}>
            {COMMON_CROPS.map(c => {
              const isSelected = cropName.toLowerCase() === c.name.toLowerCase();
              return (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.cropChip, isSelected && styles.cropChipActive]}
                  onPress={() => {
                    setCropName(c.name);
                    setVariety(c.variety);
                  }}
                  activeOpacity={0.8}
                >
                  <CropBadge cropName={c.name} size="small" />
                  <Text style={[styles.cropChipText, isSelected && styles.cropChipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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
            suffix="kg"
            helper="Minimum quantity is 50 kg"
          />
          <FormField
            label={t.supplier.pricePerKg}
            value={pricePerKgRwf}
            onChangeText={setPricePerKgRwf}
            keyboardType="numeric"
            placeholder="420"
            prefix="RWF"
            suffix="/ kg"
            helper="Expected price in whole Rwandan Francs"
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
            accessibilityRole="checkbox"
            accessibilityState={{ checked: harvestConfirmed }}
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
            icon="calendar-outline"
            helper="Must be today or earlier (BR-01 strict rule)"
          />

          <FormField
            label={t.supplier.availabilityDate}
            value={availabilityDate}
            onChangeText={setAvailabilityDate}
            placeholder="YYYY-MM-DD"
            icon="cube-outline"
            helper="Date produce is packaged & ready for warehouse pickup"
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
            icon="location-outline"
          />

          <FormField
            label={t.supplier.pickupSector}
            value={pickupSector}
            onChangeText={setPickupSector}
            placeholder="e.g. Karangazi"
            icon="location-outline"
          />

          <FormField
            label={t.supplier.pickupDetails}
            value={pickupLocationDetails}
            onChangeText={setPickupLocationDetails}
            multiline
            numberOfLines={2}
            placeholder="Warehouse address or cooperative collection centre"
          />

          <Text style={styles.photoHeader}>{t.supplier.photoEvidence}:</Text>
          <View style={styles.photoPreviewCard}>
            <Ionicons name="image" size={36} color={colors.primary} />
            <Text style={styles.photoCountText}>1 Produce Photo Attached</Text>
            <Text style={styles.photoSubText}>Meets minimum visual evidence standard</Text>
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
        icon={<Ionicons name="save-outline" size={16} color={colors.primary} />}
        style={styles.draftBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl + 20,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
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
    fontSize: 13,
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 44,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  wizardTitle: {
    ...typography.h3,
    fontSize: 17,
    color: colors.neutralHeadings,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  selectorLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralGray,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  cropSelectorRow: {
    marginBottom: spacing.md,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.xs + 2,
    gap: 6,
  },
  cropChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceHighlighted,
  },
  cropChipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutralDark,
  },
  cropChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginLeft: spacing.xs,
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.warningBorder,
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.warningDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.warningDark,
    flex: 1,
    lineHeight: 18,
  },
  photoHeader: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.neutralHeadings,
    marginBottom: spacing.xs,
  },
  photoPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  photoCountText: {
    marginTop: spacing.xs,
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.neutralHeadings,
  },
  photoSubText: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btnHalf: {
    flex: 1,
  },
  draftBtn: {
    marginTop: spacing.sm,
  },
});
