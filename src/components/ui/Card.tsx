import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, shadows } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: 12,
  },
});
