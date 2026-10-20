import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { radii, shadows, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

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
  const { colors: tc } = useTheme();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: tc.surface,
          borderWidth: 1.5,
          borderColor: tc.border,
        };
      case 'flat':
        return {
          backgroundColor: tc.surfaceSubtle,
          borderWidth: 1,
          borderColor: tc.borderLight,
        };
      case 'highlighted':
        return {
          backgroundColor: tc.surfaceHighlighted,
          borderWidth: 1.5,
          borderColor: tc.successBorder,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: tc.surfaceCard,
          borderWidth: 1,
          borderColor: tc.borderLight,
          ...shadows.subtle,
        };
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
