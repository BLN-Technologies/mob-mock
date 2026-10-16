import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { mockState, offlineQueueService } from '../../services/mock/mockServices';
import { SyncStatus } from '../../domain/enums';
import { localStorage } from '../../data/local/storage';
import { OfflineQueueItem } from '../../domain/models';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(mockState.isOffline());
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const checkQueue = async () => {
    try {
      const queue: OfflineQueueItem[] = await localStorage.getOfflineQueue();
      const pending = queue.filter((q: OfflineQueueItem) => q.status !== SyncStatus.SYNCED);
      setQueuedCount(prev => (prev === pending.length ? prev : pending.length));
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    checkQueue();
    const interval = setInterval(checkQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleOffline = () => {
    const next = !isOffline;
    mockState.setOffline(next);
    setIsOffline(next);
    if (!next) {
      handleSync();
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    await offlineQueueService.syncPendingQueue();
    await checkQueue();
    setSyncing(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.banner, isOffline ? styles.offlineBg : styles.onlineBg]}
        onPress={toggleOffline}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={isOffline ? t.agent.offlineMode : t.agent.onlineMode}
      >
        <Ionicons
          name={isOffline ? 'cloud-offline-outline' : 'cloud-done-outline'}
          size={16}
          color={isOffline ? '#B45309' : colors.primary}
        />
        <Text style={[styles.text, isOffline ? styles.offlineText : styles.onlineText]}>
          {isOffline
            ? `${t.agent.offlineMode} (${queuedCount} ${t.agent.pendingCount.toLowerCase()})`
            : `${t.agent.onlineMode}${queuedCount > 0 ? ` (${queuedCount} ${t.agent.waitingToSync.toLowerCase()})` : ''}`}
        </Text>
        <Text style={styles.toggleHint}>Tap to switch</Text>
      </TouchableOpacity>

      {queuedCount > 0 && !isOffline && (
        <TouchableOpacity
          style={styles.syncBtn}
          onPress={handleSync}
          disabled={syncing}
        >
          <Text style={styles.syncBtnText}>{syncing ? t.common.syncing : t.agent.syncQueueNow}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#F5F4F6',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    justifyContent: 'space-between',
  },
  offlineBg: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  onlineBg: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginLeft: 6,
  },
  offlineText: {
    color: '#92400E',
  },
  onlineText: {
    color: '#166534',
  },
  toggleHint: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
  syncBtn: {
    marginTop: 4,
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.xs,
    alignSelf: 'flex-end',
  },
  syncBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
