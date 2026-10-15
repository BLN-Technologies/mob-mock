import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { lotService, orderService, authService } from '../../services/mock/mockServices';
import { formatRwf } from '../../domain/calculations/lotCalculations';
import { User, Lot, Order } from '../../domain/models';

interface SupplierHomeScreenProps {
  user: User;
  onNavigateToCreateLot: () => void;
  onNavigateToLots: () => void;
  onNavigateToOrders: () => void;
}

export const SupplierHomeScreen: React.FC<SupplierHomeScreenProps> = ({
  user,
  onNavigateToCreateLot,
  onNavigateToLots,
  onNavigateToOrders,
}) => {
  const { t } = useTranslation();
  const [lots, setLots] = useState<Lot[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const org = authService.getUserOrganization(user);

  const loadData = async () => {
    const fetchedLots = await lotService.getLotsForSupplier(user.organizationId);
    const fetchedOrders = await orderService.getOrders(user);
    setLots(fetchedLots);
    setOrders(fetchedOrders);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const activeLotsCount = lots.filter(l => l.status === 'VERIFIED' || l.status === 'RESERVED').length;
  const pendingInspectionCount = lots.filter(l => l.status === 'SUBMITTED').length;
  const inProgressOrdersCount = orders.filter(o => o.status !== 'SETTLED' && o.status !== 'CANCELLED').length;

  const totalExpectedPayout = orders
    .filter(o => o.status !== 'CANCELLED')
    .flatMap(o => o.allocations.filter(a => a.supplierOrgId === user.organizationId))
    .reduce((sum, a) => sum + a.expectedSupplierPayoutRwf, 0);

  return (
    <View style={styles.container}>
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Header Greeting */}
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Muraho, {user.fullName}</Text>
            <Text style={styles.orgName}>{org?.name || 'Cooperative Member'}</Text>
          </View>
          <StatusBadge status={org?.verificationStatus || 'VERIFIED'} />
        </View>

        {/* Action Button */}
        <Button
          title={t.supplier.createNewLot}
          onPress={onNavigateToCreateLot}
          icon={<Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />}
          style={styles.actionBtn}
        />

        {/* Live Metrics Grid */}
        <Text style={styles.sectionTitle}>{t.supplier.dashboard}</Text>
        <View style={styles.metricsGrid}>
          <TouchableOpacity style={styles.metricCard} onPress={onNavigateToLots}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="cube-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.metricValue}>{activeLotsCount}</Text>
            <Text style={styles.metricLabel}>{t.supplier.activeLots}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.metricCard} onPress={onNavigateToLots}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={22} color="#B45309" />
            </View>
            <Text style={styles.metricValue}>{pendingInspectionCount}</Text>
            <Text style={styles.metricLabel}>{t.supplier.pendingInspection}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.metricCard} onPress={onNavigateToOrders}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="cart-outline" size={22} color="#1D4ED8" />
            </View>
            <Text style={styles.metricValue}>{inProgressOrdersCount}</Text>
            <Text style={styles.metricLabel}>{t.supplier.ordersInProgress}</Text>
          </TouchableOpacity>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="cash-outline" size={22} color="#7E22CE" />
            </View>
            <Text style={[styles.metricValue, { fontSize: 16 }]}>{formatRwf(totalExpectedPayout)}</Text>
            <Text style={styles.metricLabel}>{t.supplier.expectedPayouts}</Text>
          </View>
        </View>

        {/* Recent Lots */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Declared Lots</Text>
          <TouchableOpacity onPress={onNavigateToLots}>
            <Text style={styles.seeAllText}>See all ({lots.length})</Text>
          </TouchableOpacity>
        </View>

        {lots.slice(0, 3).map(lot => (
          <Card key={lot.id}>
            <View style={styles.lotHeader}>
              <View>
                <Text style={styles.lotCrop}>{lot.cropName}</Text>
                <Text style={styles.lotCode}>{lot.lotCode}</Text>
              </View>
              <StatusBadge status={lot.status} />
            </View>

            <View style={styles.lotDetails}>
              <Text style={styles.lotInfoText}>
                📦 {lot.remainingQuantityKg.toLocaleString()} kg · 📍 {lot.pickupDistrict}
              </Text>
              <Text style={styles.lotPrice}>{formatRwf(lot.pricePerKgRwf)} / kg</Text>
            </View>
          </Card>
        ))}
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
  headerCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radii.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  orgName: {
    fontSize: 13,
    color: colors.neutralGray,
    marginTop: 2,
  },
  actionBtn: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutralDark,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: colors.surface,
    width: '48%',
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutralDark,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.neutralGray,
  },
  lotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  lotCrop: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  lotCode: {
    fontSize: 12,
    color: colors.neutralGray,
    marginTop: 2,
  },
  lotDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  lotInfoText: {
    fontSize: 13,
    color: colors.neutralDark,
  },
  lotPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
