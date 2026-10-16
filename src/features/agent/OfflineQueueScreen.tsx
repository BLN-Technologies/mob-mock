import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { localStorage } from '../../data/local/storage';
import { mockState } from '../../services/mock/mockServices';
import { syncCoordinator, QueueSummary } from '../../services/sync/syncCoordinator';
import { OfflineQueueItem } from '../../domain/models';
import { SyncStatus, SyncErrorCategory } from '../../domain/enums';

type FilterType = 'ALL' | 'PENDING' | 'SYNCED' | 'ATTENTION';

export const OfflineQueueScreen: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<OfflineQueueItem[]>([]);
  const [summary, setSummary] = useState<QueueSummary>({
    total: 0,
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
    conflicts: 0,
    lastSyncAt: null,
  });
  const [isOffline, setIsOffline] = useState(mockState.isOffline());
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      const queue = await localStorage.getOfflineQueue();
      setItems(queue);
      const summ = await syncCoordinator.getQueueSummary();
      setSummary(summ);
      setIsOffline(mockState.isOffline());
    } catch (err: any) {
      Alert.alert(t.agent.storageFailure, err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleSimulatedConnectivity = () => {
    const nextState = !isOffline;
    mockState.setOffline(nextState);
    setIsOffline(nextState);
  };

  const handleSyncAll = async () => {
    if (syncCoordinator.isSyncing()) {
      Alert.alert('In Progress', 'Synchronization is already actively processing.');
      return;
    }

    setSyncing(true);
    try {
      const res = await syncCoordinator.processQueue();
      await loadData();

      if (res.conflictCount > 0) {
        Alert.alert(
          'Synchronization Completed with Conflicts',
          `Synced ${res.syncedCount} item(s). ${res.conflictCount} item(s) resulted in a conflict and require administrative or supervisor review.`
        );
      } else if (res.failedCount > 0) {
        Alert.alert(
          'Synchronization Incomplete',
          `Synced ${res.syncedCount} item(s). ${res.failedCount} item(s) could not be synchronized.`
        );
      } else if (res.syncedCount > 0) {
        Alert.alert(
          'Synchronization Complete',
          `Successfully synchronized ${res.syncedCount} inspection record(s) with central Cargo operations.`
        );
      } else {
        Alert.alert('Queue Up to Date', 'No eligible inspection records were waiting to synchronize.');
      }
    } catch (err: any) {
      Alert.alert('Sync Error', err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleRetryItem = async (item: OfflineQueueItem) => {
    setSyncing(true);
    try {
      const res = await syncCoordinator.retryItem(item.id);
      await loadData();
      if (res.syncedCount > 0) {
        Alert.alert('Success', `Operation ${item.id} synchronized successfully.`);
      } else {
        Alert.alert('Retry Scheduled', `Operation could not complete: ${res.errors.join(', ')}`);
      }
    } catch (err: any) {
      Alert.alert('Retry Failed', err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDiscardItem = (item: OfflineQueueItem) => {
    if (item.status === SyncStatus.SYNCING) {
      Alert.alert('Action Blocked', t.agent.cannotDeletePending);
      return;
    }

    Alert.alert(
      t.agent.discardInspection,
      t.agent.discardConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm,
          style: 'destructive',
          onPress: async () => {
            try {
              await syncCoordinator.discardItem(item.id);
              await loadData();
            } catch (err: any) {
              Alert.alert(t.agent.storageFailure, err.message);
            }
          },
        },
      ]
    );
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (activeFilter === 'PENDING') {
      return item.status === SyncStatus.QUEUED || item.status === SyncStatus.RETRY_SCHEDULED || item.status === SyncStatus.SYNCING;
    }
    if (activeFilter === 'SYNCED') {
      return item.status === SyncStatus.SYNCED;
    }
    if (activeFilter === 'ATTENTION') {
      return item.status === SyncStatus.CONFLICT || item.status === SyncStatus.FAILED || item.status === SyncStatus.FAILED_PERMANENT;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Connectivity Bar with Mode Toggle */}
        <View style={styles.connectivityBar}>
          <View style={styles.connectivityLeft}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOffline ? '#DC2626' : '#16A34A' },
              ]}
            />
            <Text style={styles.connectivityText}>
              {isOffline ? t.agent.offlineMode : t.agent.onlineMode}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={toggleSimulatedConnectivity}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isOffline ? 'cloud-offline' : 'cloud-done'}
              size={14}
              color={colors.primary}
            />
            <Text style={styles.toggleBtnText}>
              {isOffline ? 'Go Online' : 'Go Offline'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Metric Counters */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNum}>{summary.pending}</Text>
            <Text style={styles.summaryLabel}>{t.agent.pendingCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNum, { color: colors.primary }]}>{summary.syncing}</Text>
            <Text style={styles.summaryLabel}>{t.agent.syncingCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNum, { color: colors.success }]}>{summary.synced}</Text>
            <Text style={styles.summaryLabel}>{t.agent.syncedCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text
              style={[
                styles.summaryNum,
                { color: summary.failed + summary.conflicts > 0 ? colors.danger : colors.neutralDark },
              ]}
            >
              {summary.failed + summary.conflicts}
            </Text>
            <Text style={styles.summaryLabel}>{t.agent.needsAttentionCount}</Text>
          </View>
        </View>

        {/* Header Row with Sync Action & Last Sync Info */}
        <View style={styles.actionHeader}>
          <View style={styles.syncMetaWrap}>
            <Text style={styles.syncMetaTitle}>{t.agent.offlineQueue}</Text>
            <Text style={styles.lastSyncText}>
              {summary.lastSyncAt
                ? `${t.agent.lastSync}: ${new Date(summary.lastSyncAt).toLocaleTimeString()}`
                : 'No synchronizations recorded yet'}
            </Text>
          </View>
          <Button
            title={t.agent.syncAll}
            onPress={handleSyncAll}
            loading={syncing}
            size="small"
            disabled={summary.pending === 0 && summary.failed === 0}
            icon={<Ionicons name="sync" size={14} color="#FFFFFF" />}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['ALL', 'PENDING', 'SYNCED', 'ATTENTION'] as FilterType[]).map(tab => {
            const isActive = activeFilter === tab;
            const label =
              tab === 'ALL'
                ? `${t.agent.filterAll} (${summary.total})`
                : tab === 'PENDING'
                ? `${t.agent.filterPending} (${summary.pending + summary.syncing})`
                : tab === 'SYNCED'
                ? `${t.agent.filterSynced} (${summary.synced})`
                : `${t.agent.filterAttention} (${summary.failed + summary.conflicts})`;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Queue Items List */}
        {filteredItems.length === 0 ? (
          <EmptyState
            icon="cloud-done-outline"
            title={t.agent.noPendingInspections}
            description={t.agent.allSyncedNotice}
          />
        ) : (
          filteredItems.map(item => {
            const isAttention =
              item.status === SyncStatus.CONFLICT ||
              item.status === SyncStatus.FAILED ||
              item.status === SyncStatus.FAILED_PERMANENT;

            const canRetry =
              item.status === SyncStatus.FAILED ||
              item.status === SyncStatus.RETRY_SCHEDULED ||
              item.status === SyncStatus.CONFLICT;

            const payloadLot = item.payload?.gradingRecord;

            return (
              <Card key={item.id} style={styles.queueCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.typeRow}>
                    <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                    <Text style={styles.itemType}>
                      {payloadLot ? `${payloadLot.calculatedGrade} Inspection` : item.type.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} size="small" />
                </View>

                <View style={styles.entityRow}>
                  <Text style={styles.entityCode}>
                    Lot: {item.entityId || item.payload?.lotId || 'N/A'}
                  </Text>
                  <Text style={styles.opId}>Op #{item.id.replace('op-', '')}</Text>
                </View>

                <View style={styles.itemDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={13} color={colors.neutralGray} />
                    <Text style={styles.timeText}>
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={styles.retryText}>
                    Attempts: {item.retryCount || 0} / {item.maxRetries || 5}
                  </Text>
                </View>

                {/* Scheduled Next Retry Time */}
                {item.nextRetryAt && item.status === SyncStatus.RETRY_SCHEDULED && (
                  <View style={styles.nextRetryBox}>
                    <Ionicons name="timer-outline" size={13} color="#D97706" />
                    <Text style={styles.nextRetryText}>
                      Next retry scheduled for {new Date(item.nextRetryAt).toLocaleTimeString()}
                    </Text>
                  </View>
                )}

                {/* Error Banner with Error Category */}
                {item.errorMessage ? (
                  <View
                    style={[
                      styles.errorBox,
                      item.status === SyncStatus.CONFLICT && styles.conflictBox,
                    ]}
                  >
                    <Ionicons
                      name={item.status === SyncStatus.CONFLICT ? 'git-compare-outline' : 'alert-circle'}
                      size={14}
                      color={item.status === SyncStatus.CONFLICT ? '#B91C1C' : colors.danger}
                    />
                    <View style={styles.errorContent}>
                      {item.errorCategory && (
                        <Text
                          style={[
                            styles.errorCategoryBadge,
                            item.status === SyncStatus.CONFLICT && styles.conflictCategoryBadge,
                          ]}
                        >
                          {item.errorCategory}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.errorText,
                          item.status === SyncStatus.CONFLICT && styles.conflictText,
                        ]}
                      >
                        {item.errorMessage}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* Action Buttons for Failed / Conflicted items */}
                {(canRetry || item.status !== SyncStatus.SYNCED) && (
                  <View style={styles.cardActions}>
                    {canRetry && (
                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        onPress={() => handleRetryItem(item)}
                      >
                        <Ionicons name="refresh" size={13} color={colors.primary} />
                        <Text style={styles.cardActionText}>{t.agent.manualRetry}</Text>
                      </TouchableOpacity>
                    )}
                    {item.status !== SyncStatus.SYNCING && (
                      <TouchableOpacity
                        style={[styles.cardActionBtn, styles.cardActionDiscard]}
                        onPress={() => handleDiscardItem(item)}
                      >
                        <Ionicons name="trash-outline" size={13} color={colors.danger} />
                        <Text style={[styles.cardActionText, { color: colors.danger }]}>
                          Discard
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Card>
            );
          })
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
  connectivityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  connectivityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectivityText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralHeadings,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlighted,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  toggleBtnText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryNum: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutralHeadings,
  },
  summaryLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
    textAlign: 'center',
    marginTop: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  syncMetaWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  syncMetaTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.neutralHeadings,
  },
  lastSyncText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
    marginTop: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutralDark,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  queueCard: {
    marginBottom: spacing.sm + 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemType: {
    ...typography.h3,
    fontSize: 14,
    color: colors.neutralHeadings,
  },
  entityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entityCode: {
    ...typography.bodyMedium,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  opId: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralDark,
  },
  retryText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  nextRetryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 6,
    borderRadius: radii.xs,
    marginTop: 6,
    gap: 4,
  },
  nextRetryText: {
    ...typography.caption,
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.dangerLight,
    padding: spacing.xs + 2,
    borderRadius: radii.xs,
    marginTop: spacing.xs,
    gap: 6,
  },
  conflictBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorContent: {
    flex: 1,
  },
  errorCategoryBadge: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.dangerDark,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  conflictCategoryBadge: {
    color: '#991B1B',
  },
  errorText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.danger,
    lineHeight: 15,
  },
  conflictText: {
    color: '#991B1B',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceHighlighted,
  },
  cardActionDiscard: {
    backgroundColor: '#FEE2E2',
  },
  cardActionText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
