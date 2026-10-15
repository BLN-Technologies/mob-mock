import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/feedback/EmptyState';
import { lotService } from '../../services/mock/mockServices';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';
import { BuyerLotProjection } from '../../domain/models';

interface BuyerCatalogueScreenProps {
  onNavigateToCreateRequest: () => void;
  onSelectLot: (lot: BuyerLotProjection) => void;
}

export const BuyerCatalogueScreen: React.FC<BuyerCatalogueScreenProps> = ({
  onNavigateToCreateRequest,
  onSelectLot,
}) => {
  const { t } = useTranslation();
  const [lots, setLots] = useState<BuyerLotProjection[]>([]);
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const loadCatalogue = async () => {
    const fetched = await lotService.getBuyerCatalogue(selectedCrop, selectedGrade);
    setLots(fetched);
  };

  useEffect(() => {
    loadCatalogue();
  }, [selectedCrop, selectedGrade]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCatalogue();
    setRefreshing(false);
  };

  const cropChips = ['All', 'Maize', 'Dry Beans', 'Irish Potatoes'];
  const gradeChips = ['All', 'GRADE_A', 'GRADE_B'];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Header Action */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t.buyer.catalogue}</Text>
            <Text style={styles.subtitle}>Inspected, field-graded, and Cargo-verified inventory only.</Text>
          </View>
          <Button
            title="Post Request"
            onPress={onNavigateToCreateRequest}
            icon={<Ionicons name="add" size={18} color="#FFF" />}
            style={styles.requestBtn}
          />
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {cropChips.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, selectedCrop === c && styles.chipActive]}
              onPress={() => setSelectedCrop(c)}
            >
              <Text style={[styles.chipText, selectedCrop === c && styles.chipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipScroll, { marginTop: 6 }]}>
          {gradeChips.map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, selectedGrade === g && styles.chipActive]}
              onPress={() => setSelectedGrade(g)}
            >
              <Text style={[styles.chipText, selectedGrade === g && styles.chipTextActive]}>
                {g === 'All' ? 'All Grades' : g === 'GRADE_A' ? 'Grade A (Premium)' : 'Grade B'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Catalogue Items */}
        {lots.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No matching verified produce"
            description="No current stock matches your selected filters. You can post a custom institutional sourcing request."
            actionTitle="Post Sourcing Request"
            onActionPress={onNavigateToCreateRequest}
          />
        ) : (
          lots.map(lot => (
            <TouchableOpacity
              key={lot.id}
              activeOpacity={0.8}
              onPress={() => onSelectLot(lot)}
            >
              <Card style={styles.lotCard}>
                <Image
                  source={{ uri: lot.photos[0] || 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600' }}
                  style={styles.lotImage}
                />
                <View style={styles.lotCardBody}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.cropTitle}>{lot.cropName}</Text>
                      <Text style={styles.lotCode}>{lot.lotCode} · {lot.variety || 'Standard'}</Text>
                    </View>
                    <StatusBadge status={lot.grade} />
                  </View>

                  <View style={styles.metricsRow}>
                    <Text style={styles.quantityText}>
                      📦 Available: {formatQuantity(lot.availableQuantityKg)}
                    </Text>
                    <Text style={styles.districtText}>
                      📍 {lot.district}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.priceText}>{formatRwf(lot.pricePerKgRwf)} / kg</Text>
                    <View style={styles.detailsBadge}>
                      <Text style={styles.detailsBadgeText}>View Details →</Text>
                    </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutralGray,
    marginTop: 2,
    maxWidth: 220,
  },
  requestBtn: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  chipScroll: {
    marginBottom: 8,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.neutralDark,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  lotCard: {
    padding: 0,
    overflow: 'hidden',
  },
  lotImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#E2E8F0',
  },
  lotCardBody: {
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cropTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  lotCode: {
    fontSize: 12,
    color: colors.neutralGray,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quantityText: {
    fontSize: 13,
    color: colors.neutralDark,
    fontWeight: '500',
  },
  districtText: {
    fontSize: 13,
    color: colors.neutralGray,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  detailsBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  detailsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
