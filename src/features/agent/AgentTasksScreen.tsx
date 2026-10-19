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
import { RWANDA_DISTRICTS } from '../../data/locations/rwandaLocations';

type TaskFilter = 'PENDING' | 'COMPLETED' | 'OVERDUE';

interface AgentTasksScreenProps {
  onSelectTask: (lot: Lot, org?: Organization) => void;
  agentDistrict?: string;
}

export const AgentTasksScreen: React.FC<AgentTasksScreenProps> = ({
  onSelectTask,
  agentDistrict,
}) => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<{
    lot: Lot;
    org?: Organization;
    isOverdue: boolean;
    deadlineHoursLeft: number;
  }[]>([]);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('PENDING');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(agentDistrict || 'ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);

  const loadTasks = async () => {
    const fetched = await gradingService.getAgentTasks({
      statusFilter: activeFilter,
      district: selectedDistrict,
      agentDistrict,
    });
    setTasks(fetched);
  };

  useEffect(() => {
    loadTasks();
  }, [activeFilter, selectedDistrict]);

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
            District-authorized agricultural lots ready for official quality inspection.
          </Text>
        </View>

        {/* District Selector Filter */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.districtSelector}
            onPress={() => setShowDistrictPicker(!showDistrictPicker)}
            accessibilityRole="button"
            accessibilityLabel="Select inspection district"
          >
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.districtSelectorText}>
              {selectedDistrict === 'ALL' ? 'All Districts' : selectedDistrict}
            </Text>
            <Ionicons
              name={showDistrictPicker ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.neutralGray}
            />
          </TouchableOpacity>
        </View>

        {/* Dropdown Options */}
        {showDistrictPicker && (
          <View style={styles.pickerDropdown}>
            <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  selectedDistrict === 'ALL' && styles.pickerOptionActive,
                ]}
                onPress={() => {
                  setSelectedDistrict('ALL');
                  setShowDistrictPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    selectedDistrict === 'ALL' && styles.pickerOptionTextActive,
                  ]}
                >
                  All Districts
                </Text>
              </TouchableOpacity>
              {RWANDA_DISTRICTS.map(dist => (
                <TouchableOpacity
                  key={dist}
                  style={[
                    styles.pickerOption,
                    selectedDistrict === dist && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedDistrict(dist);
                    setShowDistrictPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedDistrict === dist && styles.pickerOptionTextActive,
                    ]}
                  >
                    {dist}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Task Status Filter Chips */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'PENDING' && styles.filterChipActive]}
            onPress={() => setActiveFilter('PENDING')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'PENDING' && styles.filterChipTextActive,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'OVERDUE' && styles.filterChipActiveOverdue]}
            onPress={() => setActiveFilter('OVERDUE')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'OVERDUE' && styles.filterChipTextActiveOverdue,
              ]}
            >
              Overdue (&gt;24h)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'COMPLETED' && styles.filterChipActive]}
            onPress={() => setActiveFilter('COMPLETED')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'COMPLETED' && styles.filterChipTextActive,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Task Cards List */}
        {tasks.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title={activeFilter === 'OVERDUE' ? 'No overdue inspections' : 'No tasks found'}
            description={
              activeFilter === 'OVERDUE'
                ? 'All harvest lots in this assignment have been inspected within the 24-hour target.'
                : 'There are currently no tasks matching the selected filters.'
            }
          />
        ) : (
          tasks.map(({ lot, org, isOverdue, deadlineHoursLeft }) => (
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

              {/* Cooperative Details */}
              <View style={styles.orgRow}>
                <Ionicons name="business-outline" size={14} color={colors.neutralGray} />
                <Text style={styles.orgName}>{org?.name || 'Local Farm Cooperative'}</Text>
              </View>

              {/* Location */}
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.primary} />
                <Text style={styles.locationText} numberOfLines={2}>
                  {lot.pickupDistrict}, {lot.pickupSector} ({lot.pickupLocationDetails || 'Pickup depot'})
                </Text>
              </View>

              {/* Overdue / Due status badge */}
              <View style={styles.timingRow}>
                {isOverdue ? (
                  <View style={styles.overdueBadge}>
                    <Ionicons name="alert-circle" size={13} color={colors.error} />
                    <Text style={styles.overdueText}>Inspection Overdue (&gt;24h)</Text>
                  </View>
                ) : (
                  <View style={styles.dueBadge}>
                    <Ionicons name="time-outline" size={13} color={colors.warning} />
                    <Text style={styles.dueText}>Due in ~{deadlineHoursLeft}h</Text>
                  </View>
                )}
                <Text style={styles.submittedDate}>
                  Submitted: {new Date(lot.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.quantityText}>
                  Volume: {formatQuantity(lot.totalQuantityKg)}
                </Text>
                <View style={styles.startBadge}>
                  <Text style={styles.startBadgeText}>Inspect lot →</Text>
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
    fontSize: 20,
    color: colors.neutralHeadings,
  },
  pageSubtitle: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 2,
  },
  filterBar: {
    marginBottom: spacing.sm,
  },
  districtSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
  },
  districtSelectorText: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    color: colors.neutralHeadings,
    marginLeft: spacing.xs + 2,
    fontWeight: '600',
  },
  pickerDropdown: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    maxHeight: 180,
    overflow: 'hidden',
  },
  pickerScroll: {
    paddingVertical: spacing.xs,
  },
  pickerOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pickerOptionActive: {
    backgroundColor: colors.surfaceMint,
  },
  pickerOptionText: {
    ...typography.body,
    fontSize: 13,
    color: colors.neutralHeadings,
  },
  pickerOptionTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipActiveOverdue: {
    backgroundColor: '#FEF3F2',
    borderColor: colors.error,
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.neutralGray,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  filterChipTextActiveOverdue: {
    color: colors.error,
  },
  taskCard: {
    marginBottom: spacing.sm + 4,
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
    gap: spacing.xs,
    marginBottom: 4,
  },
  orgName: {
    ...typography.caption,
    color: colors.neutralHeadings,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs + 2,
  },
  locationText: {
    ...typography.caption,
    color: colors.neutralGray,
    flex: 1,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3F2',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.sm,
    gap: 4,
  },
  overdueText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.sm,
    gap: 4,
  },
  dueText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.warning,
    fontWeight: '600',
  },
  submittedDate: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralLight,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  quantityText: {
    ...typography.body,
    fontSize: 13,
    color: colors.neutralHeadings,
    fontWeight: '600',
  },
  startBadge: {
    backgroundColor: colors.surfaceMint,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  startBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
});
