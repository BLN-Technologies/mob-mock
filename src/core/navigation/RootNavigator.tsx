import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { SplashScreen } from '../bootstrap/SplashScreen';
import { TopAppBar } from '../../components/navigation/TopAppBar';
import { WelcomeScreen } from '../../features/auth/WelcomeScreen';
import { RegisterScreen } from '../../features/auth/RegisterScreen';
import { VerificationStatusScreen } from '../../features/auth/VerificationStatusScreen';
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

// Agent / Inspector Screens
import { AgentTasksScreen } from '../../features/agent/AgentTasksScreen';
import { GradingFormScreen } from '../../features/agent/GradingFormScreen';
import { OfflineQueueScreen } from '../../features/agent/OfflineQueueScreen';

// Buyer Screens
import { BuyerHomeScreen } from '../../features/buyer/BuyerHomeScreen';
import { BuyerCatalogueScreen } from '../../features/buyer/BuyerCatalogueScreen';
import { CreateRequestScreen } from '../../features/buyer/CreateRequestScreen';
import { LotDetailScreen } from '../../features/buyer/LotDetailScreen';
import { BuyerOrdersListScreen } from '../../features/buyer/BuyerOrdersListScreen';
import { BuyerOrderDetailScreen } from '../../features/buyer/BuyerOrderDetailScreen';

// Common Screens
import { NotificationInboxScreen } from '../../features/notifications/NotificationInboxScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';

import { UserRole, LotStatus } from '../../domain/enums';
import { User, Lot, Organization, BuyerLotProjection, Order, WarehouseStockGroup } from '../../domain/models';

type AuthFlowStep =
  | 'welcome'
  | 'register'
  | 'verification'
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
  const [showSearchCatalogue, setShowSearchCatalogue] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setNewlyRegisteredUser(null);
    setAuthFlowStep('welcome');
    setActiveTab('home');
    setShowSearchCatalogue(false);
    setSelectedBuyerLot(null);
    setSelectedBuyerOrder(null);
    setShowCreateRequest(false);
  };

  if (bootstrapping) {
    return (
      <SplashScreen
        onBootstrapComplete={user => {
          if (user) {
            const org = authService.getUserOrganization(user);
            const route = resolveAuthenticatedRoute(user, org);

            if (user.contactVerified === false || user.approvalStatus === 'PENDING') {
              setNewlyRegisteredUser(user);
              setAuthFlowStep('verification');
            } else if (route.requiresOnboarding) {
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
    if (authFlowStep === 'register') {
      return (
        <RegisterScreen
          onRegisterSuccess={user => {
            setNewlyRegisteredUser(user);
            setAuthFlowStep('verification');
          }}
          onBackToWelcome={() => setAuthFlowStep('welcome')}
          onNavigateToLogin={() => setAuthFlowStep('login')}
        />
      );
    }

    if (authFlowStep === 'verification' && newlyRegisteredUser) {
      return (
        <VerificationStatusScreen
          user={newlyRegisteredUser}
          onStatusUpdated={(updatedUser: User) => {
            setNewlyRegisteredUser(updatedUser);
            if (updatedUser.approvalStatus === 'APPROVED') {
              if (updatedUser.role === UserRole.BUYER) {
                setAuthFlowStep('onboarding_buyer');
              } else if (updatedUser.role === UserRole.SUPPLIER) {
                setAuthFlowStep('onboarding_supplier');
              } else {
                setCurrentUser(updatedUser);
                setActiveTab('home');
              }
            }
          }}
          onSignOut={handleLogout}
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
            setActiveTab('home');
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
            setActiveTab('home');
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

            if (user.contactVerified === false || user.approvalStatus === 'PENDING') {
              setNewlyRegisteredUser(user);
              setAuthFlowStep('verification');
            } else if (route.requiresOnboarding) {
              setNewlyRegisteredUser(user);
              if (route.destination === 'ONBOARDING_SUPPLIER') setAuthFlowStep('onboarding_supplier');
              else if (route.destination === 'ONBOARDING_BUYER') setAuthFlowStep('onboarding_buyer');
              else if (route.destination === 'ONBOARDING_AGENT') setAuthFlowStep('onboarding_agent');
            } else {
              setCurrentUser(user);
              if (route.initialTab) setActiveTab(route.initialTab);
            }
          }}
          onNavigateToRegister={() => setAuthFlowStep('register')}
          onNavigateBack={() => setAuthFlowStep('welcome')}
        />
      );
    }

    // Default: 'welcome'
    return (
      <WelcomeScreen
        onGetStarted={() => setAuthFlowStep('register')}
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
      case 'notifications':
        return t.tabs.notifications;
      case 'profile':
        return t.tabs.profile;
      default:
        return t.common.appName;
    }
  };

  // 2. Supplier Navigation Shell: Home · Lots · Orders · Profile
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

        {/* Supplier Bottom Tab Bar: Home · Lots · Orders · Profile */}
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

  // 3. Field Inspector Navigation Shell: Home · Tasks · Profile
  if (currentUser.role === UserRole.FIELD_AGENT || (currentUser.role as any) === 'FIELD_INSPECTOR') {
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
              setActiveTab('home');
            }}
            onCancel={() => setActiveTask(null)}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <TopAppBar
          title={getTabTitle()}
          user={currentUser}
          onNotificationPress={() => setActiveTab('notifications')}
          onProfilePress={() => setActiveTab('profile')}
        />

        <View style={styles.screenContainer}>
          {activeTab === 'home' && (
            <AgentTasksScreen
              onSelectTask={(lot, org) => setActiveTask({ lot, org })}
            />
          )}
          {activeTab === 'tasks' && (
            <OfflineQueueScreen />
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

        {/* Inspector Bottom Tab Bar: Home · Tasks/Queue · Profile */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'home' ? 'clipboard' : 'clipboard-outline'}
              size={20}
              color={activeTab === 'home' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              Tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'tasks' && styles.tabItemActive]}
            onPress={() => setActiveTab('tasks')}
            activeOpacity={0.8}
            accessibilityRole="tab"
          >
            <Ionicons
              name={activeTab === 'tasks' ? 'cloud-done' : 'cloud-offline-outline'}
              size={20}
              color={activeTab === 'tasks' ? colors.primary : colors.neutralLight}
            />
            <Text
              style={[styles.tabLabel, activeTab === 'tasks' && styles.tabLabelActive]}
              numberOfLines={1}
            >
              Sync Queue
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

  // 4. Buyer Navigation Shell: Home · Orders · Profile
  if (currentUser.role === UserRole.BUYER) {
    if (showCreateRequest) {
      return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <TopAppBar
            title="Request Stock"
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

    if (showSearchCatalogue) {
      return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <TopAppBar
            title="Search & Discover"
            showBack
            onBack={() => setShowSearchCatalogue(false)}
          />
          <BuyerCatalogueScreen
            onNavigateToCreateRequest={() => {
              setShowSearchCatalogue(false);
              setShowCreateRequest(true);
            }}
            onSelectLot={lot => setSelectedBuyerLot(lot)}
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
        <TopAppBar
          title={getTabTitle()}
          user={currentUser}
          onNotificationPress={() => setActiveTab('notifications')}
          onProfilePress={() => setActiveTab('profile')}
        />

        <View style={styles.screenContainer}>
          {activeTab === 'home' && (
            <BuyerHomeScreen
              user={currentUser}
              onNavigateToSearch={() => setShowSearchCatalogue(true)}
              onSelectStockGroup={group => {
                const projected: BuyerLotProjection = {
                  id: group.id,
                  lotCode: `STOCK-${group.cropName.toUpperCase().slice(0, 3)}-${group.grade}`,
                  cropName: group.cropName,
                  cropType: group.cropType,
                  variety: group.variety,
                  availableQuantityKg: group.availableToOrderKg,
                  pricePerKgRwf: group.pricePerKgRwf,
                  grade: group.grade,
                  availabilityDate: group.availabilityDate,
                  district: group.hubLocation,
                  photos: group.photos,
                  status: LotStatus.VERIFIED,
                  verifiedAt: new Date().toISOString(),
                };
                setSelectedBuyerLot(projected);
              }}
              onNavigateToRequestStock={() => setShowCreateRequest(true)}
              onNavigateToOrders={() => setActiveTab('orders')}
              onSelectOrder={ord => setSelectedBuyerOrder(ord)}
            />
          )}
          {activeTab === 'orders' && (
            <BuyerOrdersListScreen
              user={currentUser}
              onSelectOrder={ord => setSelectedBuyerOrder(ord)}
              onNavigateToCatalogue={() => setShowSearchCatalogue(true)}
            />
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

        {/* Buyer Bottom Tab Bar: Home · Orders · Profile */}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabItemActive: {
    // subtle active indicator
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralLight,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
