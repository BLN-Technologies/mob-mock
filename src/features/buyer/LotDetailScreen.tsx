import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';
import { BuyerLotProjection, User } from '../../domain/models';

interface LotDetailScreenProps {
  lot: BuyerLotProjection;
  user: User;
  onBack: () => void;
  onRequestMatch: () => void;
}

export const LotDetailScreen: React.FC<LotDetailScreenProps> = ({
  lot,
  user,
  onBack,
  onRequestMatch,
}) => {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backBtnText}>Back to Catalogue</Text>
      </TouchableOpacity>

      <Image
        source={{ uri: lot.photos[0] || 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600' }}
        style={styles.heroImage}
      />

      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.cropTitle}>{lot.cropName}</Text>
            <Text style={styles.lotCode}>{lot.lotCode} · {lot.variety || 'Standard'}</Text>
          </View>
          <StatusBadge status={lot.grade} />
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Available Stock</Text>
            <Text style={styles.metricVal}>{formatQuantity(lot.availableQuantityKg)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Price / kg</Text>
            <Text style={styles.metricVal}>{formatRwf(lot.pricePerKgRwf)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Location</Text>
            <Text style={styles.metricVal}>{lot.district}</Text>
          </View>
        </View>

        {/* Verification Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Verification & Quality Trail (FR-QA-05):</Text>
          <View style={styles.timelineRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={styles.timelineText}>Harvest confirmed & verified</Text>
          </View>
          <View style={styles.timelineRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={styles.timelineText}>Field inspection completed ({lot.grade})</Text>
          </View>
          <View style={styles.timelineRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={styles.timelineText}>Cargo administrator approved on {new Date(lot.verifiedAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <Text style={styles.privacyNoteText}>
            Trade coordinated and quality guaranteed by Cargo. Supplier contact details are managed through Cargo operations (BR-05).
          </Text>
        </View>

        <Button
          title="Include in Sourcing Request"
          onPress={onRequestMatch}
          icon={<Ionicons name="cart-outline" size={18} color="#FFF" />}
          style={styles.actionBtn}
        />
      </Card>
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  backBtnText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: radii.md,
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
  },
  card: {
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cropTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  lotCode: {
    fontSize: 13,
    color: colors.neutralGray,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: radii.sm,
    marginBottom: 16,
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
  timelineSection: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralDark,
    marginBottom: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  timelineText: {
    fontSize: 13,
    color: colors.neutralDark,
  },
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 20,
    gap: 8,
  },
  privacyNoteText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
    lineHeight: 16,
  },
  actionBtn: {
    marginTop: 4,
  },
});
