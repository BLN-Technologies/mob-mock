import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { User } from '../../domain/models';
import { UserRole } from '../../domain/enums';

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
  const { t, language } = useTranslation();
  const { colors: tc } = useTheme();

  const isBuyer = user?.role === UserRole.BUYER;

  return (
    <View style={[styles.container, { backgroundColor: tc.surface, borderBottomColor: tc.borderLight }]}>
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: tc.surfaceSubtle }]}
            accessibilityLabel={t.common.back}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={tc.neutralDark} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.brandBadge, { backgroundColor: tc.surface, borderColor: tc.borderLight }]}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.titleContainer}>
          <View style={styles.titleHeaderRow}>
            <Text style={[styles.title, { color: tc.neutralHeadings }]} numberOfLines={1}>
              {title || t.common.appName}
            </Text>
            {isBuyer && !showBack && (
              <View style={[styles.verifiedPill, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Ionicons name="checkmark-circle" size={11} color="#15803D" />
                <Text style={styles.verifiedPillText}>
                  {language === 'rw' ? 'Isoko Ryemewe' : 'Verified'}
                </Text>
              </View>
            )}
          </View>

          {subtitle ? (
            <Text style={[styles.subtitle, { color: tc.neutralGray }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : user ? (
            <Text style={[styles.subtitle, { color: tc.neutralGray }]} numberOfLines={1}>
              {isBuyer
                ? (language === 'rw' ? 'Isoko ry\'Ibinyampeke n\'Imisaruro' : 'Rwanda Agricultural Exchange')
                : ((t.roles as any)[user.role] || user.role)}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightContainer}>
        {rightAction}

        {onNotificationPress && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: tc.surfaceSubtle }]}
            onPress={onNotificationPress}
            accessibilityLabel={t.notifications.title}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={19} color={tc.neutralDark} />
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
            style={[styles.profileAvatar, { borderColor: tc.primary, backgroundColor: tc.primary }]}
            onPress={onProfilePress}
            accessibilityLabel={t.profile.title}
            accessibilityRole="button"
          >
            <Text style={styles.avatarInitial}>
              {user.fullName.charAt(0).toUpperCase()}
            </Text>
            <View style={styles.onlineStatusDot} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 58,
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
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    color: colors.neutralHeadings,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  subtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
    marginTop: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
