import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { CropBadge } from '../../components/ui/CropBadge';
import { lotService } from '../../services/mock/mockServices';
import { localStorage } from '../../data/local/storage';
import { User } from '../../domain/models';
import { RWANDA_DISTRICTS, getSectorsForDistrict } from '../../data/locations/rwandaLocations';

interface CreateLotWizardProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

const COMMON_CROPS = [
  { name: 'Maize', variety: 'Nyirakaragaza', type: 'NON_PERISHABLE' as const },
  { name: 'Dry Beans', variety: 'Yellow Beans', type: 'NON_PERISHABLE' as const },
  { name: 'Irish Potatoes', variety: 'Kinigi', type: 'NON_PERISHABLE' as const },
  { name: 'Fresh Tomatoes', variety: 'Anna F1', type: 'PERISHABLE' as const },
  { name: 'Rice', variety: 'Kigori', type: 'NON_PERISHABLE' as const },
  { name: 'Hass Avocados', variety: 'Export Grade', type: 'PERISHABLE' as const },
  { name: 'Cooking Bananas', variety: 'Injagi', type: 'PERISHABLE' as const },
  { name: 'Red Onions', variety: 'Red Creole', type: 'NON_PERISHABLE' as const },
  { name: 'Soybeans', variety: 'Sopetrad', type: 'NON_PERISHABLE' as const },
  { name: 'Coffee', variety: 'Arabica', type: 'NON_PERISHABLE' as const },
];

export const CreateLotWizard: React.FC<CreateLotWizardProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  const { t, language } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [cropName, setCropName] = useState('Maize');
  const [cropType, setCropType] = useState<'PERISHABLE' | 'NON_PERISHABLE'>('NON_PERISHABLE');
  const [variety, setVariety] = useState('Nyirakaragaza');
  const [totalQuantityKg, setTotalQuantityKg] = useState('5000');
  const [pricePerKgRwf, setPricePerKgRwf] = useState('420');
  const [availabilityDate, setAvailabilityDate] = useState('2026-10-25');
  const [harvestConfirmed, setHarvestConfirmed] = useState(true);
  const [pickupDistrict, setPickupDistrict] = useState('Nyagatare');
  const [pickupSector, setPickupSector] = useState('Karangazi');
  const [pickupLocationDetails, setPickupLocationDetails] = useState('Main cooperative silo, Karangazi centre');
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600',
  ]);

  const availableSectors = getSectorsForDistrict(pickupDistrict);

  const handleDistrictChange = (newDistrict: string) => {
    setPickupDistrict(newDistrict);
    const sectors = getSectorsForDistrict(newDistrict);
    if (sectors.length > 0) {
      setPickupSector(sectors[0]);
    }
  };

  const handleAddPhoto = () => {
    // Add realistic produce photo fixture for mock upload
    const samplePhotos = [
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600',
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
    ];
    const nextPhoto = samplePhotos[photos.length % samplePhotos.length];
    setPhotos(prev => [...prev, nextPhoto]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    try {
      await localStorage.saveLotDraft({
        id: `draft-${Date.now()}`,
        cropName,
        variety,
        totalQuantityKg: Number(totalQuantityKg) || 0,
        pricePerKgRwf: Number(pricePerKgRwf) || 0,
        pickupDistrict,
        savedAt: new Date().toISOString(),
      });
      Alert.alert(
        language === 'rw' ? 'Byabitswe' : 'Draft Saved',
        language === 'rw'
          ? 'Inyandiko y\'umusaruro yabitswe kuri iyi telefone.'
          : 'Your lot declaration draft has been safely saved on this device.'
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const validateStep = (s: number): boolean => {
    setError(null);
    if (s === 1) {
      if (!cropName.trim()) {
        setError('Please select or specify a crop name.');
        return false;
      }
      const qty = Number(totalQuantityKg);
      if (!qty || qty < 50) {
        setError('Harvested quantity must be at least 50 kg.');
        return false;
      }
      const price = Number(pricePerKgRwf);
      if (!price || price <= 0) {
        setError('Asking price must be greater than 0 RWF.');
        return false;
      }
    } else if (s === 2) {
      if (!availabilityDate.trim()) {
        setError('Availability date is required.');
        return false;
      }
      if (!harvestConfirmed) {
        setError('You must confirm harvest readiness and warehouse preparation (BR-01).');
        return false;
      }
    } else if (s === 3) {
      if (!pickupDistrict.trim()) {
        setError('District is required.');
        return false;
      }
      if (!pickupSector.trim()) {
        setError('Sector is required.');
        return false;
      }
      if (!pickupLocationDetails.trim()) {
        setError('Pickup site location details are required for inspector access.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      // BR-01 Harvest Date: Auto-populated with verified current harvest timestamp
      const authoritativeHarvestDate = new Date().toISOString().split('T')[0];

      await lotService.createLot(
        {
          cropName,
          cropType,
          variety,
          totalQuantityKg: Number(totalQuantityKg),
          pricePerKgRwf: Number(pricePerKgRwf),
          harvestDate: authoritativeHarvestDate,
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
        language === 'rw' ? 'Umusaruro Woherejwe' : 'Lot Submitted for Inspection',
        language === 'rw'
          ? 'Umusaruro woherejwe neza. Umugenzuzi wo mu Karere ka ' + pickupDistrict + ' azawusuzuma maze wemezwe.'
          : 'Harvest lot successfully submitted. Field inspectors in ' + pickupDistrict + ' will perform physical grading before buyer publication.',
        [{ text: language === 'rw' ? 'Bireke' : 'Done', onPress: onSuccess }]
      );
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Wizard Progress Bar */}
      <View style={styles.stepIndicatorRow}>
        {[1, 2, 3, 4].map((s, idx) => (
          <React.Fragment key={s}>
            <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
              {step > s ? (
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              ) : (
                <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>{s}</Text>
              )}
            </View>
            {idx < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
          </React.Fragment>
        ))}
      </View>

      <Text style={styles.wizardStepTitle}>
        {step === 1 && (language === 'rw' ? '1. Imyirondoro y\'Umusaruro' : '1. Product & Pricing')}
        {step === 2 && (language === 'rw' ? '2. Itariki n\'Icyemezo cya BR-01' : '2. Availability & Readiness')}
        {step === 3 && (language === 'rw' ? '3. Aho Uherereye n\'Amafoto' : '3. Location & Pictures')}
        {step === 4 && (language === 'rw' ? '4. Gusuzuma no Kohereza' : '4. Review & Submit')}
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#B42318" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* STEP 1: Product & Pricing */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.sectionLabel}>
            {language === 'rw' ? 'Hitamo Umusaruro:' : 'Select Common Commodity:'}
          </Text>
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
                    setCropType(c.type);
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

          {/* Crop Type Selector (Perishable / Non-perishable) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {language === 'rw' ? 'Ubwoko bw\'Umusaruro (Perishable):' : 'Perishability Classification:'}
            </Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeOption, cropType === 'NON_PERISHABLE' && styles.typeOptionActive]}
                onPress={() => setCropType('NON_PERISHABLE')}
              >
                <Ionicons
                  name="cube-outline"
                  size={16}
                  color={cropType === 'NON_PERISHABLE' ? '#FFFFFF' : '#174A35'}
                />
                <Text style={[styles.typeOptionText, cropType === 'NON_PERISHABLE' && styles.typeOptionTextActive]}>
                  {language === 'rw' ? 'Udadabora Byoroshye (Non-perishable)' : 'Non-perishable (Grains / Beans)'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOption, cropType === 'PERISHABLE' && styles.typeOptionActive]}
                onPress={() => setCropType('PERISHABLE')}
              >
                <Ionicons
                  name="leaf-outline"
                  size={16}
                  color={cropType === 'PERISHABLE' ? '#FFFFFF' : '#174A35'}
                />
                <Text style={[styles.typeOptionText, cropType === 'PERISHABLE' && styles.typeOptionTextActive]}>
                  {language === 'rw' ? 'Ubora Byoroshye (Perishable)' : 'Perishable (Produce / Vegetables)'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Variety */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.supplier.variety}:</Text>
            <TextInput
              style={styles.input}
              value={variety}
              onChangeText={setVariety}
              placeholder="e.g. Nyirakaragaza, Yellow beans"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Quantity */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.supplier.quantityKg} (kg):</Text>
            <TextInput
              style={styles.input}
              value={totalQuantityKg}
              onChangeText={setTotalQuantityKg}
              keyboardType="numeric"
              placeholder="5000"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.helperText}>Minimum commercial declaration: 50 kg</Text>
          </View>

          {/* Asking Price */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.supplier.pricePerKg} (RWF / kg):</Text>
            <TextInput
              style={styles.input}
              value={pricePerKgRwf}
              onChangeText={setPricePerKgRwf}
              keyboardType="numeric"
              placeholder="420"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.helperText}>Whole Rwandan Francs without decimal points (BR-04)</Text>
          </View>
        </View>
      )}

      {/* STEP 2: Availability & BR-01 Harvest Readiness */}
      {step === 2 && (
        <View style={styles.stepContainer}>
          {/* BR-01 Harvest & Warehouse Readiness Confirmation */}
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
            <View style={{ flex: 1 }}>
              <Text style={styles.checkboxTitle}>
                {language === 'rw' ? 'Icyemezo cy\'Umusaruro (BR-01 Readiness)' : 'BR-01 Harvest & Warehouse Readiness'}
              </Text>
              <Text style={styles.checkboxSubtitle}>
                {language === 'rw'
                  ? 'Ndemeza ko uyu musaruro wamaze gusarurwa, wateguwe kandi ugejejwe mu cyicaro cy\'ububiko bwiteguye kugenzurwa.'
                  : 'I declare that this lot has been harvested, conditioned, and is stored in the warehouse ready for physical agronomist inspection.'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.supplier.availabilityDate} (YYYY-MM-DD):</Text>
            <TextInput
              style={styles.input}
              value={availabilityDate}
              onChangeText={setAvailabilityDate}
              placeholder="2026-10-25"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.helperText}>Date stock is available for warehouse consolidation or pickup</Text>
          </View>
        </View>
      )}

      {/* STEP 3: Location Hierarchy & Pictures */}
      {step === 3 && (
        <View style={styles.stepContainer}>
          {/* District Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>District (Akarere):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {RWANDA_DISTRICTS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.locationChip, pickupDistrict === d && styles.locationChipActive]}
                  onPress={() => handleDistrictChange(d)}
                >
                  <Text style={[styles.locationChipText, pickupDistrict === d && styles.locationChipTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sector Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Sector (Umurenge in {pickupDistrict}):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {availableSectors.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.locationChip, pickupSector === s && styles.locationChipActive]}
                  onPress={() => setPickupSector(s)}
                >
                  <Text style={[styles.locationChipText, pickupSector === s && styles.locationChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Pickup Location Details */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t.supplier.pickupDetails}:</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              value={pickupLocationDetails}
              onChangeText={setPickupLocationDetails}
              multiline
              numberOfLines={2}
              placeholder="Specific warehouse silo, depot room, or cooperative centre"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Lot Photos */}
          <View style={styles.fieldGroup}>
            <View style={styles.photoHeaderRow}>
              <Text style={styles.fieldLabel}>{t.supplier.photoEvidence}:</Text>
              <TouchableOpacity onPress={handleAddPhoto} style={styles.addPhotoLink}>
                <Ionicons name="camera" size={16} color="#174A35" />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.photoGrid}>
              {photos.map((uri, idx) => (
                <View key={idx} style={styles.photoCard}>
                  <Image source={{ uri }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => handleRemovePhoto(idx)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#B42318" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* STEP 4: Review Screen */}
      {step === 4 && (
        <View style={styles.stepContainer}>
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <CropBadge cropName={cropName} size="medium" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.reviewCropName}>{cropName}</Text>
                <Text style={styles.reviewVariety}>{variety} · {cropType}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Quantity:</Text>
              <Text style={styles.reviewValue}>{Number(totalQuantityKg).toLocaleString()} kg</Text>
            </View>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Asking Price:</Text>
              <Text style={styles.reviewValue}>{Number(pricePerKgRwf).toLocaleString()} RWF / kg</Text>
            </View>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Estimated Value:</Text>
              <Text style={styles.reviewValueHighlight}>
                {(Number(totalQuantityKg) * Number(pricePerKgRwf)).toLocaleString()} RWF
              </Text>
            </View>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Availability Date:</Text>
              <Text style={styles.reviewValue}>{availabilityDate}</Text>
            </View>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Location:</Text>
              <Text style={styles.reviewValue}>{pickupDistrict}, {pickupSector}</Text>
            </View>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Pickup Site:</Text>
              <Text style={styles.reviewValueSmall}>{pickupLocationDetails}</Text>
            </View>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Photos Attached:</Text>
              <Text style={styles.reviewValue}>{photos.length} item(s)</Text>
            </View>
          </View>
        </View>
      )}

      {/* Navigation Buttons */}
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

        {step < 4 ? (
          <Button
            title={t.common.next}
            onPress={handleNext}
            style={styles.btnHalf}
          />
        ) : (
          <Button
            title={language === 'rw' ? 'Ohereza Isuzumwe' : 'Submit for Inspection'}
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
        icon={<Ionicons name="save-outline" size={16} color="#174A35" />}
        style={styles.draftBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCE4DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#174A35',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#66716A',
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 36,
    height: 2,
    backgroundColor: '#DCE4DD',
  },
  stepLineActive: {
    backgroundColor: '#174A35',
  },
  wizardStepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202822',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    color: '#B42318',
    flex: 1,
  },
  stepContainer: {
    gap: 14,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202822',
  },
  cropSelectorRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4DD',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  cropChipActive: {
    borderColor: '#174A35',
    backgroundColor: '#EAF2EC',
  },
  cropChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#66716A',
  },
  cropChipTextActive: {
    color: '#174A35',
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202822',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4DD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#202822',
  },
  helperText: {
    fontSize: 11,
    color: '#66716A',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4DD',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  typeOptionActive: {
    backgroundColor: '#174A35',
    borderColor: '#174A35',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#174A35',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4DD',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#174A35',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#174A35',
  },
  checkboxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202822',
  },
  checkboxSubtitle: {
    fontSize: 12,
    color: '#66716A',
    lineHeight: 16,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
  },
  locationChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4DD',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  locationChipActive: {
    backgroundColor: '#174A35',
    borderColor: '#174A35',
  },
  locationChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#66716A',
  },
  locationChipTextActive: {
    color: '#FFFFFF',
  },
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addPhotoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#174A35',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  photoCard: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#DCE4DD',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 3,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE4DD',
    ...shadows.sm,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCropName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202822',
  },
  reviewVariety: {
    fontSize: 13,
    color: '#66716A',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#DCE4DD',
    marginVertical: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewLabel: {
    fontSize: 13,
    color: '#66716A',
  },
  reviewValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202822',
  },
  reviewValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#174A35',
  },
  reviewValueSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#202822',
    maxWidth: 180,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btnHalf: {
    flex: 1,
  },
  draftBtn: {
    marginTop: 10,
    alignSelf: 'center',
  },
});
