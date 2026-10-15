import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { User } from '../../domain/models';

interface TopAppBarProps {
  title?: string;
  subtitle?: string;
  user?: User;
  showBack?: boolean;
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  rightAction?: React.ReactNode;
  unreadCount?: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  subtitle,
  user,
  showBack = false,
  onBack,
  onNotificationPress,
  onProfilePress,
  rightAction,
  unreadCount = 0,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityLabel={t.common.back}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.neutralDark} />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandBadge}>
            <Ionicons name="leaf" size={18} color="#FFFFFF" />
          </View>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title || t.common.appName}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : user ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {(t.roles as any)[user.role] || user.role}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightContainer}>
        {rightAction}

        {onNotificationPress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationPress}
            accessibilityLabel={t.notifications.title}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.neutralDark} />
            {unreadCount > 0 && (
              <View style={styles.badgeIndicator}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {onProfilePress && user && (
          <TouchableOpacity
            style={styles.profileAvatar}
            onPress={onProfilePress}
            accessibilityLabel={t.profile.title}
            accessibilityRole="button"
          >
            <Text style={styles.avatarInitial}>
              {user.fullName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.subtle,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    fontSize: 16,
    lineHeight: 20,
    color: colors.neutralHeadings,
  },
  subtitle: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
