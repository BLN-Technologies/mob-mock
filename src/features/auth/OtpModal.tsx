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
  const { t, language } = useTranslation();
  const [code, setCode] = useState('123456'); // Default simulated OTP for easy testing

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>
              {language === 'rw' ? 'IGERAGEZA RYA POROTOTAYIPE' : 'DEMO OTP SIMULATION'}
            </Text>
          </View>
          <Text style={styles.title}>{t.auth.otpTitle}</Text>
          <Text style={styles.subtitle}>{t.auth.otpSubtitle}</Text>

          <View style={styles.demoNoticeBox}>
            <Text style={styles.demoNoticeText}>
              {language === 'rw'
                ? 'Iyi ni intambwe yo kugerageza porototayipe (Demo). Mu bikorwa bya nyabyo, kode ya SMS izoherezwa kuri telefone yawe. Kode y’igerageza: 123456.'
                : 'Prototype verification simulation. In production, a live 6-digit OTP is delivered via MTN/Airtel SMS gateways. Default demo code: 123456.'}
            </Text>
          </View>

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
  demoBadge: {
    alignSelf: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 12,
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  demoNoticeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  demoNoticeText: {
    fontSize: 11,
    color: colors.neutralGray,
    lineHeight: 16,
    textAlign: 'center',
  },
});
