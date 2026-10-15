import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing } from '../../theme/tokens';

export interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  helper?: string;
  prefix?: string;
  suffix?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onIconPress?: () => void;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helper,
  prefix,
  suffix,
  icon,
  rightIcon,
  onIconPress,
  onRightIconPress,
  containerStyle,
  style,
  secureTextEntry,
  multiline,
  ...props
}) => {
  const [passwordHidden, setPasswordHidden] = useState<boolean>(Boolean(secureTextEntry));

  const isPassword = Boolean(secureTextEntry);
  const actualSecureTextEntry = isPassword ? passwordHidden : false;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          multiline && styles.inputWrapperMultiline,
          error ? styles.inputWrapperError : undefined,
        ]}
      >
        {icon ? (
          onIconPress ? (
            <TouchableOpacity
              onPress={onIconPress}
              style={styles.iconAdornment}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
            >
              <Ionicons name={icon} size={18} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconAdornment}>
              <Ionicons name={icon} size={18} color="#64748B" />
            </View>
          )
        ) : prefix ? (
          <View style={styles.adornment}>
            <Text style={styles.adornmentText}>{prefix}</Text>
          </View>
        ) : null}

        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            style,
          ]}
          placeholderTextColor="#94A3B8"
          secureTextEntry={actualSecureTextEntry}
          multiline={multiline}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.rightActionAdornment}
            onPress={() => setPasswordHidden(!passwordHidden)}
            accessibilityLabel={passwordHidden ? 'Show password' : 'Hide password'}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={passwordHidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={passwordHidden ? '#64748B' : colors.primary}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          onRightIconPress ? (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.rightActionAdornment}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <Ionicons name={rightIcon} size={18} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View style={styles.rightActionAdornment}>
              <Ionicons name={rightIcon} size={18} color="#64748B" />
            </View>
          )
        ) : suffix ? (
          <View style={styles.suffixAdornment}>
            <Text style={styles.adornmentText}>{suffix}</Text>
          </View>
        ) : null}
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
    height: 48,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputWrapperMultiline: {
    height: undefined,
    minHeight: 96,
    maxHeight: 180,
    alignItems: 'flex-start',
  },
  inputWrapperError: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'android' ? 8 : 12,
    fontSize: 14,
    color: colors.neutralDark,
  },
  inputMultiline: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    textAlignVertical: 'top',
  },
  iconAdornment: {
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActionAdornment: {
    paddingRight: spacing.md,
    paddingLeft: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adornment: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  suffixAdornment: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    alignSelf: 'stretch',
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
