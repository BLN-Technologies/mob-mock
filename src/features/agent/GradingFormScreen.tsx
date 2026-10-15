import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { gradingService, mockState } from '../../services/mock/mockServices';
import { Lot, User, Organization } from '../../domain/models';
import { QualityGrade } from '../../domain/enums';

interface GradingFormScreenProps {
  lot: Lot;
  org?: Organization;
  agent: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export const GradingFormScreen: React.FC<GradingFormScreenProps> = ({
  lot,
  org,
  agent,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [moisture, setMoisture] = useState('13.2');
  const [foreignMatter, setForeignMatter] = useState('0.8');
  const [defects, setDefects] = useState('1.5');
  const [notes, setNotes] = useState('Sample taken from 5 bags randomly. Grain clean and dry.');
  const [gps, setGps] = useState<{ lat: number; lng: number } | undefined>({
    lat: -1.5973,
    lng: 30.4082,
  });
  const [loading, setLoading] = useState(false);

  // Live proposed grade calculation
  const mVal = parseFloat(moisture) || 0;
  const fmVal = parseFloat(foreignMatter) || 0;
  const defVal = parseFloat(defects) || 0;

  let calculatedGrade = QualityGrade.GRADE_A;
  if (mVal > 14.5 || fmVal > 2.0 || defVal > 4.0) {
    calculatedGrade = QualityGrade.GRADE_C;
  } else if (mVal > 13.5 || fmVal > 1.0 || defVal > 2.0) {
    calculatedGrade = QualityGrade.GRADE_B;
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await gradingService.submitGrading(
        lot.id,
        agent,
        {
          moisture: mVal,
          foreignMatter: fmVal,
          defects: defVal,
        },
        lot.photos,
        notes,
        gps
      );

      const isOffline = mockState.isOffline();
      Alert.alert(
        isOffline ? 'Saved to Offline Queue' : 'Grading Submitted',
        isOffline
          ? 'You are currently offline. Your grading record was safely saved to the local offline queue and will sync automatically when connectivity returns (FR-QA-03).'
          : `Grading recorded successfully as ${calculatedGrade}. The lot is now verified and visible on the Cargo marketplace.`,
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (err: any) {
      Alert.alert('Grading Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Info */}
      <View style={styles.lotSummaryBox}>
        <Text style={styles.lotCrop}>{lot.cropName} Inspection</Text>
        <Text style={styles.lotCode}>{lot.lotCode} · {lot.totalQuantityKg.toLocaleString()} kg</Text>
        <Text style={styles.coopText}>{org?.name || 'Cooperative'} · {lot.pickupDistrict}</Text>
      </View>

      {/* Calculated Grade Display */}
      <View style={styles.gradeBox}>
        <Text style={styles.gradeBoxTitle}>{t.agent.calculatedGrade}:</Text>
        <StatusBadge status={calculatedGrade} />
      </View>

      {/* Measurements */}
      <Text style={styles.sectionTitle}>{t.agent.enterMeasurements}</Text>
      <FormField
        label={t.agent.moisture}
        value={moisture}
        onChangeText={setMoisture}
        keyboardType="numeric"
        placeholder="13.2"
        helper="Grade A threshold: <= 13.5%"
      />

      <FormField
        label={t.agent.foreignMatter}
        value={foreignMatter}
        onChangeText={setForeignMatter}
        keyboardType="numeric"
        placeholder="0.8"
        helper="Grade A threshold: <= 1.0%"
      />

      <FormField
        label={t.agent.defects}
        value={defects}
        onChangeText={setDefects}
        keyboardType="numeric"
        placeholder="1.5"
        helper="Grade A threshold: <= 2.0%"
      />

      {/* GPS Location */}
      <View style={styles.gpsCard}>
        <Ionicons name="location" size={20} color={colors.primary} />
        <View style={styles.gpsTextWrap}>
          <Text style={styles.gpsTitle}>{t.agent.gpsLocation}</Text>
          <Text style={styles.gpsCoords}>
            {gps ? `Lat: ${gps.lat.toFixed(4)}, Lng: ${gps.lng.toFixed(4)}` : 'Location not recorded'}
          </Text>
        </View>
      </View>

      <FormField
        label="Inspection Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      {/* Immutability Alert */}
      <View style={styles.immutableNotice}>
        <Ionicons name="information-circle" size={18} color="#0369A1" />
        <Text style={styles.immutableNoticeText}>
          Submitted grading records are immutable (FR-QA-05). Any future corrections will be appended as a new dated inspection record.
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <Button
          title={t.common.cancel}
          onPress={onCancel}
          variant="secondary"
          style={styles.btnHalf}
        />
        <Button
          title={t.agent.submitGrading}
          onPress={handleSubmit}
          loading={loading}
          style={styles.btnHalf}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  lotSummaryBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  lotCrop: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  lotCode: {
    fontSize: 13,
    color: colors.neutralGray,
    marginTop: 2,
  },
  coopText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 6,
  },
  gradeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  gradeBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutralDark,
    marginBottom: 12,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    borderRadius: radii.md,
    marginBottom: 16,
  },
  gpsTextWrap: {
    marginLeft: 10,
  },
  gpsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  gpsCoords: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
  },
  immutableNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E0F2FE',
    padding: 12,
    borderRadius: radii.md,
    marginBottom: 20,
    gap: 8,
  },
  immutableNoticeText: {
    fontSize: 12,
    color: '#0369A1',
    flex: 1,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnHalf: {
    flex: 1,
  },
});
