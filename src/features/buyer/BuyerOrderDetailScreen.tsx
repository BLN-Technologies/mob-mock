import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CropBadge } from '../../components/ui/CropBadge';
import { orderService } from '../../services/mock/mockServices';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';
import { projectAllocationsForBuyer } from '../../domain/projections/buyerProjections';
import { Order, User } from '../../domain/models';
import { PaymentMethod } from '../../domain/enums';

interface BuyerOrderDetailScreenProps {
  order: Order;
  user: User;
  onRefreshNeeded: () => void;
  onBack: () => void;
}

export const BuyerOrderDetailScreen: React.FC<BuyerOrderDetailScreenProps> = ({
  order,
  user,
  onRefreshNeeded,
  onBack,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [receivedKg, setReceivedKg] = useState(String(order.totalQuantityKg));
  const [notes, setNotes] = useState('');

  const buyerAllocations = projectAllocationsForBuyer(order.allocations);

  const handleSimulatePayment = async () => {
    Alert.alert(
      t.buyer.payOrder,
      `Simulate payment of ${formatRwf(order.totalAmountRwf)} via licensed payment partner (MTN MoMo or Bank Transfer). In mock mode, no real funds are moved (BR-03, FR-PAY-01).`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: 'Confirm MoMo Payment (Demo)',
          onPress: async () => {
            setLoading(true);
            try {
              await orderService.simulatePayment(order.id, PaymentMethod.MOBILE_MONEY);
              onRefreshNeeded();
              Alert.alert(
                t.buyer.paymentSuccess,
                'Payment verified by payment partner adapter. Order has moved to Paid and is authorized for dispatch (BR-03).'
              );
            } catch (err: any) {
              Alert.alert('Payment Error', err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirmDelivery = async (action: 'ACCEPT_FULL' | 'ACCEPT_ADJUSTED' | 'DISPUTED') => {
    setLoading(true);
    try {
      await orderService.recordDeliveryReceipt(
        order.id,
        user.id,
        Number(receivedKg),
        order.grade,
        action,
        notes
      );
      setShowDeliveryModal(false);
      onRefreshNeeded();
      Alert.alert(
        action === 'DISPUTED' ? 'Dispute Opened' : 'Delivery Accepted',
        action === 'DISPUTED'
          ? 'Dispute opened. Supplier settlement on this order is on hold until Cargo operations adjudicates (BR-04, FR-DSP-02).'
          : 'Delivery accepted. Supplier payouts have been queued for settlement (FR-DEL-05).'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={18} color={colors.primary} />
        <Text style={styles.backButtonText}>Back to Orders</Text>
      </TouchableOpacity>

      <Card style={styles.mainCard}>
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

        {/* Financial Breakdown */}
        <View style={styles.breakdownBox}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Produce Subtotal</Text>
            <Text style={styles.breakdownVal}>{formatRwf(order.subtotalRwf)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Cargo Platform Fee (5%)</Text>
            <Text style={styles.breakdownVal}>{formatRwf(order.buyerFeeRwf)}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Escrow Value</Text>
            <Text style={styles.totalVal}>{formatRwf(order.totalAmountRwf)}</Text>
          </View>
        </View>

        {/* Delivery Terms */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>Delivery Information:</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <Text style={styles.infoText}>
              {order.deliveryAddress}, {order.deliveryDistrict}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={styles.infoText}>Target Delivery: {order.agreedDeliveryDate}</Text>
          </View>
          {order.paymentReference ? (
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={14} color={colors.primary} />
              <Text style={styles.paymentRefText}>
                Escrow Ref: {order.paymentReference}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Allocations (Privacy protected: no supplier personal contacts!) */}
        <View style={styles.allocationsSection}>
          <Text style={styles.sectionHeader}>
            Pooled Supply Batches ({buyerAllocations.length}):
          </Text>
          {buyerAllocations.map((alloc, idx) => (
            <View key={idx} style={styles.allocRow}>
              <Text style={styles.allocCode}>{alloc.lotCode}</Text>
              <Text style={styles.allocQty}>
                {formatQuantity(alloc.quantityKg)} @ {formatRwf(alloc.pricePerKgRwf)}/kg
              </Text>
            </View>
          ))}
        </View>

        {/* Actions based on Order State */}
        {order.status === 'CONFIRMED' || order.status === 'PAYMENT_PENDING' ? (
          <Button
            title={t.buyer.payOrder}
            onPress={handleSimulatePayment}
            loading={loading}
            icon={<Ionicons name="card" size={18} color="#FFFFFF" />}
            size="large"
            fullWidth
            style={styles.actionBtn}
          />
        ) : null}

        {order.status === 'DISPATCHED' || order.status === 'DELIVERED' ? (
          <Button
            title={t.buyer.confirmReceipt}
            onPress={() => setShowDeliveryModal(true)}
            icon={<Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" />}
            size="large"
            fullWidth
            style={styles.actionBtn}
          />
        ) : null}

        {order.status === 'ACCEPTED' || order.status === 'SETTLED' ? (
          <View style={styles.completedNotice}>
            <Ionicons name="checkmark-circle" size={18} color={colors.successDark} />
            <Text style={styles.completedText}>Trade Fulfilled & Fully Settled</Text>
          </View>
        ) : null}
      </Card>

      {/* Delivery Receipt Modal / Form */}
      {showDeliveryModal ? (
        <Card style={styles.receiptCard}>
          <Text style={styles.receiptTitle}>Record Delivery Receipt (FR-DEL-03)</Text>
          <Text style={styles.receiptSubtitle}>
            Inspect delivered goods at warehouse. Enter received quantity. If quality discrepancy exists, trigger quality dispute.
          </Text>

          <Text style={styles.inputLabel}>Received Quantity (kg):</Text>
          <TextInput
            style={styles.receiptInput}
            value={receivedKg}
            onChangeText={setReceivedKg}
            keyboardType="numeric"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Warehouse Receipt Notes:</Text>
          <TextInput
            style={styles.receiptInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Moisture verified, packaging intact"
            placeholderTextColor="#94A3B8"
          />

          <View style={styles.receiptButtons}>
            <Button
              title="Accept Full Delivery"
              onPress={() => handleConfirmDelivery('ACCEPT_FULL')}
              loading={loading}
              fullWidth
              style={{ marginBottom: spacing.sm }}
            />
            <Button
              title="Open Quality Dispute (Pause Settlement)"
              onPress={() => handleConfirmDelivery('DISPUTED')}
              variant="danger"
              fullWidth
              style={{ marginBottom: spacing.sm }}
            />
            <Button
              title={t.common.cancel}
              onPress={() => setShowDeliveryModal(false)}
              variant="secondary"
              fullWidth
            />
          </View>
        </Card>
      ) : null}
    </ScrollView>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 4,
    paddingVertical: spacing.xs,
  },
  backButtonText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  mainCard: {
    padding: spacing.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  orderHeaderMeta: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  orderNumber: {
    ...typography.h2,
    fontSize: 18,
    color: colors.neutralHeadings,
  },
  cropGrade: {
    ...typography.caption,
    color: colors.neutralGray,
  },
  breakdownBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    ...typography.caption,
    color: colors.neutralGray,
  },
  breakdownVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs + 2,
    marginTop: spacing.xs,
    marginBottom: 0,
  },
  totalLabel: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralHeadings,
  },
  totalVal: {
    ...typography.bodyMedium,
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  infoSection: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.neutralDark,
  },
  paymentRefText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  allocationsSection: {
    marginBottom: spacing.lg,
  },
  allocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  allocCode: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  allocQty: {
    ...typography.caption,
    fontSize: 12,
    color: colors.neutralDark,
  },
  actionBtn: {
    marginTop: spacing.xs,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHighlighted,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.successBorder,
    gap: 8,
    marginTop: spacing.xs,
  },
  completedText: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.successDark,
  },
  receiptCard: {
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.lg,
  },
  receiptTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.neutralHeadings,
    marginBottom: 2,
  },
  receiptSubtitle: {
    ...typography.caption,
    color: colors.neutralGray,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  inputLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginBottom: spacing.xs,
  },
  receiptInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    height: 46,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    marginBottom: spacing.md,
    color: colors.neutralDark,
  },
  receiptButtons: {
    marginTop: spacing.xs,
  },
});
