import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CropBadge } from '../../components/ui/CropBadge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/feedback/EmptyState';
import { lotService } from '../../services/mock/mockServices';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';
import { BuyerLotProjection } from '../../domain/models';

interface BuyerCatalogueScreenProps {
  onNavigateToCreateRequest: () => void;
  onSelectLot: (lot: BuyerLotProjection) => void;
}

export const BuyerCatalogueScreen: React.FC<BuyerCatalogueScreenProps> = ({
  onNavigateToCreateRequest,
  onSelectLot,
}) => {
  const { t } = useTranslation();
  const [lots, setLots] = useState<BuyerLotProjection[]>([]);
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const loadCatalogue = async () => {
    const fetched = await lotService.getBuyerCatalogue(selectedCrop, selectedGrade);
    setLots(fetched);
  };

  useEffect(() => {
    loadCatalogue();
  }, [selectedCrop, selectedGrade]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCatalogue();
    setRefreshing(false);
  };

  const cropChips = ['All', 'Maize', 'Dry Beans', 'Irish Potatoes'];
  const gradeChips = ['All', 'GRADE_A', 'GRADE_B'];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header Action */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>{t.buyer.catalogue}</Text>
            <Text style={styles.subtitle}>
              Inspected, field-graded, and Cargo-verified inventory (BR-02 & BR-05).
            </Text>
          </View>
          <Button
            title={t.buyer.postRequest}
            onPress={onNavigateToCreateRequest}
            icon={<Ionicons name="add" size={16} color="#FFF" />}
            size="small"
          />
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {cropChips.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, selectedCrop === c && styles.chipActive]}
              onPress={() => setSelectedCrop(c)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, selectedCrop === c && styles.chipTextActive]}>
                {c === 'All' ? t.common.all : c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.chipScroll, { marginTop: 4 }]}
        >
          {gradeChips.map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, selectedGrade === g && styles.chipActive]}
              onPress={() => setSelectedGrade(g)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, selectedGrade === g && styles.chipTextActive]}>
                {g === 'All' ? 'All Quality Grades' : g === 'GRADE_A' ? 'Grade A (Premium)' : 'Grade B'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Catalogue Items */}
        {lots.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No matching verified produce"
            description="No current stock matches your selected filters. You can post a custom institutional sourcing request."
            actionTitle={t.buyer.postRequest}
            onActionPress={onNavigateToCreateRequest}
          />
        ) : (
          lots.map(lot => (
            <Card
              key={lot.id}
              onPress={() => onSelectLot(lot)}
              style={styles.lotCard}
              padding="none"
            >
              <Image
                source={{
                  uri: lot.photos[0] || 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600',
                }}
                style={styles.lotImage}
              />
              <View style={styles.lotCardBody}>
                <View style={styles.cardHeaderRow}>
                  <CropBadge cropName={lot.cropName} size="small" />
                  <View style={styles.cropInfoWrap}>
                    <Text style={styles.cropTitle}>{lot.cropName}</Text>
                    <Text style={styles.lotCode}>
                      {lot.lotCode} · {lot.variety || 'Standard Bulk'}
                    </Text>
                  </View>
                  <StatusBadge status={lot.grade} size="small" />
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>{t.supplier.remainingStock}</Text>
                    <Text style={styles.metricValHighlight}>
                      {formatQuantity(lot.availableQuantityKg)}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Location</Text>
                    <Text style={styles.metricVal}>{lot.district}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.priceLabel}>Wholesale Unit Price</Text>
                    <Text style={styles.priceText}>{formatRwf(lot.pricePerKgRwf)} / kg</Text>
                  </View>
                  <View style={styles.detailsBadge}>
                    <Text style={styles.detailsBadgeText}>{t.common.viewDetails} →</Text>
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.h2,
    fontSize: 18,
    color: colors.neutralHeadings,
  },
  subtitle: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 2,
  },
  chipScroll: {
    marginBottom: spacing.xs,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.xs + 2,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.neutralDark,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  lotCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  lotImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#E2E8F0',
  },
  lotCardBody: {
    padding: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cropInfoWrap: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  cropTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.neutralHeadings,
  },
  lotCode: {
    ...typography.caption,
    color: colors.neutralGray,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
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
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginTop: 1,
  },
  metricValHighlight: {
    ...typography.bodyMedium,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  priceLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
  },
  priceText: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  detailsBadge: {
    backgroundColor: colors.surfaceHighlighted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  detailsBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
