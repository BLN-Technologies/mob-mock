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
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { orderService } from '../../services/mock/mockServices';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';
import { projectAllocationsForBuyer } from '../../domain/projections/buyerProjections';
import { Order, User } from '../../domain/models';
import { PaymentMethod, QualityGrade } from '../../domain/enums';

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
      'Simulate Demo Payment',
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
              Alert.alert('Payment Confirmed', 'Payment verified by payment partner adapter. Order has moved to Paid and is authorized for dispatch (BR-03).');
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
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backButtonText}>Back to Orders</Text>
      </TouchableOpacity>

      <Card>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.cropGrade}>{order.cropName} · {order.grade}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        {/* Financial Breakdown */}
        <View style={styles.breakdownBox}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Produce Subtotal</Text>
            <Text style={styles.breakdownVal}>{formatRwf(order.subtotalRwf)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Platform Fee (5%)</Text>
            <Text style={styles.breakdownVal}>{formatRwf(order.buyerFeeRwf)}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Agreed Value</Text>
            <Text style={styles.totalVal}>{formatRwf(order.totalAmountRwf)}</Text>
          </View>
        </View>

        {/* Delivery Terms */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>Delivery Information:</Text>
          <Text style={styles.infoText}>📍 {order.deliveryAddress}, {order.deliveryDistrict}</Text>
          <Text style={styles.infoText}>📅 Target Date: {order.agreedDeliveryDate}</Text>
          {order.paymentReference ? (
            <Text style={[styles.infoText, { color: colors.primary, fontWeight: '600', marginTop: 4 }]}>
              💳 Payment Ref: {order.paymentReference}
            </Text>
          ) : null}
        </View>

        {/* Allocations (Privacy protected: no supplier personal contacts!) */}
        <View style={styles.allocationsSection}>
          <Text style={styles.sectionHeader}>Allocated Batches ({buyerAllocations.length}):</Text>
          {buyerAllocations.map((alloc, idx) => (
            <View key={idx} style={styles.allocRow}>
              <Text style={styles.allocCode}>{alloc.lotCode}</Text>
              <Text style={styles.allocQty}>{formatQuantity(alloc.quantityKg)} @ {formatRwf(alloc.pricePerKgRwf)}/kg</Text>
            </View>
          ))}
        </View>

        {/* Actions based on Order State */}
        {order.status === 'CONFIRMED' || order.status === 'PAYMENT_PENDING' ? (
          <Button
            title={t.buyer.payOrder}
            onPress={handleSimulatePayment}
            loading={loading}
            icon={<Ionicons name="card-outline" size={18} color="#FFF" />}
            style={styles.actionBtn}
          />
        ) : null}

        {order.status === 'DISPATCHED' || order.status === 'DELIVERED' ? (
          <Button
            title={t.buyer.confirmReceipt}
            onPress={() => setShowDeliveryModal(true)}
            icon={<Ionicons name="checkmark-done-circle-outline" size={20} color="#FFF" />}
            style={styles.actionBtn}
          />
        ) : null}

        {order.status === 'ACCEPTED' || order.status === 'SETTLED' ? (
          <View style={styles.completedNotice}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.completedText}>Trade Completed & Settled</Text>
          </View>
        ) : null}
      </Card>

      {/* Delivery Receipt Modal / Form */}
      {showDeliveryModal ? (
        <Card style={styles.receiptCard}>
          <Text style={styles.receiptTitle}>Record Delivery Receipt (FR-DEL-03)</Text>
          <Text style={styles.receiptSubtitle}>
            Inspect the delivered produce and record the received quantity. If there is a discrepancy, you can accept with adjustment or open a dispute.
          </Text>

          <Text style={styles.inputLabel}>Received Quantity (kg):</Text>
          <TextInput
            style={styles.receiptInput}
            value={receivedKg}
            onChangeText={setReceivedKg}
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Receipt / Inspection Notes:</Text>
          <TextInput
            style={styles.receiptInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Moisture verified, 2 bags had torn packaging"
          />

          <View style={styles.receiptButtons}>
            <Button
              title="Accept Full"
              onPress={() => handleConfirmDelivery('ACCEPT_FULL')}
              loading={loading}
              style={{ marginBottom: 8 }}
            />
            <Button
              title="Open Quality Dispute"
              onPress={() => handleConfirmDelivery('DISPUTED')}
              variant="danger"
              style={{ marginBottom: 8 }}
            />
            <Button
              title={t.common.cancel}
              onPress={() => setShowDeliveryModal(false)}
              variant="secondary"
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
    backgroundColor: '#F5F4F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  backButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  cropGrade: {
    fontSize: 13,
    color: colors.neutralGray,
    marginTop: 2,
  },
  breakdownBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: radii.sm,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: colors.neutralGray,
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutralDark,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  infoSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralDark,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.neutralDark,
    marginBottom: 3,
  },
  allocationsSection: {
    marginBottom: 20,
  },
  allocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  allocCode: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  allocQty: {
    fontSize: 12,
    color: colors.neutralDark,
  },
  actionBtn: {
    marginTop: 8,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: radii.md,
    gap: 8,
    marginTop: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  receiptCard: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutralDark,
    marginBottom: 4,
  },
  receiptSubtitle: {
    fontSize: 12,
    color: colors.neutralGray,
    marginBottom: 14,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutralDark,
    marginBottom: 4,
  },
  receiptInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  receiptButtons: {
    marginTop: 6,
  },
});
