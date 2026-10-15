import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { offerService } from '../../services/mock/mockServices';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';
import { Offer, User } from '../../domain/models';

interface BuyerOffersScreenProps {
  user: User;
  onOfferAccepted: () => void;
}

export const BuyerOffersScreen: React.FC<BuyerOffersScreenProps> = ({
  user,
  onOfferAccepted,
}) => {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [showCounterInput, setShowCounterInput] = useState<string | null>(null);

  const loadOffers = async () => {
    const fetched = await offerService.getOffersForBuyer(user.organizationId);
    setOffers(fetched);
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOffers();
    setRefreshing(false);
  };

  const handleAccept = async (offer: Offer) => {
    Alert.alert(
      t.buyer.acceptOffer,
      `Accepting this proposal for ${formatQuantity(offer.totalQuantityKg)} will atomically reserve the stock across all constituent lots and generate an official Cargo order (FR-REQ-06). Proceed?`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm,
          onPress: async () => {
            setActionLoading(true);
            try {
              await offerService.respondToOffer(offer.id, 'ACCEPT');
              await loadOffers();
              Alert.alert(
                t.common.appName,
                'Stock successfully reserved and Order created. Please proceed to Orders to review terms and initiate payment.',
                [{ text: 'View Orders', onPress: onOfferAccepted }]
              );
            } catch (err: any) {
              Alert.alert('Reservation Error', err.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCounter = async (offerId: string) => {
    const price = parseInt(counterPrice, 10);
    if (!price || isNaN(price)) {
      Alert.alert('Validation Error', 'Please enter a valid counter price per kg in RWF');
      return;
    }

    setActionLoading(true);
    try {
      await offerService.respondToOffer(
        offerId,
        'COUNTER',
        `Buyer proposed counter price of ${price} RWF/kg`,
        price
      );
      setShowCounterInput(null);
      setCounterPrice('');
      await loadOffers();
      Alert.alert(t.common.appName, 'Cargo operations has been notified of your counter proposal.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
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
          <Text style={styles.title}>{t.buyer.offers}</Text>
          <Text style={styles.subtitle}>
            Consolidated commercial proposals prepared by Cargo operations.
          </Text>
        </View>

        {offers.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No active offers"
            description="You do not have any pending offers from Cargo operations at this time."
          />
        ) : (
          offers.map(offer => (
            <Card key={offer.id} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <View style={styles.offerMeta}>
                  <Text style={styles.offerCode}>{offer.offerCode}</Text>
                  <Text style={styles.subtext}>
                    {offer.supplierCount} supplier(s) pooled · Delivered to {offer.deliveryDistrict}
                  </Text>
                </View>
                <StatusBadge status={offer.status} size="small" />
              </View>

              <View style={styles.metricGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{t.supplier.quantityKg}</Text>
                  <Text style={styles.metricVal}>{formatQuantity(offer.totalQuantityKg)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{t.supplier.pricePerKg}</Text>
                  <Text style={styles.metricVal}>{formatRwf(offer.averagePricePerKgRwf)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total Trade Value</Text>
                  <Text style={[styles.metricVal, { color: colors.primary }]}>
                    {formatRwf(offer.totalPriceRwf)}
                  </Text>
                </View>
              </View>

              {/* Negotiation History */}
              <View style={styles.negotiationBox}>
                <Text style={styles.negotiationTitle}>Negotiation Timeline:</Text>
                {offer.negotiationTimeline.map(msg => (
                  <View key={msg.id} style={styles.timelineItem}>
                    <Text style={styles.timelineSender}>
                      {msg.senderName} ({msg.action}):
                    </Text>
                    <Text style={styles.timelineNotes}>{msg.notes}</Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons if Proposed */}
              {offer.status === 'PROPOSED' && (
                <View style={styles.actionSection}>
                  {showCounterInput === offer.id ? (
                    <View style={styles.counterBox}>
                      <Text style={styles.counterLabel}>Enter Counter Price (RWF / kg):</Text>
                      <TextInput
                        style={styles.counterInput}
                        value={counterPrice}
                        onChangeText={setCounterPrice}
                        keyboardType="numeric"
                        placeholder="e.g. 400"
                        placeholderTextColor="#94A3B8"
                      />
                      <View style={styles.counterBtnRow}>
                        <Button
                          title={t.common.cancel}
                          onPress={() => setShowCounterInput(null)}
                          variant="secondary"
                          style={{ flex: 1 }}
                        />
                        <Button
                          title="Send Counter"
                          onPress={() => handleCounter(offer.id)}
                          loading={actionLoading}
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.buttonRow}>
                      <Button
                        title={t.buyer.counterOffer}
                        onPress={() => setShowCounterInput(offer.id)}
                        variant="secondary"
                        style={styles.btnHalf}
                      />
                      <Button
                        title={t.buyer.acceptOffer}
                        onPress={() => handleAccept(offer)}
                        loading={actionLoading}
                        style={styles.btnHalf}
                      />
                    </View>
                  )}
                </View>
              )}
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
  offerCard: {
    marginBottom: spacing.sm + 2,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  offerMeta: {
    flex: 1,
    marginRight: spacing.sm,
  },
  offerCode: {
    ...typography.h3,
    fontSize: 15,
    color: colors.neutralHeadings,
  },
  subtext: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
  },
  metricVal: {
    ...typography.bodyMedium,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginTop: 1,
  },
  negotiationBox: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  negotiationTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  timelineItem: {
    marginBottom: 4,
  },
  timelineSender: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  timelineNotes: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralDark,
    lineHeight: 15,
  },
  actionSection: {
    marginTop: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnHalf: {
    flex: 1,
  },
  counterBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutralHeadings,
    marginBottom: spacing.xs,
  },
  counterInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    height: 44,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    marginBottom: spacing.sm,
    color: colors.neutralDark,
  },
  counterBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
