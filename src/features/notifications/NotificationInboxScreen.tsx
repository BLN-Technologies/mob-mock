import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';
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
          <Text style={styles.title}>{t.notifications.title}</Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markReadText}>{t.notifications.markAllRead}</Text>
            </TouchableOpacity>
          )}
        </View>

        {notifications.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title={t.notifications.empty}
            description="You are completely caught up."
          />
        ) : (
          notifications.map(item => (
            <Card key={item.id} style={item.isRead ? undefined : styles.unreadCard}>
              <View style={styles.notifRow}>
                <View style={[styles.iconCircle, !item.isRead && styles.unreadIcon]}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
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
                  <Text style={styles.timeText}>
                    {new Date(item.createdAt).toLocaleDateString()} · {new Date(item.createdAt).toLocaleTimeString()}
                  </Text>
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
  markReadText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unreadIcon: {
    backgroundColor: colors.successLight,
  },
  notifBody: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutralDark,
    marginBottom: 2,
  },
  notifMessage: {
    fontSize: 13,
    color: colors.neutralDark,
    lineHeight: 18,
  },
  timeText: {
    fontSize: 11,
    color: colors.neutralGray,
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
    marginTop: 4,
  },
});
