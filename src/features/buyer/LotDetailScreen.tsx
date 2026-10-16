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
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CropBadge } from '../../components/ui/CropBadge';
import { SafeImage } from '../../components/ui/SafeImage';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';
import { BuyerLotProjection, User } from '../../domain/models';

interface LotDetailScreenProps {
  lot: BuyerLotProjection;
  user: User;
  onBack: () => void;
  onRequestMatch: () => void;
}

export const LotDetailScreen: React.FC<LotDetailScreenProps> = ({
  lot,
  user,
  onBack,
  onRequestMatch,
}) => {
  const { t } = useTranslation();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [inquired, setInquired] = useState(false);

  const photos = lot.photos && lot.photos.length > 0 ? lot.photos : [];
  const currentPhoto = photos[activePhotoIndex] || photos[0];

  const handleInquire = () => {
    setInquired(true);
    Alert.alert(
      t.buyer.inquireAction,
      t.buyer.inquireSuccess,
      [{ text: t.common.confirm }]
    );
  };

  // Realistic mock inspection measurements based on agricultural quality grade
  const isGradeA = lot.grade === 'GRADE_A';
  const moistureValue = isGradeA ? '12.8%' : '14.1%';
  const foreignMatterValue = isGradeA ? '0.8%' : '1.8%';
  const defectRateValue = isGradeA ? '1.5%' : '3.2%';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 1. Back Navigation Button */}
      <TouchableOpacity
        onPress={onBack}
        style={styles.backBtn}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t.buyer.backToCatalogue}
      >
        <Ionicons name="arrow-back" size={18} color={colors.primary} />
        <Text style={styles.backBtnText}>{t.buyer.backToCatalogue}</Text>
      </TouchableOpacity>

      {/* 2. Interactive Image Gallery */}
      <View style={styles.galleryCard}>
        <View style={styles.mainImageWrap}>
          <SafeImage
            uri={currentPhoto}
            cropName={lot.cropName}
            style={styles.heroImage}
          />
          {/* Overlaid Badges */}
          <View style={styles.gradeOverlayBadge}>
            <StatusBadge status={lot.grade} size="small" />
          </View>
          <View style={styles.verifiedOverlayBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
            <Text style={styles.verifiedOverlayText}>{t.buyer.verifiedBadge}</Text>
          </View>

          {/* Pagination Counter */}
          {photos.length > 1 && (
            <View style={styles.photoIndexBadge}>
              <Ionicons name="camera" size={12} color="#FFFFFF" />
              <Text style={styles.photoIndexText}>
                {activePhotoIndex + 1} / {photos.length}
              </Text>
            </View>
          )}
        </View>

        {/* Thumbnail Strip */}
        {photos.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailStrip}
            contentContainerStyle={styles.thumbnailStripContent}
          >
            {photos.map((photoUri, index) => {
              const isSelected = index === activePhotoIndex;
              return (
                <TouchableOpacity
                  key={`thumb-${index}`}
                  onPress={() => setActivePhotoIndex(index)}
                  activeOpacity={0.8}
                  style={[styles.thumbnailWrap, isSelected && styles.thumbnailWrapActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`View photo ${index + 1}`}
                >
                  <SafeImage
                    uri={photoUri}
                    cropName={lot.cropName}
                    style={styles.thumbnailImage}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* 3. Primary Product Information Card */}
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <CropBadge cropName={lot.cropName} size="medium" />
          <View style={styles.headerTitleWrap}>
            <Text style={styles.cropTitle}>{lot.cropName}</Text>
            <Text style={styles.lotCode}>
              {lot.variety || 'Standard Bulk'} · {lot.lotCode}
            </Text>
          </View>
          <View style={styles.harvestTag}>
            <Ionicons name="checkmark-done" size={14} color={colors.primary} />
            <Text style={styles.harvestTagText}>{t.buyer.harvestReady}</Text>
          </View>
        </View>

        {/* Commercial Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{t.supplier.remainingStock}</Text>
            <Text style={styles.metricValHighlight}>
              {formatQuantity(lot.availableQuantityKg)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{t.buyer.pricingTerms}</Text>
            <Text style={styles.metricVal}>
              {formatRwf(lot.pricePerKgRwf)}
              <Text style={styles.pricePerKgSub}>{t.buyer.perKg}</Text>
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>District</Text>
            <Text style={styles.metricVal}>{lot.district}</Text>
            {lot.sector && (
              <Text style={styles.metricSub}>{lot.sector}</Text>
            )}
          </View>
        </View>

        {/* Harvest & Logistics Dates */}
        <View style={styles.datesRow}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.neutralGray} />
            <Text style={styles.dateLabel}>Available From:</Text>
            <Text style={styles.dateVal}>
              {new Date(lot.availabilityDate).toLocaleDateString()}
            </Text>
          </View>
          {lot.harvestDate && (
            <View style={styles.dateItem}>
              <Ionicons name="leaf-outline" size={14} color={colors.neutralGray} />
              <Text style={styles.dateLabel}>{t.supplier.harvestDate}:</Text>
              <Text style={styles.dateVal}>
                {new Date(lot.harvestDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* 4. Inspection & Quality Specifications Section */}
        <View style={styles.specSection}>
          <Text style={styles.specSectionTitle}>{t.buyer.specificationsTitle}</Text>
          
          <View style={styles.specsGrid}>
            <View style={styles.specCard}>
              <Text style={styles.specLabel}>{t.buyer.moistureContent}</Text>
              <Text style={styles.specValue}>{moistureValue}</Text>
              <Text style={styles.specStandard}>Standard &le; 14.5%</Text>
            </View>
            <View style={styles.specCard}>
              <Text style={styles.specLabel}>{t.buyer.foreignMatter}</Text>
              <Text style={styles.specValue}>{foreignMatterValue}</Text>
              <Text style={styles.specStandard}>Standard &le; 1.0%</Text>
            </View>
            <View style={styles.specCard}>
              <Text style={styles.specLabel}>{t.buyer.defectRate}</Text>
              <Text style={styles.specValue}>{defectRateValue}</Text>
              <Text style={styles.specStandard}>Standard &le; 2.5%</Text>
            </View>
          </View>

          {/* Verification & Quality Trail */}
          <View style={styles.timelineList}>
            <View style={styles.timelineRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.timelineText}>
                Harvest confirmed & ready for bulk delivery (BR-01)
              </Text>
            </View>
            <View style={styles.timelineRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.timelineText}>
                Field moisture & defect inspection completed ({lot.grade})
              </Text>
            </View>
            <View style={styles.timelineRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.timelineText}>
                Cargo operations verification on{' '}
                {new Date(lot.verifiedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Escrow & Cooperative Confidentiality Assurance */}
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark" size={20} color={colors.successDark} />
          <View style={styles.privacyNoteBody}>
            <Text style={styles.privacyNoteHeading}>
              {t.buyer.supplierPrivacyTitle}
            </Text>
            <Text style={styles.privacyNoteText}>
              {t.buyer.supplierPrivacyDesc}
            </Text>
          </View>
        </View>

        {/* 6. Action Buttons */}
        <View style={styles.actionButtonsWrap}>
          <Button
            title={t.buyer.includeInRequest}
            onPress={onRequestMatch}
            icon={<Ionicons name="cart-outline" size={18} color="#FFFFFF" />}
            size="large"
            fullWidth
            style={styles.primaryActionBtn}
          />

          <Button
            title={inquired ? t.buyer.inquireSuccess.split('.')[0] : t.buyer.inquireAction}
            onPress={handleInquire}
            variant="outline"
            size="medium"
            icon={<Ionicons name="help-buoy-outline" size={18} color={colors.primary} />}
            fullWidth
            disabled={inquired}
            style={styles.secondaryActionBtn}
          />
        </View>
      </Card>
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 4,
    paddingVertical: spacing.xs,
  },
  backBtnText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  galleryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.xs + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  mainImageWrap: {
    position: 'relative',
    height: 210,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  heroImage: {
    width: '100%',
    height: 210,
  },
  gradeOverlayBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  verifiedOverlayBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 59, 36, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 4,
  },
  verifiedOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  photoIndexBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    gap: 4,
  },
  photoIndexText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  thumbnailStrip: {
    marginTop: spacing.xs + 2,
  },
  thumbnailStripContent: {
    gap: spacing.xs + 2,
    paddingHorizontal: 2,
  },
  thumbnailWrap: {
    width: 64,
    height: 52,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#E2E8F0',
  },
  thumbnailWrapActive: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  card: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  cropTitle: {
    ...typography.h2,
    fontSize: 19,
    color: colors.neutralHeadings,
  },
  lotCode: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 1,
  },
  harvestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlighted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.successBorder,
    gap: 3,
  },
  harvestTagText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  metricLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  metricVal: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginTop: 2,
    textAlign: 'center',
  },
  metricValHighlight: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
    textAlign: 'center',
  },
  metricSub: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
  },
  pricePerKgSub: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.neutralGray,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  dateVal: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutralHeadings,
  },
  specSection: {
    marginBottom: spacing.lg,
  },
  specSectionTitle: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '800',
    color: colors.neutralHeadings,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  specCard: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.sm,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  specLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  specValue: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '800',
    color: colors.neutralHeadings,
    marginVertical: 2,
  },
  specStandard: {
    ...typography.caption,
    fontSize: 9,
    color: colors.primary,
    fontWeight: '600',
  },
  timelineList: {
    backgroundColor: '#FFFFFF',
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.neutralDark,
    flex: 1,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceHighlighted,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.successBorder,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  privacyNoteBody: {
    flex: 1,
  },
  privacyNoteHeading: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.successDark,
    marginBottom: 2,
  },
  privacyNoteText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralBody,
    lineHeight: 16,
  },
  actionButtonsWrap: {
    gap: spacing.sm,
  },
  primaryActionBtn: {},
  secondaryActionBtn: {},
});
