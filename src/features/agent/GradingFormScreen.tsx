import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CropBadge } from '../../components/ui/CropBadge';
import { gradingService, mockState } from '../../services/mock/mockServices';
import { inspectionRepository } from '../../data/local/inspectionRepository';
import { Lot, User, Organization, GradingRecord } from '../../domain/models';
import { QualityGrade } from '../../domain/enums';
import { formatQuantity } from '../../domain/calculations/lotCalculations';

interface GradingFormScreenProps {
  lot: Lot;
  org?: Organization;
  agent: User;
  onSuccess: () => void;
  onCancel: () => void;
  existingRecord?: GradingRecord;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'identity_match',
    label: 'Lot Identity & Declaration Match',
    description: 'Bags, markings, and declared quantity correspond with farmer declaration.',
    required: true,
  },
  {
    id: 'variety_verified',
    label: 'Crop & Variety Verification',
    description: 'Grain sample visually conforms to declared variety and uniformity.',
    required: true,
  },
  {
    id: 'packaging_intact',
    label: 'Packaging & Bag Integrity',
    description: 'Stored in clean, undamaged standard jute or polypropylene bags.',
    required: true,
  },
  {
    id: 'contamination_check',
    label: 'Contamination & Foreign Matter Inspection',
    description: 'No chemical smells, mold, living weevils, or dangerous foreign matter.',
    required: true,
  },
  {
    id: 'storage_dryness',
    label: 'Storage & Pickup Site Readiness',
    description: 'Depot floor is dry, raised on wooden pallets, and weatherproof.',
    required: true,
  },
];

export const GradingFormScreen: React.FC<GradingFormScreenProps> = ({
  lot,
  org,
  agent,
  onSuccess,
  onCancel,
  existingRecord,
}) => {
  const { t } = useTranslation();
  const [moisture, setMoisture] = useState(
    existingRecord ? String(existingRecord.moisturePercentage) : '13.2'
  );
  const [foreignMatter, setForeignMatter] = useState(
    existingRecord ? String(existingRecord.foreignMatterPercentage) : '0.8'
  );
  const [defects, setDefects] = useState(
    existingRecord ? String(existingRecord.defectiveRatePercentage) : '1.5'
  );
  const [notes, setNotes] = useState(
    existingRecord
      ? existingRecord.notes
      : 'Sample taken from 5 bags randomly. Grain clean, uniform, and dry.'
  );
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    existingRecord?.checklist || {
      identity_match: false,
      variety_verified: false,
      packaging_intact: false,
      contamination_check: false,
      storage_dryness: false,
    }
  );

  const [gps] = useState<{ lat: number; lng: number } | undefined>({
    lat: -1.5973,
    lng: 30.4082,
  });

  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // 5-minute post-submission editing window state
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [canEditRecord, setCanEditRecord] = useState<boolean>(!existingRecord);

  useEffect(() => {
    if (existingRecord) {
      const eligibility = gradingService.checkEditEligibility(existingRecord);
      setCanEditRecord(eligibility.canEdit);
      setRemainingSeconds(eligibility.remainingSeconds);

      if (eligibility.canEdit) {
        const timer = setInterval(() => {
          setRemainingSeconds(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanEditRecord(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }
    } else {
      // Restore saved draft on mount if available
      let isMounted = true;
      inspectionRepository.getDraft(lot.id).then(draft => {
        if (isMounted && draft) {
          setMoisture(draft.moisture || '13.2');
          setForeignMatter(draft.foreignMatter || '0.8');
          setDefects(draft.defects || '1.5');
          if (draft.notes) setNotes(draft.notes);
          if (draft.checklist) setChecklist(draft.checklist);
          setHasSavedDraft(true);
          setDraftRestored(true);
        }
      }).catch(() => {
        // Ignore read errors
      });

      return () => {
        isMounted = false;
      };
    }
  }, [lot.id, existingRecord]);

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

  const toggleChecklistItem = (id: string) => {
    if (!canEditRecord) return;
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allChecklistItemsCompleted = CHECKLIST_ITEMS.every(item => checklist[item.id]);

  const handleSaveDraft = async (silent = false) => {
    setSavingDraft(true);
    try {
      await inspectionRepository.saveDraft({
        id: `draft-${lot.id}`,
        lotId: lot.id,
        agentId: agent.id,
        moisture,
        foreignMatter,
        defects,
        notes,
        checklist,
        photos: lot.photos || [],
        gps,
        updatedAt: new Date().toISOString(),
      });
      setHasSavedDraft(true);
      if (!silent) {
        Alert.alert(t.agent.saveDraft, t.agent.draftSaved);
      }
    } catch (err: any) {
      if (!silent) {
        Alert.alert(t.agent.storageFailure, err.message || 'Failed to save local draft');
      }
    } finally {
      setSavingDraft(false);
    }
  };

  const handleCancel = () => {
    if (existingRecord) {
      onCancel();
      return;
    }

    Alert.alert(
      t.agent.unsavedChanges,
      t.agent.unsavedChangesMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.agent.saveDraft,
          onPress: async () => {
            await handleSaveDraft(true);
            onCancel();
          },
        },
        {
          text: 'Exit Without Saving',
          style: 'destructive',
          onPress: onCancel,
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!allChecklistItemsCompleted) {
      Alert.alert(
        'Checklist Incomplete',
        'All mandatory physical inspection checklist verification items must be confirmed before submitting (BR-01, FR-QA-02).'
      );
      return;
    }

    // Physical validation bounds
    if (mVal < 0 || mVal > 50) {
      Alert.alert('Invalid Moisture', 'Moisture percentage must be between 0% and 50%.');
      return;
    }
    if (fmVal < 0 || fmVal > 20) {
      Alert.alert('Invalid Foreign Matter', 'Foreign matter must be between 0% and 20%.');
      return;
    }
    if (defVal < 0 || defVal > 25) {
      Alert.alert('Invalid Defect Rate', 'Defective grain share must be between 0% and 25%.');
      return;
    }

    setLoading(true);
    try {
      if (existingRecord) {
        // Updating existing within the 5-minute window
        await gradingService.updateGrading(existingRecord.id, agent, {
          moisture: mVal,
          foreignMatter: fmVal,
          defects: defVal,
          notes,
          checklist,
        });

        Alert.alert(
          'Inspection Updated',
          `Updated measurements saved successfully. Authority grade confirmed as ${calculatedGrade}.`,
          [{ text: t.common.done, onPress: onSuccess }]
        );
      } else {
        // Fresh submission
        await gradingService.submitGrading(
          lot.id,
          agent,
          {
            moisture: mVal,
            foreignMatter: fmVal,
            defects: defVal,
          },
          lot.photos || [],
          notes,
          gps,
          checklist
        );

        // Remove saved draft upon successful submission
        await inspectionRepository.removeDraft(lot.id);

        const isOffline = mockState.isOffline();
        Alert.alert(
          isOffline ? t.agent.savedLocally : 'Grading Submitted',
          isOffline
            ? `You are currently offline. Inspection for lot ${lot.lotCode} was securely saved to durable local storage and enqueued for automatic synchronization when connectivity returns (BR-01, FR-QA-03).`
            : `Grading recorded successfully as ${calculatedGrade}. In accordance with BR-02, this lot is awaiting Cargo Operations administrative review before buyer marketplace listing.\n\nYou have a 5-minute window to edit these measurements if needed.`,
          [{ text: t.common.done, onPress: onSuccess }]
        );
      }
    } catch (err: any) {
      Alert.alert('Grading Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 5-Minute Post-Submission Window Banner */}
      {existingRecord && (
        <View
          style={[
            styles.editingWindowBanner,
            canEditRecord ? styles.editingWindowActive : styles.editingWindowExpired,
          ]}
        >
          <Ionicons
            name={canEditRecord ? 'timer-outline' : 'lock-closed-outline'}
            size={18}
            color={canEditRecord ? colors.warning : colors.neutralGray}
          />
          <View style={styles.editingWindowMeta}>
            <Text
              style={[
                styles.editingWindowTitle,
                { color: canEditRecord ? colors.warning : colors.neutralHeadings },
              ]}
            >
              {canEditRecord
                ? `Editable Window: ${formatCountdown(remainingSeconds)} remaining`
                : 'Inspection Finalized (Editing Window Expired)'}
            </Text>
            <Text style={styles.editingWindowSub}>
              {canEditRecord
                ? 'Field regulations permit updates within 5 minutes of initial submission.'
                : 'Measurements are locked. Any further adjustments require administrative review.'}
            </Text>
          </View>
        </View>
      )}

      {/* Draft Restored Banner */}
      {draftRestored && (
        <View style={styles.draftRestoredBox}>
          <Ionicons name="document-text" size={16} color={colors.primary} />
          <Text style={styles.draftRestoredText}>
            Restored saved inspection draft from local device storage.
          </Text>
          <TouchableOpacity onPress={() => setDraftRestored(false)}>
            <Ionicons name="close-circle" size={16} color={colors.neutralGray} />
          </TouchableOpacity>
        </View>
      )}

      {/* Header Info */}
      <View style={styles.lotSummaryBox}>
        <View style={styles.summaryTopRow}>
          <CropBadge cropName={lot.cropName} size="small" />
          <View style={styles.summaryTitleWrap}>
            <Text style={styles.lotCrop}>{lot.cropName} Inspection</Text>
            <Text style={styles.lotCode}>
              {lot.lotCode} · {formatQuantity(lot.totalQuantityKg)}
            </Text>
          </View>
        </View>
        <Text style={styles.coopText}>
          {org?.name || 'Cooperative'} · {lot.pickupDistrict}, {lot.pickupSector}
        </Text>
      </View>

      {/* Calculated Grade Display */}
      <View style={styles.gradeBox}>
        <View>
          <Text style={styles.gradeBoxTitle}>{t.agent.calculatedGrade}:</Text>
          <Text style={styles.gradeBoxSubtitle}>Governed by backend threshold rules</Text>
        </View>
        <StatusBadge status={calculatedGrade} />
      </View>

      {/* Structured Checkbox Inspection Checklist */}
      <View style={styles.checklistSection}>
        <View style={styles.checklistHeader}>
          <Text style={styles.sectionTitle}>Physical Inspection Checklist</Text>
          <Text style={styles.checklistProgress}>
            {Object.values(checklist).filter(Boolean).length}/{CHECKLIST_ITEMS.length} verified
          </Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Mandatory criteria required by Cargo field inspection standard (FR-QA-02).
        </Text>

        {CHECKLIST_ITEMS.map(item => {
          const checked = !!checklist[item.id];
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.checklistItem, checked && styles.checklistItemChecked]}
              onPress={() => toggleChecklistItem(item.id)}
              disabled={!canEditRecord}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
            >
              <Ionicons
                name={checked ? 'checkbox' : 'square-outline'}
                size={22}
                color={checked ? colors.primary : colors.neutralLight}
              />
              <View style={styles.checkTextWrap}>
                <Text style={[styles.checkLabel, checked && styles.checkLabelChecked]}>
                  {item.label}
                </Text>
                <Text style={styles.checkDesc}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Laboratory & Physical Measurements */}
      <Text style={styles.sectionTitle}>Quality Measurements</Text>
      <Text style={styles.sectionSubtitle}>
        Moisture, foreign matter, and defect levels dictate official Cargo grade.
      </Text>

      <FormField
        label={t.agent.moisture}
        value={moisture}
        onChangeText={setMoisture}
        keyboardType="numeric"
        placeholder="13.2"
        suffix="%"
        helper="Grade A: <= 13.5% | Grade B: <= 14.5% | Grade C: > 14.5%"
        editable={canEditRecord}
      />

      <FormField
        label={t.agent.foreignMatter}
        value={foreignMatter}
        onChangeText={setForeignMatter}
        keyboardType="numeric"
        placeholder="0.8"
        suffix="%"
        helper="Grade A: <= 1.0% | Grade B: <= 2.0% | Grade C: > 2.0%"
        editable={canEditRecord}
      />

      <FormField
        label={t.agent.defects}
        value={defects}
        onChangeText={setDefects}
        keyboardType="numeric"
        placeholder="1.5"
        suffix="%"
        helper="Grade A: <= 2.0% | Grade B: <= 4.0% | Grade C: > 4.0%"
        editable={canEditRecord}
      />

      {/* Inspector Notes */}
      <FormField
        label="Inspection Field Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Add physical observations or bag inspection notes..."
        multiline
        numberOfLines={3}
        editable={canEditRecord}
      />

      {/* GPS Geo-Tag */}
      <View style={styles.gpsRow}>
        <Ionicons name="navigate-circle" size={18} color={colors.primary} />
        <Text style={styles.gpsText}>
          Location Verified: {gps?.lat.toFixed(4)}, {gps?.lng.toFixed(4)} (±5m)
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {canEditRecord && (
          <Button
            title={existingRecord ? 'Update Inspection' : 'Submit Inspection'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        )}

        {!existingRecord && canEditRecord && (
          <Button
            title={hasSavedDraft ? 'Update Draft' : t.agent.saveDraft}
            onPress={() => handleSaveDraft(false)}
            variant="outline"
            loading={savingDraft}
            style={styles.draftBtn}
          />
        )}

        <Button
          title={existingRecord ? 'Close' : t.common.cancel}
          onPress={handleCancel}
          variant="outline"
          style={styles.cancelBtn}
        />
      </View>
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
    paddingBottom: spacing.xxxl + 30,
  },
  editingWindowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 4,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  editingWindowActive: {
    backgroundColor: '#FFFBEB',
    borderColor: colors.warning,
  },
  editingWindowExpired: {
    backgroundColor: colors.surfaceMint,
    borderColor: colors.border,
  },
  editingWindowMeta: {
    flex: 1,
  },
  editingWindowTitle: {
    ...typography.body,
    fontWeight: 'bold',
    fontSize: 13,
  },
  editingWindowSub: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
    marginTop: 1,
  },
  draftRestoredBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMint,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  draftRestoredText: {
    flex: 1,
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  lotSummaryBox: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  summaryTitleWrap: {
    marginLeft: spacing.sm,
  },
  lotCrop: {
    ...typography.h3,
    fontSize: 16,
    color: colors.neutralHeadings,
  },
  lotCode: {
    ...typography.caption,
    color: colors.neutralGray,
  },
  coopText: {
    ...typography.caption,
    color: colors.neutralLight,
    marginTop: 2,
  },
  gradeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceMint,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  gradeBoxTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.neutralHeadings,
  },
  gradeBoxSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  checklistSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistProgress: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.neutralHeadings,
    marginBottom: 2,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.neutralGray,
    marginBottom: spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  checklistItemChecked: {
    backgroundColor: '#F9FBF9',
  },
  checkTextWrap: {
    flex: 1,
  },
  checkLabel: {
    ...typography.body,
    fontSize: 13,
    color: colors.neutralHeadings,
    fontWeight: '600',
  },
  checkLabelChecked: {
    color: colors.primary,
  },
  checkDesc: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
    marginTop: 2,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.sm,
    backgroundColor: colors.surfaceMint,
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  gpsText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  submitBtn: {
    marginBottom: spacing.xs,
  },
  draftBtn: {
    marginBottom: spacing.xs,
  },
  cancelBtn: {
    borderColor: colors.border,
  },
});
