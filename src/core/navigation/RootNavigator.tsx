import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { SplashScreen } from '../bootstrap/SplashScreen';
import { TopAppBar } from '../../components/navigation/TopAppBar';
import { WelcomeScreen } from '../../features/auth/WelcomeScreen';
import { RoleSelectionScreen } from '../../features/auth/RoleSelectionScreen';
import { RegisterScreen } from '../../features/auth/RegisterScreen';
import { AgentInviteScreen } from '../../features/auth/AgentInviteScreen';
import { LoginScreen } from '../../features/auth/LoginScreen';
import { SupplierOnboardingScreen } from '../../features/auth/SupplierOnboardingScreen';
import { BuyerOnboardingScreen } from '../../features/auth/BuyerOnboardingScreen';
import { AgentOnboardingScreen } from '../../features/auth/AgentOnboardingScreen';
import { AdminHandoffScreen } from '../../features/admin-handoff/AdminHandoffScreen';
import { authService } from '../../services/mock/mockServices';
import { resolveAuthenticatedRoute } from './routingPolicy';

// Supplier Screens
import { SupplierHomeScreen } from '../../features/supplier/SupplierHomeScreen';
import { LotListScreen } from '../../features/supplier/LotListScreen';
import { CreateLotWizard } from '../../features/supplier/CreateLotWizard';
import { SupplierOrdersScreen } from '../../features/supplier/SupplierOrdersScreen';

// Agent Screens
import { AgentTasksScreen } from '../../features/agent/AgentTasksScreen';
import { GradingFormScreen } from '../../features/agent/GradingFormScreen';
import { OfflineQueueScreen } from '../../features/agent/OfflineQueueScreen';

// Buyer Screens
import { BuyerCatalogueScreen } from '../../features/buyer/BuyerCatalogueScreen';
import { CreateRequestScreen } from '../../features/buyer/CreateRequestScreen';
import { LotDetailScreen } from '../../features/buyer/LotDetailScreen';
import { BuyerOffersScreen } from '../../features/buyer/BuyerOffersScreen';
import { BuyerOrdersListScreen } from '../../features/buyer/BuyerOrdersListScreen';
import { BuyerOrderDetailScreen } from '../../features/buyer/BuyerOrderDetailScreen';

// Common Screens
import { NotificationInboxScreen } from '../../features/notifications/NotificationInboxScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';

import { UserRole } from '../../domain/enums';
import { User, Lot, Organization, BuyerLotProjection, Order } from '../../domain/models';

type AuthFlowStep =
  | 'welcome'
  | 'role_select'
  | 'register'
  | 'agent_invite'
  | 'login'
  | 'onboarding_supplier'
  | 'onboarding_buyer'
  | 'onboarding_agent';

export const RootNavigator: React.FC = () => {
  const { t } = useTranslation();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Unauthenticated Entry Flow State
  const [authFlowStep, setAuthFlowStep] = useState<AuthFlowStep>('welcome');
  const [selectedRole, setSelectedRole] = useState<UserRole.SUPPLIER | UserRole.BUYER>(UserRole.SUPPLIER);
  const [newlyRegisteredUser, setNewlyRegisteredUser] = useState<User | null>(null);

  // Active Tab state for each role
  const [activeTab, setActiveTab] = useState<string>('home');

  // Supplier flow modals / drilldowns
  const [showCreateLot, setShowCreateLot] = useState(false);

  // Agent flow drilldown
  const [activeTask, setActiveTask] = useState<{ lot: Lot; org?: Organization } | null>(null);

  // Buyer flow drilldowns
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [selectedBuyerLot, setSelectedBuyerLot] = useState<BuyerLotProjection | null>(null);
  const [selectedBuyerOrder, setSelectedBuyerOrder] = useState<Order | null>(null);

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setNewlyRegisteredUser(null);
    setAuthFlowStep('welcome');
    setActiveTab('home');
  };

  if (bootstrapping) {
    return (
      <SplashScreen
        onBootstrapComplete={user => {
          if (user) {
            const org = authService.getUserOrganization(user);
            const route = resolveAuthenticatedRoute(user, org);
            if (route.requiresOnboarding) {
              setNewlyRegisteredUser(user);
              if (route.destination === 'ONBOARDING_SUPPLIER') setAuthFlowStep('onboarding_supplier');
              else if (route.destination === 'ONBOARDING_BUYER') setAuthFlowStep('onboarding_buyer');
              else if (route.destination === 'ONBOARDING_AGENT') setAuthFlowStep('onboarding_agent');
            } else if (
              route.destination === 'ADMIN_HANDOFF' ||
              route.destination === 'SUPPLIER_WORKSPACE' ||
              route.destination === 'BUYER_WORKSPACE' ||
              route.destination === 'AGENT_WORKSPACE'
            ) {
              setCurrentUser(user);
              if (route.initialTab) setActiveTab(route.initialTab);
            }
          }
          setBootstrapping(false);
        }}
      />
    );
  }

  // Master Unauthenticated Entry Flow
  if (!currentUser) {
    if (authFlowStep === 'role_select') {
      return (
        <RoleSelectionScreen
          initialRole={selectedRole}
          onSelectRole={role => {
            setSelectedRole(role);
            setAuthFlowStep('register');
          }}
          onNavigateBack={() => setAuthFlowStep('welcome')}
          onNavigateToLogin={() => setAuthFlowStep('login')}
          onNavigateToAgentInvite={() => setAuthFlowStep('agent_invite')}
        />
      );
    }

    if (authFlowStep === 'register') {
      return (
        <RegisterScreen
          selectedRole={selectedRole}
          onRegisterSuccess={user => {
            setNewlyRegisteredUser(user);
            if (user.role === UserRole.SUPPLIER) {
              setAuthFlowStep('onboarding_supplier');
            } else if (user.role === UserRole.BUYER) {
              setAuthFlowStep('onboarding_buyer');
            } else if (user.role === UserRole.FIELD_AGENT) {
              setAuthFlowStep('onboarding_agent');
            } else {
              setCurrentUser(user);
            }
          }}
          onBackToRoleSelect={() => setAuthFlowStep('role_select')}
          onNavigateToLogin={() => setAuthFlowStep('login')}
        />
      );
    }

    if (authFlowStep === 'agent_invite') {
      return (
        <AgentInviteScreen
          onSuccess={user => {
            setNewlyRegisteredUser(user);
            setAuthFlowStep('onboarding_agent');
          }}
          onNavigateBack={() => setAuthFlowStep('welcome')}
          onNavigateToLogin={() => setAuthFlowStep('login')}
        />
      );
    }

    if (authFlowStep === 'onboarding_supplier' && newlyRegisteredUser) {
      const org = authService.getUserOrganization(newlyRegisteredUser);
      return (
        <SupplierOnboardingScreen
          user={newlyRegisteredUser}
          organization={org}
          onComplete={async () => {
            const updated = await authService.completeOnboarding(newlyRegisteredUser.id);
            setCurrentUser(updated);
            setActiveTab('home');
          }}
        />
      );
    }

    if (authFlowStep === 'onboarding_buyer' && newlyRegisteredUser) {
      const org = authService.getUserOrganization(newlyRegisteredUser);
      return (
        <BuyerOnboardingScreen
          user={newlyRegisteredUser}
          organization={org}
          onComplete={async () => {
            const updated = await authService.completeOnboarding(newlyRegisteredUser.id);
            setCurrentUser(updated);
            setActiveTab('catalogue');
          }}
        />
      );
    }

    if (authFlowStep === 'onboarding_agent' && newlyRegisteredUser) {
      const org = authService.getUserOrganization(newlyRegisteredUser);
      return (
        <AgentOnboardingScreen
          user={newlyRegisteredUser}
          organization={org}
          onComplete={async () => {
            const updated = await authService.completeOnboarding(newlyRegisteredUser.id);
            setCurrentUser(updated);
            setActiveTab('tasks');
          }}
        />
      );
    }

    if (authFlowStep === 'login') {
      return (
        <LoginScreen
          onLoginSuccess={user => {
            const org = authService.getUserOrganization(user);
            const route = resolveAuthenticatedRoute(user, org);
            if (route.requiresOnboarding) {
              setNewlyRegisteredUser(user);
              if (route.destination === 'ONBOARDING_SUPPLIER') setAuthFlowStep('onboarding_supplier');
              else if (route.destination === 'ONBOARDING_BUYER') setAuthFlowStep('onboarding_buyer');
              else if (route.destination === 'ONBOARDING_AGENT') setAuthFlowStep('onboarding_agent');
            } else {
              setCurrentUser(user);
              if (route.initialTab) setActiveTab(route.initialTab);
            }
          }}
          onNavigateToRegister={() => setAuthFlowStep('role_select')}
          onNavigateBack={() => setAuthFlowStep('welcome')}
        />
      );
    }

    // Default: 'welcome'
    return (
      <WelcomeScreen
        onGetStarted={() => setAuthFlowStep('role_select')}
        onNavigateToLogin={() => setAuthFlowStep('login')}
        onNavigateToAgentInvite={() => setAuthFlowStep('agent_invite')}
      />
    );
  }

  // 1. Administrator Web Handoff
  if (currentUser.role === UserRole.ADMINISTRATOR) {
    return (
      <AdminHandoffScreen
        user={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  // Get active tab title for TopAppBar
  const getTabTitle = () => {
    switch (activeTab) {
      case 'home':
        return t.tabs.home;
      case 'lots':
        return t.tabs.lots;
      case 'orders':
        return t.tabs.orders;
      case 'tasks':
        return t.tabs.tasks;
      case 'queue':
        return t.tabs.queue;
      case 'catalogue':
        return t.tabs.catalogue;
      case 'offers':
        return t.tabs.offers;
      case 'notifications':
        return t.tabs.notifications;
      case 'profile':
        return t.tabs.profile;
      default:
        return t.common.appName;
    }
  };

  // 2. Supplier Navigation Shell
  if (currentUser.role === UserRole.SUPPLIER) {
    if (showCreateLot) {
      return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <TopAppBar
            title={t.supplier.declareHarvestTitle}
            showBack
            onBack={() => setShowCreateLot(false)}
          />
          <CreateLotWizard
            user={currentUser}
            onSuccess={() => {
              setShowCreateLot(false);
              setActiveTab('lots');
            }}
            onCancel={() => setShowCreateLot(false)}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Unified Top App Bar */}
        <TopAppBar
          title={getTabTitle()}
          user={currentUser}
          onNotificationPress={() => setActiveTab('notifications')}
          onProfilePress={() => setActiveTab('profile')}
        />

        <View style={styles.screenContainer}>
          {activeTab === 'home' && (
            <SupplierHomeScreen
              user={currentUser}
              onNavigateToCreateLot={() => setShowCreateLot(true)}
              onNavigateToLots={() => setActiveTab('lots')}
              onNavigateToOrders={() => setActiveTab('orders')}
            />
          )}
          {activeTab === 'lots' && (
            <LotListScreen
              user={currentUser}
              onNavigateToCreateLot={() => setShowCreateLot(true)}
            />
          )}
          {activeTab === 'orders' && (
            <SupplierOrdersScreen user={currentUser} />
          )}
          {activeTab === 'notifications' && (
            <NotificationInboxScreen user={currentUser} />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen
              user={currentUser}
              onLogout={handleLogout}
              onResetComplete={() => setActiveTab('home')}
              onUserUpdated={updated => setCurrentUser(updated)}
            />
          )}
        </View>

        {/* Polished Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'home' ? 'home' : 'home-outline'}
              size={20}
              color={activeTab === 'home' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.home}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'lots' && styles.tabItemActive]}
            onPress={() => setActiveTab('lots')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'lots' ? 'cube' : 'cube-outline'}
              size={20}
              color={activeTab === 'lots' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'lots' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.lots}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
            onPress={() => setActiveTab('orders')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'orders' ? 'cart' : 'cart-outline'}
              size={20}
              color={activeTab === 'orders' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.orders}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'notifications' && styles.tabItemActive]}
            onPress={() => setActiveTab('notifications')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'notifications' ? 'notifications' : 'notifications-outline'}
              size={20}
              color={activeTab === 'notifications' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'notifications' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.notifications}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'profile' ? 'person' : 'person-outline'}
              size={20}
              color={activeTab === 'profile' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.profile}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 3. Field Agent Navigation Shell
  if (currentUser.role === UserRole.FIELD_AGENT) {
    if (activeTask) {
      return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <TopAppBar
            title={t.agent.inspectionTask}
            showBack
            onBack={() => setActiveTask(null)}
          />
          <GradingFormScreen
            lot={activeTask.lot}
            org={activeTask.org}
            agent={currentUser}
            onSuccess={() => {
              setActiveTask(null);
              setActiveTab('tasks');
            }}
            onCancel={() => setActiveTask(null)}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Unified Top App Bar */}
        <TopAppBar
          title={getTabTitle()}
          user={currentUser}
          onNotificationPress={() => setActiveTab('notifications')}
          onProfilePress={() => setActiveTab('profile')}
        />

        <View style={styles.screenContainer}>
          {activeTab === 'tasks' && (
            <AgentTasksScreen
              onSelectTask={(lot, org) => setActiveTask({ lot, org })}
            />
          )}
          {activeTab === 'queue' && (
            <OfflineQueueScreen />
          )}
          {activeTab === 'notifications' && (
            <NotificationInboxScreen user={currentUser} />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen
              user={currentUser}
              onLogout={handleLogout}
              onResetComplete={() => setActiveTab('tasks')}
              onUserUpdated={updated => setCurrentUser(updated)}
            />
          )}
        </View>

        {/* Agent Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'tasks' && styles.tabItemActive]}
            onPress={() => setActiveTab('tasks')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'tasks' ? 'clipboard' : 'clipboard-outline'}
              size={20}
              color={activeTab === 'tasks' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'tasks' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.tasks}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'queue' && styles.tabItemActive]}
            onPress={() => setActiveTab('queue')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'queue' ? 'cloud-done' : 'cloud-offline-outline'}
              size={20}
              color={activeTab === 'queue' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'queue' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.queue}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'notifications' && styles.tabItemActive]}
            onPress={() => setActiveTab('notifications')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'notifications' ? 'notifications' : 'notifications-outline'}
              size={20}
              color={activeTab === 'notifications' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'notifications' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.notifications}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'profile' ? 'person' : 'person-outline'}
              size={20}
              color={activeTab === 'profile' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.profile}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 4. Buyer Extension Navigation Shell
  if (currentUser.role === UserRole.BUYER) {
    if (showCreateRequest) {
      return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <TopAppBar
            title={t.buyer.postRequest}
            showBack
            onBack={() => setShowCreateRequest(false)}
          />
          <CreateRequestScreen
            user={currentUser}
            onSuccess={() => setShowCreateRequest(false)}
            onCancel={() => setShowCreateRequest(false)}
          />
        </SafeAreaView>
      );
    }

    if (selectedBuyerLot) {
      return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <TopAppBar
            title={selectedBuyerLot.cropName}
            showBack
            onBack={() => setSelectedBuyerLot(null)}
          />
          <LotDetailScreen
            lot={selectedBuyerLot}
            user={currentUser}
            onBack={() => setSelectedBuyerLot(null)}
            onRequestMatch={() => {
              setSelectedBuyerLot(null);
              setShowCreateRequest(true);
            }}
          />
        </SafeAreaView>
      );
    }

    if (selectedBuyerOrder) {
      return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <TopAppBar
            title={selectedBuyerOrder.orderNumber}
            showBack
            onBack={() => setSelectedBuyerOrder(null)}
          />
          <BuyerOrderDetailScreen
            order={selectedBuyerOrder}
            user={currentUser}
            onRefreshNeeded={() => setSelectedBuyerOrder(null)}
            onBack={() => setSelectedBuyerOrder(null)}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Unified Top App Bar */}
        <TopAppBar
          title={getTabTitle()}
          user={currentUser}
          onNotificationPress={() => setActiveTab('notifications')}
          onProfilePress={() => setActiveTab('profile')}
        />

        <View style={styles.screenContainer}>
          {activeTab === 'catalogue' && (
            <BuyerCatalogueScreen
              onNavigateToCreateRequest={() => setShowCreateRequest(true)}
              onSelectLot={lot => setSelectedBuyerLot(lot)}
            />
          )}
          {activeTab === 'offers' && (
            <BuyerOffersScreen
              user={currentUser}
              onOfferAccepted={() => setActiveTab('orders')}
            />
          )}
          {activeTab === 'orders' && (
            <BuyerOrdersListScreen
              user={currentUser}
              onSelectOrder={ord => setSelectedBuyerOrder(ord)}
              onNavigateToCatalogue={() => setActiveTab('catalogue')}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationInboxScreen user={currentUser} />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen
              user={currentUser}
              onLogout={handleLogout}
              onResetComplete={() => setActiveTab('catalogue')}
              onUserUpdated={updated => setCurrentUser(updated)}
            />
          )}
        </View>

        {/* Buyer Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'catalogue' && styles.tabItemActive]}
            onPress={() => setActiveTab('catalogue')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'catalogue' ? 'search' : 'search-outline'}
              size={20}
              color={activeTab === 'catalogue' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'catalogue' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.catalogue}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'offers' && styles.tabItemActive]}
            onPress={() => setActiveTab('offers')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'offers' ? 'git-pull-request' : 'git-pull-request-outline'}
              size={20}
              color={activeTab === 'offers' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'offers' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.offers}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
            onPress={() => setActiveTab('orders')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'orders' ? 'cart' : 'cart-outline'}
              size={20}
              color={activeTab === 'orders' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.orders}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'notifications' && styles.tabItemActive]}
            onPress={() => setActiveTab('notifications')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'notifications' ? 'notifications' : 'notifications-outline'}
              size={20}
              color={activeTab === 'notifications' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'notifications' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.notifications}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'profile' ? 'person' : 'person-outline'}
              size={20}
              color={activeTab === 'profile' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.tabs.profile}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingBottom: 4,
    ...shadows.subtle,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  tabItemActive: {
    backgroundColor: colors.surfaceHighlighted,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
