import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation, Language } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FormField } from '../../components/forms/FormField';
import { authService, mockState } from '../../services/mock/mockServices';
import { localStorage } from '../../data/local/storage';
import { User } from '../../domain/models';

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  onResetComplete: () => void;
  onUserUpdated?: (updatedUser: User) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onLogout,
  onResetComplete,
  onUserUpdated,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const org = authService.getUserOrganization(user);
  const [resetting, setResetting] = useState(false);

  // Edit Profile Modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.fullName);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const handleLanguageToggle = async (newLang: Language) => {
    await setLanguage(newLang);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError('Full name cannot be empty');
      return;
    }
    if (!editPhone.trim()) {
      setEditError('Phone number cannot be empty');
      return;
    }

    setSavingEdit(true);
    const updatedUser: User = {
      ...user,
      fullName: editName.trim(),
      phone: editPhone.trim(),
    };

    await localStorage.setSessionUser(updatedUser);
    setSavingEdit(false);
    setIsEditing(false);
    setEditError('');

    if (onUserUpdated) {
      onUserUpdated(updatedUser);
    }

    Alert.alert(t.common.appName, t.profile.profileUpdated);
  };

  const handleResetData = () => {
    Alert.alert(
      t.common.resetDemoData,
      t.profile.demoResetDesc,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm,
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            await mockState.resetAll();
            setResetting(false);
            Alert.alert(t.common.appName, t.profile.resetSuccess, [
              { text: t.common.done, onPress: onResetComplete },
            ]);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(t.common.logout, `${t.common.logout}?`, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.logout,
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          onLogout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Executive Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.fullName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.userName}>{user.fullName}</Text>
              <Text style={styles.userRole}>
                {(t.roles as any)[user.role] || user.role}
              </Text>
              <Text style={styles.userPhone}>{user.phone}</Text>
            </View>
          </View>

          <View style={styles.headerActionRow}>
            <StatusBadge status={org?.verificationStatus || 'VERIFIED'} size="small" />
            <Button
              title={t.profile.editProfile}
              onPress={() => {
                setEditName(user.fullName);
                setEditPhone(user.phone);
                setIsEditing(true);
              }}
              variant="outline"
              size="small"
              icon={<Ionicons name="create-outline" size={15} color={colors.primary} />}
            />
          </View>
        </View>

        {/* Organization / Cooperative Information */}
        {org && (
          <Card style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="business-outline" size={18} color={colors.primary} />
                <Text style={styles.cardSectionTitle}>{t.profile.organization}</Text>
              </View>
              <StatusBadge status={org.verificationStatus} size="small" />
            </View>

            <Text style={styles.orgName}>{org.name}</Text>

            <View style={styles.orgMetaGrid}>
              <View style={styles.orgMetaItem}>
                <Text style={styles.metaLabel}>Reg No</Text>
                <Text style={styles.metaVal}>{org.registrationNumber}</Text>
              </View>
              {org.tin && (
                <View style={styles.orgMetaItem}>
                  <Text style={styles.metaLabel}>TIN</Text>
                  <Text style={styles.metaVal}>{org.tin}</Text>
                </View>
              )}
              <View style={styles.orgMetaItem}>
                <Text style={styles.metaLabel}>Location</Text>
                <Text style={styles.metaVal}>
                  {org.district}, {org.sector}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Language Selection Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="globe-outline" size={18} color={colors.primary} />
              <Text style={styles.cardSectionTitle}>{t.profile.language}</Text>
            </View>
          </View>

          <View style={styles.langGrid}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'rw' && styles.langBtnActive]}
              onPress={() => handleLanguageToggle('rw')}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.flagText}>🇷🇼</Text>
              <Text style={[styles.langBtnText, language === 'rw' && styles.langBtnTextActive]}>
                Ikinyarwanda
              </Text>
              {language === 'rw' && (
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => handleLanguageToggle('en')}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.flagText}>🇬🇧</Text>
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
                English
              </Text>
              {language === 'en' && (
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </Card>

        {/* Support & Operations Hotline */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="headset-outline" size={18} color={colors.primary} />
              <Text style={styles.cardSectionTitle}>{t.profile.help}</Text>
            </View>
          </View>

          <Text style={styles.supportTitle}>{t.profile.supportHotline}</Text>
          <Text style={styles.supportDetail}>{t.profile.kigaliOffice}</Text>
          <Text style={styles.supportDetailHighlight}>{t.profile.supportPhone}</Text>
        </Card>

        {/* Demo Actions & Reset */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="refresh-circle-outline" size={18} color={colors.warningDark} />
              <Text style={styles.cardSectionTitle}>{t.profile.demoActions}</Text>
            </View>
          </View>

          <Text style={styles.resetExplanation}>{t.profile.demoResetDesc}</Text>

          <Button
            title={resetting ? t.common.loading : t.common.resetDemoData}
            onPress={handleResetData}
            variant="secondary"
            loading={resetting}
            icon={<Ionicons name="reload" size={16} color={colors.neutralDark} />}
            style={styles.resetButton}
          />
        </Card>

        {/* Logout Button */}
        <View style={styles.logoutWrapper}>
          <Button
            title={t.common.logout}
            onPress={handleLogout}
            variant="danger"
            size="large"
            icon={<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />}
            fullWidth
          />
          <Text style={styles.appVersionText}>{t.profile.appVersion}</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.profile.editProfile}</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={22} color={colors.neutralDark} />
              </TouchableOpacity>
            </View>

            <FormField
              label={t.profile.fullName}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Jean Baptiste"
            />

            <FormField
              label={t.profile.phoneNumber}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="078..."
              keyboardType="phone-pad"
              error={editError}
            />

            <View style={styles.modalActionRow}>
              <Button
                title={t.common.cancel}
                onPress={() => setIsEditing(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title={savingEdit ? t.common.loading : t.common.save}
                onPress={handleSaveProfile}
                loading={savingEdit}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl + 20,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerMeta: {
    flex: 1,
  },
  userName: {
    ...typography.h2,
    fontSize: 18,
    color: colors.neutralHeadings,
  },
  userRole: {
    ...typography.caption,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  userPhone: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 2,
  },
  headerActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardSectionTitle: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralHeadings,
    textTransform: 'uppercase',
  },
  orgName: {
    ...typography.h3,
    fontSize: 15,
    color: colors.neutralHeadings,
    marginBottom: spacing.sm,
  },
  orgMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
  },
  orgMetaItem: {
    width: '46%',
  },
  metaLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
  },
  metaVal: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralDark,
    marginTop: 1,
  },
  langGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    gap: spacing.xs,
  },
  langBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceHighlighted,
  },
  flagText: {
    fontSize: 18,
  },
  langBtnText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutralDark,
  },
  langBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  supportTitle: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginBottom: 2,
  },
  supportDetail: {
    ...typography.caption,
    color: colors.neutralGray,
    marginBottom: 4,
  },
  supportDetailHighlight: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  resetExplanation: {
    ...typography.caption,
    color: colors.neutralGray,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  resetButton: {
    marginTop: spacing.xs,
  },
  logoutWrapper: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  appVersionText: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.neutralLight,
    marginTop: spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.neutralHeadings,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
