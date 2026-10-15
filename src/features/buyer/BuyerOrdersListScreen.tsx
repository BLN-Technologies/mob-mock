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
import { orderService } from '../../services/mock/mockServices';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';
import { Order, User } from '../../domain/models';

interface BuyerOrdersListScreenProps {
  user: User;
  onSelectOrder: (order: Order) => void;
  onNavigateToCatalogue: () => void;
}

export const BuyerOrdersListScreen: React.FC<BuyerOrdersListScreenProps> = ({
  user,
  onSelectOrder,
  onNavigateToCatalogue,
}) => {
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
        <Text style={styles.title}>{t.buyer.orders}</Text>
        <Text style={styles.subtitle}>Track order milestones, payments, and delivery receipts.</Text>

        {orders.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="No orders placed yet"
            description="Browse verified produce or accept an offer to create an order."
            actionTitle="Browse Catalogue"
            onActionPress={onNavigateToCatalogue}
          />
        ) : (
          orders.map(order => (
            <TouchableOpacity
              key={order.id}
              activeOpacity={0.8}
              onPress={() => onSelectOrder(order)}
            >
              <Card>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.cropGrade}>{order.cropName} · {order.grade}</Text>
                  </View>
                  <StatusBadge status={order.status} />
                </View>

                <View style={styles.detailsRow}>
                  <View>
                    <Text style={styles.label}>Quantity</Text>
                    <Text style={styles.val}>{formatQuantity(order.totalQuantityKg)}</Text>
                  </View>
                  <View>
                    <Text style={styles.label}>Total Value</Text>
                    <Text style={[styles.val, { color: colors.primary }]}>{formatRwf(order.totalAmountRwf)}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.footerInfo}>📍 {order.deliveryDistrict} · {order.agreedDeliveryDate}</Text>
                  <View style={styles.viewBadge}>
                    <Text style={styles.viewBadgeText}>Manage Order →</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  cropGrade: {
    fontSize: 12,
    color: colors.neutralGray,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: radii.sm,
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    color: colors.neutralGray,
  },
  val: {
    fontSize: 14,
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
  viewBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.xs,
  },
  viewBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
