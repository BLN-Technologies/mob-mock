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
import { colors, radii, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CropBadge } from '../../components/ui/CropBadge';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { EmptyState } from '../../components/feedback/EmptyState';
import { gradingService } from '../../services/mock/mockServices';
import { formatQuantity } from '../../domain/calculations/lotCalculations';
import { Lot, Organization } from '../../domain/models';

interface AgentTasksScreenProps {
  onSelectTask: (lot: Lot, org?: Organization) => void;
}

export const AgentTasksScreen: React.FC<AgentTasksScreenProps> = ({ onSelectTask }) => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<{ lot: Lot; org?: Organization }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = async () => {
    const fetched = await gradingService.getAgentTasks();
    setTasks(fetched);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>{t.agent.tasks}</Text>
          <Text style={styles.pageSubtitle}>
            Assigned harvest lots ready for quality grading and verification.
          </Text>
        </View>

        {tasks.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="All tasks completed"
            description="There are currently no submitted harvest lots awaiting field inspection."
          />
        ) : (
          tasks.map(({ lot, org }) => (
            <Card
              key={lot.id}
              onPress={() => onSelectTask(lot, org)}
              style={styles.taskCard}
            >
              <View style={styles.cardHeader}>
                <CropBadge cropName={lot.cropName} size="small" />
                <View style={styles.cardHeaderMeta}>
                  <Text style={styles.cropTitle}>{lot.cropName}</Text>
                  <Text style={styles.lotCode}>
                    {lot.lotCode} · {lot.variety || 'Standard Bulk'}
                  </Text>
                </View>
                <StatusBadge status={lot.status} size="small" />
              </View>

              <View style={styles.orgRow}>
                <Ionicons name="business-outline" size={14} color={colors.neutralGray} />
                <Text style={styles.orgName}>{org?.name || 'Local Farm Group'}</Text>
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.primary} />
                <Text style={styles.locationText} numberOfLines={2}>
                  {lot.pickupDistrict}, {lot.pickupSector} ({lot.pickupLocationDetails})
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.quantityText}>
                  Volume: {formatQuantity(lot.totalQuantityKg)}
                </Text>
                <View style={styles.startBadge}>
                  <Text style={styles.startBadgeText}>{t.agent.inspectionTask} →</Text>
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
  pageTitle: {
    ...typography.h2,
    fontSize: 18,
    color: colors.neutralHeadings,
  },
  pageSubtitle: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 2,
  },
  taskCard: {
    marginBottom: spacing.sm + 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardHeaderMeta: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  cropTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.neutralHeadings,
  },
  lotCode: {
    ...typography.caption,
    color: colors.neutralGray,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  orgName: {
    ...typography.caption,
    fontSize: 12,
    color: colors.neutralDark,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: 6,
  },
  locationText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  quantityText: {
    ...typography.bodyMedium,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  startBadge: {
    backgroundColor: colors.surfaceHighlighted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  startBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
