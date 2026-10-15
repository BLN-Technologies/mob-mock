import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CropBadge } from '../../components/ui/CropBadge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { orderService } from '../../services/mock/mockServices';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';
import { Order, User } from '../../domain/models';

interface SupplierOrdersScreenProps {
  user: User;
}

export const SupplierOrdersScreen: React.FC<SupplierOrdersScreenProps> = ({ user }) => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    const fetched = await orderService.getOrders(user);
    setOrders(fetched);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.headerBox}>
          <Text style={styles.title}>{t.supplier.ordersInProgress}</Text>
          <Text style={styles.subtitle}>
            Institutional trade contracts fulfilled by your cooperative.
          </Text>
        </View>

        {orders.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="No orders yet"
            description="When buyers accept offers containing your verified lots, allocated orders will appear here."
          />
        ) : (
          orders.map(order => {
            const myAllocations = order.allocations.filter(
              a => a.supplierOrgId === user.organizationId
            );

            return (
              <Card key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <CropBadge cropName={order.cropName} size="small" />
                  <View style={styles.orderMeta}>
                    <Text style={styles.orderNum}>{order.orderNumber}</Text>
                    <Text style={styles.orderSub}>
                      {order.cropName} · {order.grade}
                    </Text>
                  </View>
                  <StatusBadge status={order.status} size="small" />
                </View>

                {myAllocations.map(alloc => (
                  <View key={alloc.id} style={styles.allocBox}>
                    <Text style={styles.allocTitle}>
                      Supply Allocation ({alloc.lotCode}):
                    </Text>
                    <View style={styles.allocRow}>
                      <Text style={styles.allocLabel}>Allocated Volume</Text>
                      <Text style={styles.allocVal}>{formatQuantity(alloc.quantityKg)}</Text>
                    </View>
                    <View style={styles.allocRow}>
                      <Text style={styles.allocLabel}>Agreed Unit Price</Text>
                      <Text style={styles.allocVal}>{formatRwf(alloc.pricePerKgRwf)} / kg</Text>
                    </View>
                    <View style={styles.allocRow}>
                      <Text style={styles.allocLabel}>Cargo Platform Fee (3%)</Text>
                      <Text style={styles.allocFeeVal}>- {formatRwf(alloc.supplierFeeRwf)}</Text>
                    </View>
                    <View style={[styles.allocRow, styles.payoutRow]}>
                      <Text style={styles.payoutLabel}>Net Cooperative Payout</Text>
                      <Text style={styles.payoutVal}>
                        {formatRwf(alloc.expectedSupplierPayoutRwf)}
                      </Text>
                    </View>
                  </View>
                ))}

                <View style={styles.orderFooter}>
                  <View style={styles.footerRow}>
                    <Ionicons name="calendar-outline" size={13} color={colors.neutralGray} />
                    <Text style={styles.footerText}>
                      Delivery: {order.agreedDeliveryDate} · {order.deliveryDistrict}
                    </Text>
                  </View>
                  {order.paymentReference && (
                    <Text style={styles.paymentRefText}>Ref: {order.paymentReference}</Text>
                  )}
                </View>
              </Card>
            );
          })
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
  headerBox: {
    marginBottom: spacing.md,
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
  orderCard: {
    marginBottom: spacing.sm + 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderMeta: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  orderNum: {
    ...typography.h3,
    fontSize: 15,
    color: colors.neutralHeadings,
  },
  orderSub: {
    ...typography.caption,
    color: colors.neutralGray,
  },
  allocBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm + 2,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  allocTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginBottom: spacing.xs,
  },
  allocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  allocLabel: {
    ...typography.caption,
    color: colors.neutralGray,
  },
  allocVal: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.neutralDark,
  },
  allocFeeVal: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.danger,
  },
  payoutRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    marginTop: 4,
    marginBottom: 0,
  },
  payoutLabel: {
    ...typography.bodyMedium,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralHeadings,
  },
  payoutVal: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  paymentRefText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralLight,
  },
});
