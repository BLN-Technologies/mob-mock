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
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CropBadge } from '../../components/ui/CropBadge';
import { LotDetailModal } from '../../components/ui/LotDetailModal';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { lotService, orderService, authService } from '../../services/mock/mockServices';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';
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
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Welcome Executive Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroAvatar}>
              <Text style={styles.avatarLetter}>
                {user.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.greetingText}>
                {t.supplier.greeting}, {user.fullName}
              </Text>
              <Text style={styles.coopName}>
                {org?.name || 'Cooperative Member'}
              </Text>
            </View>
            <StatusBadge status={org?.verificationStatus || 'VERIFIED'} size="small" />
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroLocationRow}>
            <View style={styles.heroSubItem}>
              <Ionicons name="location-outline" size={14} color="#DCFCE7" />
              <Text style={styles.heroSubText}>
                {org?.district || 'Eastern Province'}, {org?.sector || 'Rwanda'}
              </Text>
            </View>
            <View style={styles.heroSubItem}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#DCFCE7" />
              <Text style={styles.heroSubText}>Reg: {org?.registrationNumber || 'COOP-RCA'}</Text>
            </View>
          </View>
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionContainer}>
          <Button
            title={t.supplier.declare}
            onPress={onNavigateToCreateLot}
            size="large"
            icon={<Ionicons name="add-circle" size={22} color="#FFFFFF" />}
            fullWidth
          />
        </View>

        {/* Live Business Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.supplier.dashboard}</Text>
          <Text style={styles.sectionSubtitle}>Commercial activity & lot pipeline</Text>
        </View>

        <View style={styles.metricsGrid}>
          {/* Active Lots */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToLots}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="cube" size={20} color={colors.primary} />
            </View>
            <Text style={styles.metricValue}>{activeLotsCount}</Text>
            <Text style={styles.metricLabel}>{t.supplier.activeLots}</Text>
          </TouchableOpacity>

          {/* Pending Inspection */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToLots}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={20} color={colors.warningDark} />
            </View>
            <Text style={[styles.metricValue, { color: colors.warningDark }]}>
              {pendingInspectionCount}
            </Text>
            <Text style={styles.metricLabel}>{t.supplier.pendingInspection}</Text>
          </TouchableOpacity>

          {/* In Progress Orders */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToOrders}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="cart" size={20} color={colors.infoDark} />
            </View>
            <Text style={styles.metricValue}>{inProgressOrdersCount}</Text>
            <Text style={styles.metricLabel}>{t.supplier.ordersInProgress}</Text>
          </TouchableOpacity>

          {/* Expected Payouts */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToOrders}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="cash" size={20} color="#7E22CE" />
            </View>
            <Text style={[styles.metricValue, { fontSize: 15 }]}>
              {formatRwf(totalExpectedPayout)}
            </Text>
            <Text style={styles.metricLabel}>{t.supplier.expectedPayouts}</Text>
          </TouchableOpacity>
        </View>

        {/* Actions Required / Next Steps Notice */}
        {pendingInspectionCount > 0 && (
          <View style={styles.actionNoticeCard}>
            <View style={styles.actionNoticeHeader}>
              <Ionicons name="information-circle" size={20} color={colors.warningDark} />
              <Text style={styles.actionNoticeTitle}>{t.supplier.actionsRequired}</Text>
            </View>
            <Text style={styles.actionNoticeBody}>
              {pendingInspectionCount} produce lot(s) await physical moisture and quality grading by an assigned Cargo Field Agent. Keep storage dry and accessible.
            </Text>
          </View>
        )}

        {/* Recent Declared Produce Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>{t.supplier.declaredLots}</Text>
            <Text style={styles.sectionSubtitle}>Recent inventory items</Text>
          </View>
          <TouchableOpacity
            onPress={onNavigateToLots}
            style={styles.seeAllBtn}
            accessibilityRole="button"
          >
            <Text style={styles.seeAllText}>
              {t.common.seeAll} ({lots.length})
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {lots.slice(0, 4).map(lot => (
          <Card
            key={lot.id}
            onPress={() => setSelectedLot(lot)}
            style={styles.lotCard}
          >
            <View style={styles.lotCardTop}>
              <CropBadge cropName={lot.cropName} size="small" />
              <View style={styles.lotCardMeta}>
                <Text style={styles.lotCropTitle}>{lot.cropName}</Text>
                <Text style={styles.lotCodeSubtitle}>
                  {lot.lotCode} · {lot.variety || 'Standard Bulk'}
                </Text>
              </View>
              <StatusBadge status={lot.status} size="small" />
            </View>

            <View style={styles.lotStatsRow}>
              <View style={styles.lotStatItem}>
                <Text style={styles.statLabel}>{t.supplier.remainingStock}</Text>
                <Text style={styles.statValueHighlight}>
                  {formatQuantity(lot.remainingQuantityKg)}
                </Text>
              </View>
              <View style={styles.lotStatItem}>
                <Text style={styles.statLabel}>{t.supplier.pricePerKg}</Text>
                <Text style={styles.statValue}>{formatRwf(lot.pricePerKgRwf)}</Text>
              </View>
              <View style={styles.lotStatItem}>
                <Text style={styles.statLabel}>{t.supplier.qualityGrade}</Text>
                <Text style={styles.statValue}>
                  {lot.grade ? lot.grade.replace('GRADE_', 'Grade ') : 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.lotCardFooter}>
              <View style={styles.locationWrap}>
                <Ionicons name="location-outline" size={13} color={colors.neutralGray} />
                <Text style={styles.footerDistrict}>{lot.pickupDistrict}</Text>
              </View>
              <Text style={styles.tapToViewText}>{t.common.viewDetails} →</Text>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Lot Inspection & Specification Detail Modal */}
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
  heroCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroTextCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  greetingText: {
    ...typography.h3,
    fontSize: 16,
    color: '#FFFFFF',
  },
  coopName: {
    ...typography.caption,
    color: '#DCFCE7',
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: spacing.md,
  },
  heroLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroSubText: {
    fontSize: 11,
    color: '#DCFCE7',
    fontWeight: '500',
  },
  actionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 17,
    color: colors.neutralHeadings,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricCard: {
    backgroundColor: colors.surface,
    width: '48%',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  metricValue: {
    ...typography.h2,
    fontSize: 20,
    color: colors.neutralHeadings,
    marginBottom: 2,
  },
  metricLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  actionNoticeCard: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  actionNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  actionNoticeTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.warningDark,
    fontSize: 12,
  },
  actionNoticeBody: {
    ...typography.caption,
    color: colors.neutralBody,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2,
  },
  lotCard: {
    marginBottom: spacing.sm + 2,
  },
  lotCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lotCardMeta: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  lotCropTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.neutralHeadings,
  },
  lotCodeSubtitle: {
    ...typography.caption,
    color: colors.neutralGray,
  },
  lotStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  lotStatItem: {
    flex: 1,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
  },
  statValue: {
    ...typography.bodyMedium,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginTop: 1,
  },
  statValueHighlight: {
    ...typography.bodyMedium,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
  },
  lotCardFooter: {
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
  footerDistrict: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  tapToViewText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
});
