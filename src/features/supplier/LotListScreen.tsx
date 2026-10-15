import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/feedback/EmptyState';
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
  const [refreshing, setRefreshing] = useState(false);

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
    { key: 'ALL', label: 'All Lots' },
    { key: 'SUBMITTED', label: 'Pending Inspection' },
    { key: 'VERIFIED', label: 'Verified Available' },
    { key: 'RESERVED', label: 'Reserved' },
    { key: 'SOLD', label: 'Sold' },
  ];

  const filteredLots = lots.filter(l => {
    if (filter === 'ALL') return true;
    return l.status === filter;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <Text style={styles.title}>Cooperative Lot Declarations</Text>
        <Text style={styles.subtitle}>Harvested produce lots declared for inspection and bulk market listing.</Text>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {statusChips.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, filter === c.key && styles.chipActive]}
              onPress={() => setFilter(c.key)}
            >
              <Text style={[styles.chipText, filter === c.key && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredLots.length === 0 ? (
          <EmptyState
            icon="leaf-outline"
            title="No lots found"
            description="No harvest lots match your selected filter."
            actionTitle={t.supplier.createNewLot}
            onActionPress={onNavigateToCreateLot}
          />
        ) : (
          filteredLots.map(lot => (
            <Card key={lot.id}>
              <View style={styles.lotHeader}>
                <View>
                  <Text style={styles.cropTitle}>{lot.cropName}</Text>
                  <Text style={styles.lotCode}>{lot.lotCode} · {lot.variety || 'Standard'}</Text>
                </View>
                <StatusBadge status={lot.status} />
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Original Quantity</Text>
                  <Text style={styles.detailVal}>{formatQuantity(lot.totalQuantityKg)}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Remaining Stock</Text>
                  <Text style={[styles.detailVal, { color: colors.primary }]}>{formatQuantity(lot.remainingQuantityKg)}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Price / kg</Text>
                  <Text style={styles.detailVal}>{formatRwf(lot.pricePerKgRwf)}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.footerInfo}>
                  📍 {lot.pickupDistrict} · Harvest: {new Date(lot.harvestDate).toLocaleDateString()}
                </Text>
                {lot.grade ? <StatusBadge status={lot.grade} /> : null}
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
    backgroundColor: '#F5F4F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  subtitle: {
    fontSize: 13,
    color: colors.neutralGray,
    marginTop: 4,
    marginBottom: 16,
  },
  chipRow: {
    marginBottom: 16,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.neutralDark,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  lotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cropTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  lotCode: {
    fontSize: 12,
    color: colors.neutralGray,
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: radii.sm,
    marginBottom: 10,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.neutralGray,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralDark,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerInfo: {
    fontSize: 12,
    color: colors.neutralGray,
  },
});
