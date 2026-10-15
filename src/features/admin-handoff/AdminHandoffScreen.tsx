import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { User } from '../../domain/models';

interface AdminHandoffScreenProps {
  user: User;
  onLogout: () => void;
}

export const AdminHandoffScreen: React.FC<AdminHandoffScreenProps> = ({
  user,
  onLogout,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.contentCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="desktop-outline" size={48} color={colors.primary} />
        </View>

        <Text style={styles.title}>{t.adminHandoff.title}</Text>
        <Text style={styles.userName}>Logged in as: {user.fullName} (Administrator)</Text>

        <Text style={styles.noticeText}>
          {t.adminHandoff.notice}
        </Text>

        <Text style={styles.instructionText}>
          {t.adminHandoff.instruction}
        </Text>

        <View style={styles.urlBox}>
          <Text style={styles.urlText}>https://admin.cargo.rw</Text>
        </View>

        <Button
          title={t.common.logout}
          onPress={onLogout}
          variant="secondary"
          style={styles.logoutBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutralDark,
    textAlign: 'center',
  },
  userName: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 14,
    color: colors.neutralDark,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 13,
    color: colors.neutralGray,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  urlBox: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  urlText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutralDark,
    fontFamily: 'monospace',
  },
  logoutBtn: {
    width: '100%',
  },
});
