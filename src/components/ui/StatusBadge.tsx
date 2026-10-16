import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const { t } = useTranslation();

  const getStyleAndMeta = () => {
    switch (status) {
      // Verified / Success
      case 'VERIFIED':
      case 'CONFIRMED':
      case 'PAID':
      case 'ACCEPTED':
      case 'SETTLED':
      case 'GRADE_A':
      case 'SYNCED':
        return {
          bg: colors.successLight,
          textColor: colors.successDark,
          borderColor: colors.successBorder,
          icon: 'checkmark-circle' as const,
          label: (t.statuses as any)[status] || status,
        };

      // In Progress / Warning
      case 'SUBMITTED':
      case 'PAYMENT_PENDING':
      case 'DISPATCHED':
      case 'DELIVERED':
      case 'PROPOSED':
      case 'GRADE_B':
      case 'QUEUED':
        return {
          bg: colors.warningLight,
          textColor: colors.warningDark,
          borderColor: colors.warningBorder,
          icon: status === 'QUEUED' ? ('cloud-upload-outline' as const) : ('time' as const),
          label: (t.statuses as any)[status] || status,
        };

      case 'RETRY_SCHEDULED':
        return {
          bg: '#FEF3C7',
          textColor: '#D97706',
          borderColor: '#FDE68A',
          icon: 'refresh' as const,
          label: (t.statuses as any)[status] || status,
        };

      // Disputed / Danger
      case 'REJECTED':
      case 'DECLINED':
      case 'CANCELLED':
      case 'DISPUTED':
      case 'REJECT':
      case 'FAILED':
      case 'FAILED_PERMANENT':
        return {
          bg: colors.dangerLight,
          textColor: colors.dangerDark,
          borderColor: colors.dangerBorder,
          icon: status === 'FAILED_PERMANENT' ? ('close-circle' as const) : ('alert-circle' as const),
          label: (t.statuses as any)[status] || status,
        };

      case 'CONFLICT':
        return {
          bg: '#FEE2E2',
          textColor: '#B91C1C',
          borderColor: '#FCA5A5',
          icon: 'git-compare-outline' as const,
          label: (t.statuses as any)[status] || status,
        };

      // Syncing / Reserved / Info
      case 'SYNCING':
      case 'RESERVED':
      case 'SOLD':
        return {
          bg: colors.infoLight,
          textColor: colors.infoDark,
          borderColor: colors.infoBorder,
          icon: status === 'SYNCING' ? ('sync' as const) : ('lock-closed' as const),
          label: (t.statuses as any)[status] || status,
        };

      // Draft / Offline / Neutral
      case 'DRAFT':
      case 'WITHDRAWN':
      case 'EXPIRED':
      case 'GRADE_C':
      default:
        return {
          bg: colors.draftLight,
          textColor: colors.draft,
          borderColor: colors.draftBorder,
          icon: 'document-text-outline' as const,
          label: (t.statuses as any)[status] || status,
        };
    }
  };

  const meta = getStyleAndMeta();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: meta.bg,
          borderColor: meta.borderColor,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 10,
        },
      ]}
    >
      <Ionicons
        name={meta.icon}
        size={isSmall ? 11 : 13}
        color={meta.textColor}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          {
            color: meta.textColor,
            fontSize: isSmall ? 10 : 11,
          },
        ]}
        numberOfLines={1}
      >
        {meta.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...typography.caption,
    fontWeight: '700',
  },
});
