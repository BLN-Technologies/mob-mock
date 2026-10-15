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
import { colors, radii } from '../../theme/tokens';
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
      'Accept Offer & Reserve Stock',
      `Accepting this proposal for ${formatQuantity(offer.totalQuantityKg)} will atomically reserve the stock across all constituent lots and generate an official Cargo order (FR-REQ-06). Proceed?`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: 'Accept Offer',
          onPress: async () => {
            setActionLoading(true);
            try {
              await offerService.respondToOffer(offer.id, 'ACCEPT');
              await loadOffers();
              Alert.alert(
                'Offer Accepted',
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
      Alert.alert('Counter Proposal Sent', 'Cargo operations has been notified of your counter proposal.');
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <Text style={styles.title}>{t.buyer.offers}</Text>
        <Text style={styles.subtitle}>Consolidated proposals prepared by Cargo operations matching your requests.</Text>

        {offers.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No active offers"
            description="You do not have any pending offers from Cargo operations at this time."
          />
        ) : (
          offers.map(offer => (
            <Card key={offer.id}>
              <View style={styles.offerHeader}>
                <View>
                  <Text style={styles.offerCode}>{offer.offerCode}</Text>
                  <Text style={styles.subtext}>
                    {offer.supplierCount} supplier(s) pooled · Delivered to {offer.deliveryDistrict}
                  </Text>
                </View>
                <StatusBadge status={offer.status} />
              </View>

              <View style={styles.metricGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total Quantity</Text>
                  <Text style={styles.metricVal}>{formatQuantity(offer.totalQuantityKg)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Price / kg</Text>
                  <Text style={styles.metricVal}>{formatRwf(offer.averagePricePerKgRwf)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total Value</Text>
                  <Text style={[styles.metricVal, { color: colors.primary }]}>{formatRwf(offer.totalPriceRwf)}</Text>
                </View>
              </View>

              {/* Negotiation History */}
              <View style={styles.negotiationBox}>
                <Text style={styles.negotiationTitle}>Negotiation Timeline:</Text>
                {offer.negotiationTimeline.map(msg => (
                  <View key={msg.id} style={styles.timelineItem}>
                    <Text style={styles.timelineSender}>{msg.senderName} ({msg.action}):</Text>
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
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerCode: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  subtext: {
    fontSize: 12,
    color: colors.neutralGray,
    marginTop: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: radii.sm,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.neutralGray,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutralDark,
    marginTop: 2,
  },
  negotiationBox: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginBottom: 12,
  },
  negotiationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralDark,
    marginBottom: 6,
  },
  timelineItem: {
    marginBottom: 6,
  },
  timelineSender: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  timelineNotes: {
    fontSize: 12,
    color: colors.neutralDark,
    lineHeight: 16,
  },
  actionSection: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnHalf: {
    flex: 1,
  },
  counterBox: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: radii.md,
  },
  counterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutralDark,
    marginBottom: 6,
  },
  counterInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    height: 44,
    paddingHorizontal: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  counterBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
