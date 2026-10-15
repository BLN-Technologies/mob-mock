import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing, shadows } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { StatusBadge } from './StatusBadge';
import { CropBadge } from './CropBadge';
import { Button } from './Button';
import { Lot } from '../../domain/models';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';

interface LotDetailModalProps {
  lot: Lot | null;
  visible: boolean;
  onClose: () => void;
}

export const LotDetailModal: React.FC<LotDetailModalProps> = ({
  lot,
  visible,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!lot) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <CropBadge cropName={lot.cropName} size="small" />
              <View style={styles.headerTextWrap}>
                <Text style={styles.cropTitle}>{lot.cropName}</Text>
                <Text style={styles.lotCode}>{lot.lotCode}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={colors.neutralDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* Status & Notice */}
            <View style={styles.statusSection}>
              <View style={styles.statusRow}>
                <Text style={styles.sectionLabel}>{t.supplier.qualityGrade}</Text>
                <StatusBadge status={lot.status} />
              </View>
              {lot.grade && (
                <View style={[styles.statusRow, { marginTop: 6 }]}>
                  <Text style={styles.sectionLabel}>Official Grade</Text>
                  <StatusBadge status={lot.grade} />
                </View>
              )}
            </View>

            {/* Verification Banner */}
            <View
              style={[
                styles.noticeBanner,
                lot.status === 'VERIFIED' ? styles.noticeVerified : styles.noticePending,
              ]}
            >
              <Ionicons
                name={lot.status === 'VERIFIED' ? 'checkmark-circle' : 'time-outline'}
                size={18}
                color={lot.status === 'VERIFIED' ? colors.successDark : colors.warningDark}
              />
              <Text
                style={[
                  styles.noticeText,
                  {
                    color: lot.status === 'VERIFIED' ? colors.successDark : colors.warningDark,
                  },
                ]}
              >
                {lot.status === 'VERIFIED'
                  ? t.supplier.verifyNotice
                  : t.supplier.pendingNotice}
              </Text>
            </View>

            {/* Specifications Grid */}
            <View style={styles.gridCard}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>{t.supplier.originalQuantity}</Text>
                <Text style={styles.gridValue}>{formatQuantity(lot.totalQuantityKg)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>{t.supplier.remainingStock}</Text>
                <Text style={[styles.gridValue, { color: colors.primary }]}>
                  {formatQuantity(lot.remainingQuantityKg)}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>{t.supplier.pricePerKg}</Text>
                <Text style={styles.gridValue}>{formatRwf(lot.pricePerKgRwf)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>{t.supplier.variety}</Text>
                <Text style={styles.gridValue}>{lot.variety || 'Standard Bulk'}</Text>
              </View>
            </View>

            {/* Logistics & Location */}
            <View style={styles.infoCard}>
              <Text style={styles.cardHeaderTitle}>Pickup & Availability</Text>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={styles.infoText}>
                  {lot.pickupDistrict}, {lot.pickupSector}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.infoText}>
                  Harvested: {new Date(lot.harvestDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={16} color={colors.primary} />
                <Text style={styles.infoText}>
                  {lot.pickupLocationDetails || 'Cooperative Central Warehouse'}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <Button
              title={t.common.close}
              onPress={onClose}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '82%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextWrap: {
    marginLeft: spacing.sm,
  },
  cropTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.neutralHeadings,
  },
  lotCode: {
    ...typography.caption,
    color: colors.neutralGray,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  statusSection: {
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutralGray,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  noticeVerified: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  noticePending: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  noticeText: {
    ...typography.caption,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  gridCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gridItem: {
    width: '50%',
    paddingVertical: spacing.xs,
  },
  gridLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  gridValue: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  cardHeaderTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  infoText: {
    ...typography.body,
    fontSize: 13,
    color: colors.neutralBody,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
