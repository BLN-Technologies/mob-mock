import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing, shadows } from '../../theme/tokens';
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
          <Ionicons name="desktop-outline" size={44} color={colors.primary} />
        </View>

        <Text style={styles.title}>{t.adminHandoff.title}</Text>
        <Text style={styles.userName}>
          Logged in as: {user.fullName} (Administrator)
        </Text>

        <Text style={styles.noticeText}>
          {t.adminHandoff.notice}
        </Text>

        <Text style={styles.instructionText}>
          {t.adminHandoff.instruction}
        </Text>

        <View style={styles.urlBox}>
          <Ionicons name="link-outline" size={16} color={colors.primary} />
          <Text style={styles.urlText}>https://admin.cargo.rw</Text>
        </View>

        <Button
          title={t.common.logout}
          onPress={onLogout}
          variant="secondary"
          size="medium"
          fullWidth
          icon={<Ionicons name="log-out-outline" size={18} color={colors.neutralDark} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surfaceHighlighted,
    borderWidth: 1.5,
    borderColor: colors.successBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    fontSize: 20,
    color: colors.neutralHeadings,
    textAlign: 'center',
  },
  userName: {
    ...typography.caption,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  noticeText: {
    ...typography.body,
    fontSize: 13,
    color: colors.neutralDark,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  instructionText: {
    ...typography.caption,
    color: colors.neutralGray,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  urlText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralDark,
    fontFamily: 'monospace',
  },
});
