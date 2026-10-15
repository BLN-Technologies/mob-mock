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
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { EmptyState } from '../../components/feedback/EmptyState';
import { gradingService } from '../../services/mock/mockServices';
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <Text style={styles.pageTitle}>{t.agent.tasks}</Text>
        <Text style={styles.pageSubtitle}>Assigned harvest lots ready for quality grading and verification.</Text>

        {tasks.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="All tasks completed"
            description="There are currently no submitted harvest lots awaiting field inspection."
          />
        ) : (
          tasks.map(({ lot, org }) => (
            <TouchableOpacity
              key={lot.id}
              activeOpacity={0.8}
              onPress={() => onSelectTask(lot, org)}
            >
              <Card>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cropTitle}>{lot.cropName}</Text>
                    <Text style={styles.lotCode}>{lot.lotCode}</Text>
                  </View>
                  <StatusBadge status={lot.status} />
                </View>

                <View style={styles.orgRow}>
                  <Ionicons name="business-outline" size={16} color={colors.neutralGray} />
                  <Text style={styles.orgName}>{org?.name || 'Local Farm Group'}</Text>
                </View>

                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color={colors.primary} />
                  <Text style={styles.locationText}>
                    {lot.pickupDistrict}, {lot.pickupSector} ({lot.pickupLocationDetails})
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.quantityText}>
                    📦 {lot.totalQuantityKg.toLocaleString()} kg
                  </Text>
                  <View style={styles.startBadge}>
                    <Text style={styles.startBadgeText}>Start Inspection →</Text>
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
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.neutralGray,
    marginTop: 4,
    marginBottom: 16,
  },
  cardHeader: {
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
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  orgName: {
    fontSize: 13,
    color: colors.neutralDark,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: colors.neutralGray,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutralDark,
  },
  startBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  startBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
