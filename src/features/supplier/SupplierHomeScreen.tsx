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
  const { t, language } = useTranslation();
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

  const totalLotsCount = lots.length;
  const awaitingInspectionCount = lots.filter(
    l => l.status === 'SUBMITTED' || (l.status as string) === 'INSPECTION'
  ).length;
  // Strictly do not count reserved stock as freely available stock (Section 4.1 & 5.2)
  const verifiedEligibleStockKg = lots
    .filter(l => l.status === 'VERIFIED')
    .reduce((sum, l) => sum + Math.max(0, l.remainingQuantityKg - (l.reservedQuantityKg || 0)), 0);
  const reservedStockKg = lots.reduce((sum, l) => sum + (l.reservedQuantityKg || 0), 0);
  const deliveredOrSoldStockKg = orders
    .flatMap(o =>
      o.allocations.filter(
        a =>
          a.supplierOrgId === user.organizationId &&
          (o.status === 'DELIVERED' || o.status === 'ACCEPTED' || o.status === 'SETTLED')
      )
    )
    .reduce((sum, a) => sum + a.quantityKg, 0);

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
                {org?.name || 'Agricultural Supplier Cooperative'}
              </Text>
            </View>
            <StatusBadge status={org?.verificationStatus || 'VERIFIED'} size="small" />
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroLocationRow}>
            <View style={styles.heroSubItem}>
              <Ionicons name="location-outline" size={14} color="#EAF2EC" />
              <Text style={styles.heroSubText}>
                {org?.district || 'Nyagatare'}, {org?.sector || 'Karangazi'}
              </Text>
            </View>
            <View style={styles.heroSubItem}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#EAF2EC" />
              <Text style={styles.heroSubText}>Reg: {org?.registrationNumber || 'RCA/2026'}</Text>
            </View>
          </View>
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionContainer}>
          <Button
            title={language === 'rw' ? 'Menyekanisha Umusaruro Wawusaruye' : 'Declare Harvested Lot'}
            onPress={onNavigateToCreateLot}
            size="large"
            icon={<Ionicons name="add-circle" size={20} color="#FFFFFF" />}
            fullWidth
          />
        </View>

        {/* Operational Overview Metrics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {language === 'rw' ? 'Ibarurishamibare ry\'Ubucuruzi' : 'Warehouse Stock & Lot Operations'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {language === 'rw' ? 'Imiterere y\'ingano n\'ububiko bwa koperative' : 'Real-time lot pipeline and reserved stock breakdown'}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          {/* Total Lots */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToLots}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#EAF2EC' }]}>
              <Ionicons name="layers" size={18} color="#174A35" />
            </View>
            <Text style={styles.metricValue}>{totalLotsCount}</Text>
            <Text style={styles.metricLabel}>{language === 'rw' ? 'Yose Hamwe' : 'Total Lots'}</Text>
          </TouchableOpacity>

          {/* Lots Awaiting Inspection */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToLots}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="hourglass-outline" size={18} color="#A96812" />
            </View>
            <Text style={[styles.metricValue, { color: '#A96812' }]}>
              {awaitingInspectionCount}
            </Text>
            <Text style={styles.metricLabel}>
              {language === 'rw' ? 'Ategereje Isuzuma' : 'Awaiting Inspection'}
            </Text>
          </TouchableOpacity>

          {/* Verified / Available Stock */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToLots}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#EAF2EC' }]}>
              <Ionicons name="checkmark-done" size={18} color="#174A35" />
            </View>
            <Text style={[styles.metricValue, { color: '#174A35' }]}>
              {verifiedEligibleStockKg.toLocaleString()} kg
            </Text>
            <Text style={styles.metricLabel}>
              {language === 'rw' ? 'Wemejwe (Available)' : 'Verified Stock'}
            </Text>
          </TouchableOpacity>

          {/* Reserved Stock */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToOrders}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="lock-closed" size={18} color="#2563EB" />
            </View>
            <Text style={[styles.metricValue, { color: '#2563EB' }]}>
              {reservedStockKg.toLocaleString()} kg
            </Text>
            <Text style={styles.metricLabel}>
              {language === 'rw' ? 'Wafashwe (Reserved)' : 'Reserved Stock'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delivered / Sold Stock Banner */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#DCE4DD',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EAF2EC', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="cube" size={18} color="#174A35" />
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#202822' }}>
                {deliveredOrSoldStockKg > 0 ? deliveredOrSoldStockKg.toLocaleString() + ' kg' : '0 kg'}
              </Text>
              <Text style={{ fontSize: 11, color: '#66716A' }}>
                {language === 'rw' ? 'Umusaruro wamaze kugezwa ku baguzi' : 'Delivered or settled stock'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onNavigateToOrders}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#174A35' }}>View Orders</Text>
          </TouchableOpacity>
        </View>

        {/* Actions Required / Next Steps Notice */}
        {awaitingInspectionCount > 0 && (
          <View style={styles.actionNoticeCard}>
            <View style={styles.actionNoticeHeader}>
              <Ionicons name="information-circle" size={20} color={colors.warningDark} />
              <Text style={styles.actionNoticeTitle}>{t.supplier.actionsRequired}</Text>
            </View>
            <Text style={styles.actionNoticeBody}>
              {awaitingInspectionCount} produce lot(s) await physical moisture and quality grading by an assigned Cargo Field Agent. Keep storage dry and accessible.
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
