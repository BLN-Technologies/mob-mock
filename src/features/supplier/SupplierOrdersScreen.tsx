import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <Text style={styles.title}>Cooperative Supply Orders</Text>
        <Text style={styles.subtitle}>Institutional orders fulfilled by your cooperative.</Text>

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
              <Card key={order.id}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderNum}>{order.orderNumber}</Text>
                    <Text style={styles.orderSub}>{order.cropName} · {order.grade}</Text>
                  </View>
                  <StatusBadge status={order.status} />
                </View>

                {myAllocations.map(alloc => (
                  <View key={alloc.id} style={styles.allocBox}>
                    <Text style={styles.allocTitle}>Supply Allocation ({alloc.lotCode}):</Text>
                    <View style={styles.allocRow}>
                      <Text style={styles.allocLabel}>Quantity</Text>
                      <Text style={styles.allocVal}>{formatQuantity(alloc.quantityKg)}</Text>
                    </View>
                    <View style={styles.allocRow}>
                      <Text style={styles.allocLabel}>Agreed Price</Text>
                      <Text style={styles.allocVal}>{formatRwf(alloc.pricePerKgRwf)} / kg</Text>
                    </View>
                    <View style={styles.allocRow}>
                      <Text style={styles.allocLabel}>Cargo Commission (3%)</Text>
                      <Text style={styles.allocVal}>- {formatRwf(alloc.supplierFeeRwf)}</Text>
                    </View>
                    <View style={[styles.allocRow, styles.payoutRow]}>
                      <Text style={styles.payoutLabel}>Expected Net Payout</Text>
                      <Text style={styles.payoutVal}>{formatRwf(alloc.expectedSupplierPayoutRwf)}</Text>
                    </View>
                  </View>
                ))}

                <View style={styles.orderFooter}>
                  <Text style={styles.footerText}>
                    📅 Delivery: {order.agreedDeliveryDate} · {order.deliveryDistrict}
                  </Text>
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNum: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  orderSub: {
    fontSize: 12,
    color: colors.neutralGray,
    marginTop: 2,
  },
  allocBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: radii.sm,
    marginBottom: 10,
  },
  allocTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralDark,
    marginBottom: 8,
  },
  allocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  allocLabel: {
    fontSize: 12,
    color: colors.neutralGray,
  },
  allocVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutralDark,
  },
  payoutRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    marginTop: 4,
    marginBottom: 0,
  },
  payoutLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  payoutVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  orderFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 12,
    color: colors.neutralGray,
  },
});
