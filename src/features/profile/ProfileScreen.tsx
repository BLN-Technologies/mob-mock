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
import { colors, radii, typography, spacing } from '../../theme/tokens';
import { useTranslation, Language } from '../../i18n';
import { useTheme, ThemeMode } from '../../theme/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FormField } from '../../components/forms/FormField';
import { authService, mockState } from '../../services/mock/mockServices';
import { localStorage } from '../../data/local/storage';
import { User, Organization } from '../../domain/models';

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
  const { mode: themeMode, setThemeMode, colors: tc } = useTheme();
  const org = authService.getUserOrganization(user);
  const [resetting, setResetting] = useState(false);

  // Edit Profile Modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.fullName);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit Organization Address state
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [editDistrict, setEditDistrict] = useState(org?.district || '');
  const [editSector, setEditSector] = useState(org?.sector || '');
  const [currentOrg, setCurrentOrg] = useState<Organization | undefined>(org);

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

  const handleSaveOrgAddress = async () => {
    if (!currentOrg) return;
    const updatedOrg = {
      ...currentOrg,
      district: editDistrict.trim() || currentOrg.district,
      sector: editSector.trim() || currentOrg.sector,
    };
    setCurrentOrg(updatedOrg);
    setIsEditingOrg(false);
    Alert.alert(t.common.appName, 'Organization location updated successfully.');
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

  const userInitials = user.fullName
    ? user.fullName
        .split(' ')
        .map(n => n.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const orgInitials = currentOrg?.name
    ? currentOrg.name
        .split(' ')
        .map(n => n.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CO';

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Executive Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
            <View style={styles.headerMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user.fullName}</Text>
                {/* Compact accessible edit icon button */}
                <TouchableOpacity
                  style={styles.compactEditBtn}
                  onPress={() => {
                    setEditName(user.fullName);
                    setEditPhone(user.phone);
                    setIsEditing(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Edit personal details"
                >
                  <Ionicons name="pencil" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.userRole}>
                {(t.roles as any)[user.role] || user.role}
              </Text>
              <Text style={styles.userPhone}>{user.phone || user.email}</Text>
            </View>
          </View>

          <View style={styles.headerActionRow}>
            <StatusBadge status={currentOrg?.verificationStatus || 'VERIFIED'} size="small" />
            <Text style={styles.accountVerifiedText}>
              {user.contactVerified ? 'Contact Verified · Cargo Approved' : 'Verified Cargo Member'}
            </Text>
          </View>
        </View>

        {/* Organization / Cooperative Information */}
        {currentOrg && (
          <Card style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.orgAvatar}>
                  <Text style={styles.orgAvatarText}>{orgInitials}</Text>
                </View>
                <View style={styles.orgTitleWrap}>
                  <Text style={styles.cardSectionTitle}>{t.profile.organization}</Text>
                  <Text style={styles.orgName}>{currentOrg.name}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.compactEditBtn}
                onPress={() => {
                  setEditDistrict(currentOrg.district);
                  setEditSector(currentOrg.sector);
                  setIsEditingOrg(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Edit organization address"
              >
                <Ionicons name="pencil" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.orgMetaGrid}>
              <View style={styles.orgMetaItem}>
                <Text style={styles.metaLabel}>Reg No</Text>
                <Text style={styles.metaVal}>{currentOrg.registrationNumber || 'RCA-2026-001'}</Text>
              </View>
              {currentOrg.tin && (
                <View style={styles.orgMetaItem}>
                  <Text style={styles.metaLabel}>TIN</Text>
                  <Text style={styles.metaVal}>{currentOrg.tin}</Text>
                </View>
              )}
              <View style={styles.orgMetaItem}>
                <Text style={styles.metaLabel}>Location</Text>
                <Text style={styles.metaVal}>
                  {currentOrg.district}, {currentOrg.sector}
                </Text>
              </View>
            </View>
          </Card>
        )}


        {/* Language Selection Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="globe-outline" size={18} color={tc.primary} />
              <Text style={[styles.cardSectionTitle, { color: tc.neutralHeadings }]}>{t.profile.language}</Text>
            </View>
          </View>

          <View style={styles.langGrid}>
            <TouchableOpacity
              style={[
                styles.langBtn,
                {
                  backgroundColor: language === 'rw' ? tc.surfaceSubtle : tc.surface,
                  borderColor: language === 'rw' ? tc.primary : tc.borderLight,
                },
              ]}
              onPress={() => handleLanguageToggle('rw')}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.flagText}>🇷🇼</Text>
              <Text style={[styles.langBtnText, { color: language === 'rw' ? tc.primary : tc.neutralGray }]}>
                Ikinyarwanda
              </Text>
              {language === 'rw' && (
                <Ionicons name="checkmark-circle" size={16} color={tc.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langBtn,
                {
                  backgroundColor: language === 'en' ? tc.surfaceSubtle : tc.surface,
                  borderColor: language === 'en' ? tc.primary : tc.borderLight,
                },
              ]}
              onPress={() => handleLanguageToggle('en')}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.flagText}>🇬🇧</Text>
              <Text style={[styles.langBtnText, { color: language === 'en' ? tc.primary : tc.neutralGray }]}>
                English
              </Text>
              {language === 'en' && (
                <Ionicons name="checkmark-circle" size={16} color={tc.primary} />
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

        {/* Legal & Compliance Links */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <Text style={styles.cardSectionTitle}>Legal & Data Privacy</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.legalRow}
            onPress={() =>
              Alert.alert(
                'Terms of Service',
                'Cargo Mobile operates under approved Rwanda agricultural trade regulations (BR-01, BR-02, BR-03, BR-04, BR-05).'
              )
            }
          >
            <Text style={styles.legalLink}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.neutralGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalRow}
            onPress={() =>
              Alert.alert(
                'Privacy Policy',
                'Cargo guarantees full farmer privacy. Private contact numbers and farm coordinates are never exposed to buyers (BR-05).'
              )
            }
          >
            <Text style={styles.legalLink}>Privacy Policy (BR-05 Farmer Protection)</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.neutralGray} />
          </TouchableOpacity>
        </Card>

        {/* Demo Actions & Reset */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="refresh-circle-outline" size={18} color={colors.warning} />
              <Text style={styles.cardSectionTitle}>{t.profile.demoActions}</Text>
            </View>
          </View>

          <Text style={styles.resetExplanation}>{t.profile.demoResetDesc}</Text>

          <Button
            title={resetting ? t.common.loading : t.common.resetDemoData}
            onPress={handleResetData}
            variant="secondary"
            loading={resetting}
            icon={<Ionicons name="reload" size={16} color={colors.neutralHeadings} />}
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
                <Ionicons name="close" size={22} color={colors.neutralHeadings} />
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
              placeholder="e.g. +250 788 000 000"
              keyboardType="phone-pad"
            />

            {editError ? <Text style={styles.editErrorText}>{editError}</Text> : null}

            <View style={styles.modalActions}>
              <Button
                title={t.common.cancel}
                onPress={() => setIsEditing(false)}
                variant="outline"
                style={styles.modalBtn}
              />
              <Button
                title={t.common.save}
                onPress={handleSaveProfile}
                loading={savingEdit}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Organization Modal */}
      <Modal
        visible={isEditingOrg}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditingOrg(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Organization Location</Text>
              <TouchableOpacity onPress={() => setIsEditingOrg(false)}>
                <Ionicons name="close" size={22} color={colors.neutralHeadings} />
              </TouchableOpacity>
            </View>

            <FormField
              label="District"
              value={editDistrict}
              onChangeText={setEditDistrict}
              placeholder="e.g. Nyagatare"
            />

            <FormField
              label="Sector"
              value={editSector}
              onChangeText={setEditSector}
              placeholder="e.g. Katabagemu"
            />

            <View style={styles.modalActions}>
              <Button
                title={t.common.cancel}
                onPress={() => setIsEditingOrg(false)}
                variant="outline"
                style={styles.modalBtn}
              />
              <Button
                title={t.common.save}
                onPress={handleSaveOrgAddress}
                style={styles.modalBtn}
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
    paddingBottom: spacing.xxxl + 30,
  },
  headerCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceMint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  avatarText: {
    ...typography.h2,
    fontSize: 20,
    color: colors.primary,
  },
  headerMeta: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  userName: {
    ...typography.h3,
    fontSize: 17,
    color: colors.neutralHeadings,
  },
  compactEditBtn: {
    padding: 6,
    backgroundColor: colors.surfaceMint,
    borderRadius: radii.full,
  },
  userRole: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 1,
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
    paddingTop: spacing.xs + 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  accountVerifiedText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralLight,
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
    gap: spacing.xs + 2,
    flex: 1,
  },
  cardSectionTitle: {
    ...typography.h3,
    fontSize: 14,
    color: colors.neutralHeadings,
  },
  orgAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgAvatarText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.primary,
    fontSize: 12,
  },
  orgTitleWrap: {
    marginLeft: spacing.xs,
  },
  orgName: {
    ...typography.body,
    fontSize: 14,
    color: colors.neutralHeadings,
    fontWeight: '700',
  },
  orgMetaGrid: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
    justifyContent: 'space-around',
  },
  orgMetaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  metaVal: {
    ...typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutralHeadings,
    marginTop: 2,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: 6,
  },
  themeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceMint,
  },
  themeBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.neutralGray,
  },
  themeBtnTextActive: {
    color: colors.primary,
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
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  langBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceMint,
  },
  flagText: {
    fontSize: 16,
  },
  langBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.neutralGray,
  },
  langBtnTextActive: {
    color: colors.primary,
  },
  supportTitle: {
    ...typography.body,
    fontWeight: 'bold',
    fontSize: 13,
    color: colors.neutralHeadings,
  },
  supportDetail: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 2,
  },
  supportDetailHighlight: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  legalLink: {
    ...typography.body,
    fontSize: 13,
    color: colors.neutralHeadings,
  },
  resetExplanation: {
    ...typography.caption,
    color: colors.neutralGray,
    marginBottom: spacing.sm,
  },
  resetButton: {
    marginTop: spacing.xs,
  },
  logoutWrapper: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  appVersionText: {
    ...typography.caption,
    color: colors.neutralLight,
    marginTop: spacing.sm,
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.lg,
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
  editErrorText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalBtn: {
    flex: 1,
  },
});
