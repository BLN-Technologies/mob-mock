import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TextInput } from 'react-native';
import { colors, radii } from '../../theme/tokens';
import { Button } from '../../components/ui/Button';
import { useTranslation } from '../../i18n';

interface OtpModalProps {
  visible: boolean;
  onVerify: (code: string) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  visible,
  onVerify,
  onCancel,
  loading = false,
  error,
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('123456'); // Default simulated OTP for easy testing

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t.auth.otpTitle}</Text>
          <Text style={styles.subtitle}>{t.auth.otpSubtitle}</Text>

          <TextInput
            style={styles.otpInput}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonRow}>
            <Button
              title={t.common.cancel}
              onPress={onCancel}
              variant="secondary"
              style={styles.btnHalf}
            />
            <Button
              title={t.auth.verifyCode}
              onPress={() => onVerify(code)}
              loading={loading}
              style={styles.btnHalf}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutralDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutralGray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  otpInput: {
    height: 52,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.md,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    color: colors.neutralDark,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  btnHalf: {
    flex: 1,
  },
});
