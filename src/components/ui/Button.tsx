import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radii } from '../../theme/tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = () => {
    if (disabled) return styles.disabledContainer;
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'text':
        return styles.textContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    if (disabled) return styles.disabledText;
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
        return styles.dangerText;
      case 'text':
        return styles.textVariantText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.base, getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#FFF' : colors.primary} />
      ) : (
        <>
          {icon}
          <Text style={[styles.textBase, getTextStyle(), icon ? { marginLeft: 8 } : undefined, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48, // Touch target >= 48dp
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryContainer: {
    backgroundColor: colors.primary,
  },
  secondaryContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dangerContainer: {
    backgroundColor: colors.danger,
  },
  textContainer: {
    backgroundColor: 'transparent',
    minHeight: 40,
    paddingHorizontal: 8,
  },
  disabledContainer: {
    backgroundColor: '#E2E8F0',
  },
  textBase: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: colors.primary,
  },
  dangerText: {
    color: '#FFFFFF',
  },
  textVariantText: {
    color: colors.primary,
  },
  disabledText: {
    color: '#94A3B8',
  },
});
