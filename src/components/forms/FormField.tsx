import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, radii } from '../../theme/tokens';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  helper?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helper,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : undefined,
          style,
        ]}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutralDark,
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.neutralDark,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: colors.neutralGray,
    marginTop: 4,
  },
});
