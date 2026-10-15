import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';
import { useTranslation, Language } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { authService, mockState } from '../../services/mock/mockServices';
import { User } from '../../domain/models';

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  onResetComplete: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onLogout,
  onResetComplete,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const org = authService.getUserOrganization(user);
  const [resetting, setResetting] = useState(false);

  const handleLanguageToggle = async (newLang: Language) => {
    await setLanguage(newLang);
  };

  const handleResetData = () => {
    Alert.alert(
      t.common.resetDemoData,
      'This will reset all lots, orders, disputes, and offline queues back to the deterministic initial seed state. Continue?',
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm,
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            await mockState.resetAll();
            setResetting(false);
            Alert.alert('Demo Reset', 'All application demo data has been reset to baseline.', [
              { text: 'OK', onPress: onResetComplete },
            ]);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(t.common.logout, 'Are you sure you want to log out of Cargo?', [
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* User Header */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.fullName.charAt(0)}</Text>
        </View>
        <Text style={styles.userName}>{user.fullName}</Text>
        <Text style={styles.userRole}>
          {(t.roles as any)[user.role] || user.role}
        </Text>
        <Text style={styles.userContact}>{user.phone} · {user.email}</Text>
      </View>

      {/* Organization Details */}
      {org && (
        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t.profile.organization}</Text>
            <StatusBadge status={org.verificationStatus} />
          </View>
          <Text style={styles.orgName}>{org.name}</Text>
          <Text style={styles.orgDetails}>
            Reg No: {org.registrationNumber} {org.tin ? `· TIN: ${org.tin}` : ''}
          </Text>
          <Text style={styles.orgDetails}>
            Location: {org.district}, {org.sector}
          </Text>
        </Card>
      )}

      {/* Language Switcher */}
      <Card>
        <Text style={styles.cardTitle}>{t.profile.language}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'rw' && styles.langBtnActive]}
            onPress={() => handleLanguageToggle('rw')}
          >
            <Text style={[styles.langText, language === 'rw' && styles.langTextActive]}>
              🇷🇼 Ikinyarwanda
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => handleLanguageToggle('en')}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
              🇬🇧 English
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Operations & Reset */}
      <Card>
        <Text style={styles.cardTitle}>Demo Environment Actions</Text>
        <Text style={styles.resetExplanation}>
          Use this action to wipe any transient test lots or orders and restore the original seed data.
        </Text>
        <Button
          title={resetting ? 'Resetting...' : t.common.resetDemoData}
          onPress={handleResetData}
          variant="secondary"
          loading={resetting}
          style={{ marginTop: 8 }}
        />
      </Card>

      {/* Logout */}
      <Button
        title={t.common.logout}
        onPress={handleLogout}
        variant="danger"
        style={styles.logoutBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  userRole: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  userContact: {
    fontSize: 12,
    color: colors.neutralGray,
    marginTop: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutralDark,
  },
  orgDetails: {
    fontSize: 13,
    color: colors.neutralGray,
    marginTop: 4,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFF',
  },
  langBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#DCFCE7',
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutralDark,
  },
  langTextActive: {
    color: colors.primary,
  },
  resetExplanation: {
    fontSize: 12,
    color: colors.neutralGray,
    marginTop: 4,
    lineHeight: 16,
  },
  logoutBtn: {
    marginTop: 16,
  },
});
