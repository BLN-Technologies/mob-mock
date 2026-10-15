import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat' | 'highlighted';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  padding = 'md',
  onPress,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'outlined':
        return styles.outlined;
      case 'flat':
        return styles.flat;
      case 'highlighted':
        return styles.highlighted;
      case 'elevated':
      default:
        return styles.elevated;
    }
  };

  const getPaddingStyle = () => {
    switch (padding) {
      case 'none':
        return styles.pNone;
      case 'sm':
        return styles.pSm;
      case 'lg':
        return styles.pLg;
      case 'md':
      default:
        return styles.pMd;
    }
  };

  const cardStyle = [styles.base, getVariantStyle(), getPaddingStyle(), style];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        style={cardStyle}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  elevated: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  flat: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  highlighted: {
    backgroundColor: colors.surfaceHighlighted,
    borderWidth: 1.5,
    borderColor: colors.successBorder,
    ...shadows.subtle,
  },
  pNone: {
    padding: 0,
  },
  pSm: {
    padding: spacing.sm,
  },
  pMd: {
    padding: spacing.lg,
  },
  pLg: {
    padding: spacing.xl,
  },
});
