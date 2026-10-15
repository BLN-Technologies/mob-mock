import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();

  const getStyleAndLabel = () => {
    switch (status) {
      // Lot & Order Verified / Success states
      case 'VERIFIED':
      case 'CONFIRMED':
      case 'PAID':
      case 'ACCEPTED':
      case 'SETTLED':
      case 'GRADE_A':
        return {
          bg: colors.successLight,
          textColor: colors.success,
          label: (t.statuses as any)[status] || status,
        };

      // In Progress / Warning / Attention states
      case 'SUBMITTED':
      case 'PAYMENT_PENDING':
      case 'DISPATCHED':
      case 'DELIVERED':
      case 'PROPOSED':
      case 'GRADE_B':
        return {
          bg: colors.warningLight,
          textColor: '#B45309', // Dark amber for readability
          label: (t.statuses as any)[status] || status,
        };

      // Disputed / Rejected / Danger states
      case 'REJECTED':
      case 'DECLINED':
      case 'CANCELLED':
      case 'DISPUTED':
      case 'REJECT':
        return {
          bg: colors.dangerLight,
          textColor: colors.danger,
          label: (t.statuses as any)[status] || status,
        };

      // Draft / Offline / Neutral states
      case 'DRAFT':
      case 'WITHDRAWN':
      case 'EXPIRED':
      case 'GRADE_C':
      default:
        return {
          bg: colors.draftLight,
          textColor: colors.draft,
          label: (t.statuses as any)[status] || status,
        };
    }
  };

  const { bg, textColor, label } = getStyleAndLabel();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: textColor }]} />
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
