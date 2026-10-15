import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { SplashScreen } from '../bootstrap/SplashScreen';
import { LoginScreen } from '../../features/auth/LoginScreen';
import { AdminHandoffScreen } from '../../features/admin-handoff/AdminHandoffScreen';

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

export const RootNavigator: React.FC = () => {
  const { t } = useTranslation();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  if (bootstrapping) {
    return (
      <SplashScreen
        onBootstrapComplete={user => {
          setCurrentUser(user);
          setBootstrapping(false);
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={user => {
          setCurrentUser(user);
          setActiveTab(user.role === UserRole.FIELD_AGENT ? 'tasks' : user.role === UserRole.BUYER ? 'catalogue' : 'home');
        }}
      />
    );
  }

  // 1. Administrator Web Handoff
  if (currentUser.role === UserRole.ADMINISTRATOR) {
    return (
      <AdminHandoffScreen
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  // 2. Supplier Navigation Shell
  if (currentUser.role === UserRole.SUPPLIER) {
    if (showCreateLot) {
      return (
        <SafeAreaView style={styles.safeArea}>
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
      <SafeAreaView style={styles.safeArea}>
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
              onLogout={() => setCurrentUser(null)}
              onResetComplete={() => setActiveTab('home')}
            />
          )}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
            <Ionicons name="home-outline" size={22} color={activeTab === 'home' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('lots')}>
            <Ionicons name="cube-outline" size={22} color={activeTab === 'lots' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'lots' && styles.tabLabelActive]}>Lots</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('orders')}>
            <Ionicons name="cart-outline" size={22} color={activeTab === 'orders' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('notifications')}>
            <Ionicons name="notifications-outline" size={22} color={activeTab === 'notifications' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'notifications' && styles.tabLabelActive]}>Inbox</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
            <Ionicons name="person-outline" size={22} color={activeTab === 'profile' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 3. Field Agent Navigation Shell
  if (currentUser.role === UserRole.FIELD_AGENT) {
    if (activeTask) {
      return (
        <SafeAreaView style={styles.safeArea}>
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
      <SafeAreaView style={styles.safeArea}>
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
              onLogout={() => setCurrentUser(null)}
              onResetComplete={() => setActiveTab('tasks')}
            />
          )}
        </View>

        {/* Agent Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('tasks')}>
            <Ionicons name="clipboard-outline" size={22} color={activeTab === 'tasks' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'tasks' && styles.tabLabelActive]}>Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('queue')}>
            <Ionicons name="cloud-offline-outline" size={22} color={activeTab === 'queue' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'queue' && styles.tabLabelActive]}>Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('notifications')}>
            <Ionicons name="notifications-outline" size={22} color={activeTab === 'notifications' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'notifications' && styles.tabLabelActive]}>Inbox</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
            <Ionicons name="person-outline" size={22} color={activeTab === 'profile' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 4. Buyer Extension Navigation Shell
  if (currentUser.role === UserRole.BUYER) {
    if (showCreateRequest) {
      return (
        <SafeAreaView style={styles.safeArea}>
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
        <SafeAreaView style={styles.safeArea}>
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
        <SafeAreaView style={styles.safeArea}>
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
      <SafeAreaView style={styles.safeArea}>
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
              onLogout={() => setCurrentUser(null)}
              onResetComplete={() => setActiveTab('catalogue')}
            />
          )}
        </View>

        {/* Buyer Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('catalogue')}>
            <Ionicons name="search-outline" size={22} color={activeTab === 'catalogue' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'catalogue' && styles.tabLabelActive]}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('offers')}>
            <Ionicons name="git-pull-request-outline" size={22} color={activeTab === 'offers' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'offers' && styles.tabLabelActive]}>Offers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('orders')}>
            <Ionicons name="cart-outline" size={22} color={activeTab === 'orders' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('notifications')}>
            <Ionicons name="notifications-outline" size={22} color={activeTab === 'notifications' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'notifications' && styles.tabLabelActive]}>Inbox</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
            <Ionicons name="person-outline" size={22} color={activeTab === 'profile' ? colors.primary : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
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
  },
  tabBar: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 54,
  },
  tabLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
