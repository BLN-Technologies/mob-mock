import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/feedback/EmptyState';
import { SEED_NOTIFICATIONS } from '../../services/mock/seedData';
import { AppNotification, User } from '../../domain/models';

interface NotificationInboxScreenProps {
  user: User;
}

export const NotificationInboxScreen: React.FC<NotificationInboxScreenProps> = ({ user }) => {
  const { t, language } = useTranslation();
  const [notifications, setNotifications] = useState<AppNotification[]>(
    SEED_NOTIFICATIONS.filter(n => n.userId === user.id || n.userId === 'usr-supplier-01')
  );

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t.notifications.title}</Text>
            <Text style={styles.subtitle}>Platform events & transaction alerts</Text>
          </View>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
              <Text style={styles.markReadText}>{t.notifications.markAllRead}</Text>
            </TouchableOpacity>
          )}
        </View>

        {notifications.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title={t.notifications.empty}
            description="You are completely caught up with all trade alerts and lot updates."
          />
        ) : (
          notifications.map(item => (
            <Card
              key={item.id}
              style={[styles.notifCard, !item.isRead && styles.unreadCard]}
            >
              <View style={styles.notifRow}>
                <View style={[styles.iconCircle, !item.isRead && styles.unreadIcon]}>
                  <Ionicons
                    name={item.isRead ? 'notifications-outline' : 'notifications'}
                    size={18}
                    color={item.isRead ? colors.neutralGray : colors.primary}
                  />
                </View>
                <View style={styles.notifBody}>
                  <Text style={styles.notifTitle}>
                    {language === 'rw' ? item.titleRw : item.titleEn}
                  </Text>
                  <Text style={styles.notifMessage}>
                    {language === 'rw' ? item.messageRw : item.messageEn}
                  </Text>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={12} color={colors.neutralLight} />
                    <Text style={styles.timeText}>
                      {new Date(item.createdAt).toLocaleDateString()} ·{' '}
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    fontSize: 18,
    color: colors.neutralHeadings,
  },
  subtitle: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 1,
  },
  markReadBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markReadText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  notifCard: {
    marginBottom: spacing.sm,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.surfaceHighlighted,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  unreadIcon: {
    backgroundColor: colors.successLight,
  },
  notifBody: {
    flex: 1,
  },
  notifTitle: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginBottom: 2,
  },
  notifMessage: {
    ...typography.body,
    fontSize: 13,
    color: colors.neutralDark,
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  timeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.xs,
    marginTop: 4,
  },
});
