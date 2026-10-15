import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { localStorage } from '../../data/local/storage';
import { offlineQueueService } from '../../services/mock/mockServices';
import { OfflineQueueItem } from '../../domain/models';

export const OfflineQueueScreen: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<OfflineQueueItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadQueue = async () => {
    const queue = await localStorage.getOfflineQueue();
    setItems(queue);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await offlineQueueService.syncPendingQueue();
      await loadQueue();
      Alert.alert(
        'Synchronization Complete',
        `Successfully synced ${result.syncedCount} queued action(s) to the Cargo service layer.`
      );
    } catch (e: any) {
      Alert.alert('Sync Error', e.message);
    } finally {
      setSyncing(false);
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
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>{t.agent.offlineQueue}</Text>
            <Text style={styles.subtitle}>
              Persistent device queue surviving app restart (FR-QA-03).
            </Text>
          </View>
          {items.length > 0 && (
            <Button
              title="Sync All"
              onPress={handleSync}
              loading={syncing}
              size="small"
              icon={<Ionicons name="sync" size={14} color="#FFFFFF" />}
            />
          )}
        </View>

        {items.length === 0 ? (
          <EmptyState
            icon="cloud-done-outline"
            title="Queue is empty"
            description="All field visits and quality grading records are synchronized with the central Cargo system."
          />
        ) : (
          items.map(item => (
            <Card key={item.id} style={styles.queueCard}>
              <View style={styles.itemHeader}>
                <View style={styles.typeRow}>
                  <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                  <Text style={styles.itemType}>{item.type.replace(/_/g, ' ')}</Text>
                </View>
                <StatusBadge status={item.status} size="small" />
              </View>

              <Text style={styles.opId}>Op ID: {item.id}</Text>

              <View style={styles.itemDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={13} color={colors.neutralGray} />
                  <Text style={styles.timeText}>
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.retryText}>Retries: {item.retryCount}</Text>
              </View>

              {item.errorMessage ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text style={styles.errorText}>{item.errorMessage}</Text>
                </View>
              ) : null}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
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
  opId: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
    marginBottom: spacing.xs,
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: spacing.xs + 2,
    borderRadius: radii.xs,
    marginTop: spacing.xs,
    gap: 4,
  },
  errorText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.danger,
    flex: 1,
  },
});
