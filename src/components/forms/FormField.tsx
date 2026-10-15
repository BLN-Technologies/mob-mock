import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing } from '../../theme/tokens';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  helper?: string;
  prefix?: string;
  suffix?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helper,
  prefix,
  suffix,
  icon,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      
      <View
        style={[
          styles.inputWrapper,
          error ? styles.inputWrapperError : undefined,
        ]}
      >
        {icon ? (
          <View style={styles.iconAdornment}>
            <Ionicons name={icon} size={18} color="#64748B" />
          </View>
        ) : prefix ? (
          <View style={styles.adornment}>
            <Text style={styles.adornmentText}>{prefix}</Text>
          </View>
        ) : null}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#94A3B8"
          {...props}
        />

        {suffix && (
          <View style={styles.suffixAdornment}>
            <Text style={styles.adornmentText}>{suffix}</Text>
          </View>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutralHeadings,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputWrapperError: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.neutralDark,
  },
  iconAdornment: {
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adornment: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  suffixAdornment: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.borderLight,
  },
  adornmentText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralGray,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    fontSize: 11,
  },
  helperText: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: spacing.xs,
  },
});
