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
import { colors, radii } from '../../theme/tokens';
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t.agent.offlineQueue}</Text>
            <Text style={styles.subtitle}>Persistent device queue surviving app restart (FR-QA-03).</Text>
          </View>
          {items.length > 0 && (
            <Button
              title="Sync All"
              onPress={handleSync}
              loading={syncing}
              style={styles.syncBtn}
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
            <Card key={item.id}>
              <View style={styles.itemHeader}>
                <View>
                  <Text style={styles.itemType}>{item.type}</Text>
                  <Text style={styles.opId}>Op ID: {item.id}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.itemDetails}>
                <Text style={styles.timeText}>
                  🕒 Recorded: {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
                <Text style={styles.retryText}>Retries: {item.retryCount}</Text>
              </View>

              {item.errorMessage ? (
                <Text style={styles.errorText}>⚠️ {item.errorMessage}</Text>
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
    marginBottom: 16,
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
    maxWidth: 240,
  },
  syncBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemType: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  opId: {
    fontSize: 11,
    color: colors.neutralGray,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeText: {
    fontSize: 12,
    color: colors.neutralDark,
  },
  retryText: {
    fontSize: 12,
    color: colors.neutralGray,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 6,
  },
});
