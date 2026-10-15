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
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CropBadge } from '../../components/ui/CropBadge';
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.headerBox}>
          <Text style={styles.title}>{t.buyer.orders}</Text>
          <Text style={styles.subtitle}>
            Track order milestones, escrow payments, and delivery receipts.
          </Text>
        </View>

        {orders.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="No orders placed yet"
            description="Browse verified produce or accept an offer to create an order."
            actionTitle={t.buyer.catalogue}
            onActionPress={onNavigateToCatalogue}
          />
        ) : (
          orders.map(order => (
            <Card
              key={order.id}
              onPress={() => onSelectOrder(order)}
              style={styles.orderCard}
            >
              <View style={styles.orderHeader}>
                <CropBadge cropName={order.cropName} size="small" />
                <View style={styles.orderHeaderMeta}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.cropGrade}>
                    {order.cropName} · {order.grade}
                  </Text>
                </View>
                <StatusBadge status={order.status} size="small" />
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.label}>Ordered Quantity</Text>
                  <Text style={styles.val}>{formatQuantity(order.totalQuantityKg)}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.label}>Total Trade Value</Text>
                  <Text style={[styles.val, { color: colors.primary }]}>
                    {formatRwf(order.totalAmountRwf)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.locationWrap}>
                  <Ionicons name="location-outline" size={13} color={colors.neutralGray} />
                  <Text style={styles.footerInfo}>
                    {order.deliveryDistrict} · {order.agreedDeliveryDate}
                  </Text>
                </View>
                <View style={styles.viewBadge}>
                  <Text style={styles.viewBadgeText}>{t.common.viewDetails} →</Text>
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
  orderHeaderMeta: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  orderNumber: {
    ...typography.h3,
    fontSize: 15,
    color: colors.neutralHeadings,
  },
  cropGrade: {
    ...typography.caption,
    color: colors.neutralGray,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  detailCol: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
  },
  val: {
    ...typography.bodyMedium,
    fontSize: 13,
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
  viewBadge: {
    backgroundColor: colors.surfaceHighlighted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  viewBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
