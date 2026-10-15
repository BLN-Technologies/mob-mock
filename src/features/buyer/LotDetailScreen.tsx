import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CropBadge } from '../../components/ui/CropBadge';
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={18} color={colors.primary} />
        <Text style={styles.backBtnText}>{t.buyer.backToCatalogue}</Text>
      </TouchableOpacity>

      <Image
        source={{
          uri: lot.photos[0] || 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600',
        }}
        style={styles.heroImage}
      />

      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <CropBadge cropName={lot.cropName} size="small" />
          <View style={styles.headerTitleWrap}>
            <Text style={styles.cropTitle}>{lot.cropName}</Text>
            <Text style={styles.lotCode}>
              {lot.lotCode} · {lot.variety || 'Standard Bulk'}
            </Text>
          </View>
          <StatusBadge status={lot.grade} size="small" />
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{t.supplier.remainingStock}</Text>
            <Text style={styles.metricValHighlight}>
              {formatQuantity(lot.availableQuantityKg)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{t.supplier.pricePerKg}</Text>
            <Text style={styles.metricVal}>{formatRwf(lot.pricePerKgRwf)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>District</Text>
            <Text style={styles.metricVal}>{lot.district}</Text>
          </View>
        </View>

        {/* Verification Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Verification & Quality Trail (FR-QA-05):</Text>
          <View style={styles.timelineRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.timelineText}>Harvest confirmed & verified (BR-01)</Text>
          </View>
          <View style={styles.timelineRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.timelineText}>
              Physical moisture & defect inspection completed ({lot.grade})
            </Text>
          </View>
          <View style={styles.timelineRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.timelineText}>
              Cargo administrator approved on{' '}
              {new Date(lot.verifiedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark" size={18} color={colors.successDark} />
          <Text style={styles.privacyNoteText}>
            Commercial trade coordinated and settlement held in escrow by Cargo. Individual farmer contacts remain confidential under Cargo operations (BR-05).
          </Text>
        </View>

        <Button
          title={t.buyer.includeInRequest}
          onPress={onRequestMatch}
          icon={<Ionicons name="cart-outline" size={18} color="#FFFFFF" />}
          size="large"
          fullWidth
          style={styles.actionBtn}
        />
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
    paddingBottom: spacing.xxxl + 20,
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
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    backgroundColor: '#E2E8F0',
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
    fontSize: 18,
    color: colors.neutralHeadings,
  },
  lotCode: {
    ...typography.caption,
    color: colors.neutralGray,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
  },
  metricVal: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginTop: 2,
  },
  metricValHighlight: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  timelineSection: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  timelineTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  timelineText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.neutralDark,
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
    gap: spacing.xs + 2,
  },
  privacyNoteText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.successDark,
    flex: 1,
    lineHeight: 16,
  },
  actionBtn: {
    marginTop: spacing.xs,
  },
});
