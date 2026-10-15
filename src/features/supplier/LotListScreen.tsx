import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing, shadows } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CropBadge } from '../../components/ui/CropBadge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LotDetailModal } from '../../components/ui/LotDetailModal';
import { lotService } from '../../services/mock/mockServices';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';
import { Lot, User } from '../../domain/models';

interface LotListScreenProps {
  user: User;
  onNavigateToCreateLot: () => void;
}

export const LotListScreen: React.FC<LotListScreenProps> = ({
  user,
  onNavigateToCreateLot,
}) => {
  const { t } = useTranslation();
  const [lots, setLots] = useState<Lot[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

  const loadLots = async () => {
    const fetched = await lotService.getLotsForSupplier(user.organizationId);
    setLots(fetched);
  };

  useEffect(() => {
    loadLots();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLots();
    setRefreshing(false);
  };

  const statusChips = [
    { key: 'ALL', label: t.supplier.allLots },
    { key: 'SUBMITTED', label: t.supplier.pendingInspection },
    { key: 'VERIFIED', label: t.statuses.VERIFIED },
    { key: 'RESERVED', label: t.statuses.RESERVED },
    { key: 'SOLD', label: t.statuses.SOLD },
  ];

  const filteredLots = useMemo(() => {
    return lots.filter(l => {
      const matchesFilter = filter === 'ALL' || l.status === filter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        l.cropName.toLowerCase().includes(q) ||
        (l.variety && l.variety.toLowerCase().includes(q)) ||
        l.lotCode.toLowerCase().includes(q) ||
        l.pickupDistrict.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [lots, filter, searchQuery]);

  const totalVolumeKg = lots.reduce((acc, l) => acc + l.remainingQuantityKg, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Top Summary Banner */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.title}>{t.supplier.declaredLots}</Text>
              <Text style={styles.subtitle}>{t.supplier.lotsSubtitle}</Text>
            </View>
            <Button
              title={t.supplier.createNewLot}
              onPress={onNavigateToCreateLot}
              size="small"
              icon={<Ionicons name="add" size={16} color="#FFFFFF" />}
            />
          </View>

          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNum}>{lots.length}</Text>
              <Text style={styles.summaryStatLabel}>{t.supplier.allLots}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNum}>{formatQuantity(totalVolumeKg)}</Text>
              <Text style={styles.summaryStatLabel}>{t.supplier.summaryVolume}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatNum, { color: colors.primary }]}>
                {lots.filter(l => l.status === 'VERIFIED').length}
              </Text>
              <Text style={styles.summaryStatLabel}>{t.statuses.VERIFIED}</Text>
            </View>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={colors.neutralGray} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t.common.searchPlaceholder}
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.neutralGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {statusChips.map(c => {
            const count =
              c.key === 'ALL' ? lots.length : lots.filter(l => l.status === c.key).length;
            const isActive = filter === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setFilter(c.key)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {c.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List of Lots or Empty State */}
        {filteredLots.length === 0 ? (
          <EmptyState
            icon="leaf-outline"
            title={t.supplier.noLotsFound}
            description={t.supplier.noLotsDesc}
            actionTitle={t.supplier.createNewLot}
            onActionPress={onNavigateToCreateLot}
          />
        ) : (
          filteredLots.map(lot => (
            <Card
              key={lot.id}
              onPress={() => setSelectedLot(lot)}
              style={styles.lotCard}
            >
              <View style={styles.lotHeader}>
                <CropBadge cropName={lot.cropName} size="small" />
                <View style={styles.lotHeaderCenter}>
                  <Text style={styles.cropTitle}>{lot.cropName}</Text>
                  <Text style={styles.lotCode}>
                    {lot.lotCode} · {lot.variety || 'Standard Bulk'}
                  </Text>
                </View>
                <StatusBadge status={lot.status} size="small" />
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t.supplier.originalQuantity}</Text>
                  <Text style={styles.detailVal}>{formatQuantity(lot.totalQuantityKg)}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t.supplier.remainingStock}</Text>
                  <Text style={[styles.detailVal, { color: colors.primary }]}>
                    {formatQuantity(lot.remainingQuantityKg)}
                  </Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t.supplier.pricePerKg}</Text>
                  <Text style={styles.detailVal}>{formatRwf(lot.pricePerKgRwf)}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.locationWrap}>
                  <Ionicons name="location-outline" size={13} color={colors.neutralGray} />
                  <Text style={styles.footerInfo}>
                    {lot.pickupDistrict} · {new Date(lot.harvestDate).toLocaleDateString()}
                  </Text>
                </View>
                {lot.grade ? (
                  <StatusBadge status={lot.grade} size="small" />
                ) : (
                  <Text style={styles.detailsActionText}>{t.common.viewDetails} →</Text>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Lot Inspection Details Modal */}
      <LotDetailModal
        lot={selectedLot}
        visible={!!selectedLot}
        onClose={() => setSelectedLot(null)}
      />
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
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
    maxWidth: 220,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatNum: {
    ...typography.h3,
    fontSize: 16,
    color: colors.neutralHeadings,
  },
  summaryStatLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.neutralDark,
  },
  chipRow: {
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
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
    marginBottom: spacing.sm + 2,
  },
  lotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lotHeaderCenter: {
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
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
  },
  detailVal: {
    ...typography.bodyMedium,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  footerInfo: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  detailsActionText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
