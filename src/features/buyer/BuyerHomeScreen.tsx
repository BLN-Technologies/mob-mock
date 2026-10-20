import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, typography, spacing, shadows } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n';
import { warehouseService, orderService } from '../../services/mock/mockServices';
import { User, WarehouseStockGroup, Order } from '../../domain/models';
import { QualityGrade } from '../../domain/enums';

interface BuyerHomeScreenProps {
  user: User;
  onNavigateToSearch?: (initialQuery?: string) => void;
  onSelectStockGroup: (group: WarehouseStockGroup) => void;
  onNavigateToRequestStock?: () => void;
  onNavigateToOrders: () => void;
  onSelectOrder: (order: Order) => void;
}

const CROP_FALLBACK_IMAGES: Record<string, string> = {
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600',
  beans: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
  'dry beans': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
  potatoes: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600',
  'irish potatoes': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600',
  soybeans: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
  tomatoes: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
  coffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
};

export const BuyerHomeScreen: React.FC<BuyerHomeScreenProps> = ({
  user,
  onNavigateToSearch,
  onSelectStockGroup,
  onNavigateToOrders,
  onSelectOrder,
}) => {
  const { language } = useTranslation();
  const { colors: tc } = useTheme();
  const [stockGroups, setStockGroups] = useState<WarehouseStockGroup[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [stocks, orders] = await Promise.all([
        warehouseService.getAggregatedStock(),
        orderService.getOrders(user),
      ]);
      setStockGroups(stocks);
      setRecentOrders(orders);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCropImage = (group: WarehouseStockGroup) => {
    if (group.photos && group.photos.length > 0) return group.photos[0];
    const key = group.cropName.trim().toLowerCase();
    return CROP_FALLBACK_IMAGES[key] || CROP_FALLBACK_IMAGES.maize;
  };

  const getGradeBadge = (grade: QualityGrade) => {
    if (grade === QualityGrade.GRADE_A) {
      return {
        bg: '#EAF2EC',
        text: '#174A35',
        label: language === 'rw' ? 'Icyiciro A' : 'Grade A',
      };
    }
    if (grade === QualityGrade.GRADE_B) {
      return {
        bg: '#FEF3C7',
        text: '#A96812',
        label: language === 'rw' ? 'Icyiciro B' : 'Grade B',
      };
    }
    return {
      bg: '#F1F5F9',
      text: '#64748B',
      label: language === 'rw' ? 'Icyiciro C' : 'Grade C',
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[tc.primary]}
            tintColor={tc.primary}
          />
        }
      >
        {/* Buyer Hero Greeting Section */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.greetingHeaderRow}>
              <Text style={[styles.greeting, { color: tc.neutralHeadings }]}>
                {language === 'rw' ? 'Muraho, ' : 'Welcome, '}
                <Text style={[styles.userName, { color: tc.primary }]}>
                  {user.fullName.split(' ')[0]} 👋
                </Text>
              </Text>
              <View style={[styles.verifiedBuyerBadge, { backgroundColor: tc.surfaceSubtle }]}>
                <Ionicons name="shield-checkmark" size={12} color={tc.primary} />
                <Text style={[styles.verifiedBuyerText, { color: tc.primary }]}>
                  {language === 'rw' ? 'Wemejwe' : 'Verified'}
                </Text>
              </View>
            </View>

            <Text style={[styles.subGreeting, { color: tc.neutralGray }]}>
              {language === 'rw'
                ? 'Isoko ry\'ubuhinzi bwizewe mu Rwanda'
                : 'Direct verified agricultural inventory from Rwanda co-ops'}
            </Text>

            {/* Clean compact 1-word trust chips */}
            <View style={styles.compactTrustRow}>
              <View style={[styles.trustChip, { backgroundColor: tc.surfaceSubtle, borderColor: tc.borderLight }]}>
                <Ionicons name="checkmark-circle" size={12} color={tc.primary} />
                <Text style={[styles.trustChipText, { color: tc.primary }]}>
                  {language === 'rw' ? 'Ubuziranenge' : 'Quality'}
                </Text>
              </View>
              <View style={[styles.trustChip, { backgroundColor: tc.surfaceSubtle, borderColor: tc.borderLight }]}>
                <Ionicons name="storefront-outline" size={12} color={tc.primary} />
                <Text style={[styles.trustChipText, { color: tc.primary }]}>
                  {language === 'rw' ? 'Ububiko' : 'Warehouse'}
                </Text>
              </View>
              <View style={[styles.trustChip, { backgroundColor: tc.surfaceSubtle, borderColor: tc.borderLight }]}>
                <Ionicons name="flash-outline" size={12} color={tc.brandGold} />
                <Text style={[styles.trustChipText, { color: tc.brandGold }]}>
                  {language === 'rw' ? 'Byihuse' : 'Direct'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Featured Stock Section: Swipe right carousel with See All -> Explore */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: tc.neutralHeadings }]}>
              {language === 'rw' ? 'Umusaruro Watoranyijwe' : 'Featured Warehouse Stock'}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: tc.neutralGray }]}>
              {language === 'rw'
                ? 'Zunguza iburyo urebe ibihari · Kanda Vumbura Byose ujye mu isoko ryuzuye'
                : 'Swipe right to browse · Click Explore All to view full catalogue'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onNavigateToSearch?.()}
            style={[styles.seeAllActionBtn, { backgroundColor: tc.surfaceSubtle }]}
            activeOpacity={0.75}
            accessibilityLabel="Explore All Featured Produce"
          >
            <Text style={[styles.seeAllActionText, { color: tc.primary }]}>
              {language === 'rw' ? 'Vumbura Byose' : 'Explore All'}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={tc.primary} />
          </TouchableOpacity>
        </View>

        {stockGroups.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: tc.surface, borderColor: tc.borderLight }]}>
            <Ionicons name="cube-outline" size={36} color={tc.neutralGray} />
            <Text style={[styles.emptyTitle, { color: tc.neutralHeadings }]}>
              {language === 'rw' ? 'Nta musaruro uraboneka' : 'No warehouse stock listed yet'}
            </Text>
            <Text style={[styles.emptyText, { color: tc.neutralGray }]}>
              {language === 'rw'
                ? 'Ibicuruzwa bishya bizaboneka vuba aha.'
                : 'New verified harvests will appear here once inspected.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredSwipeContent}
            snapToInterval={272}
            decelerationRate="fast"
          >
            {stockGroups.map(group => {
              const badge = getGradeBadge(group.grade);
              const imgUri = getCropImage(group);

              return (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.featuredCard,
                    {
                      backgroundColor: tc.surfaceCard,
                      borderColor: tc.borderLight,
                    },
                  ]}
                  onPress={() => onSelectStockGroup(group)}
                  activeOpacity={0.88}
                  accessibilityLabel={`${group.cropName} ${group.grade}`}
                >
                  {/* Card Image Banner */}
                  <View style={styles.cardImageContainer}>
                    <Image source={{ uri: imgUri }} style={styles.cardImage} resizeMode="cover" />
                    <View style={[styles.gradeBadgeFloating, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.gradeBadgeText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                    <View style={styles.hubBadgeFloating}>
                      <Ionicons name="location" size={11} color="#FFFFFF" />
                      <Text style={styles.hubBadgeText} numberOfLines={1}>
                        {group.hubLocation}
                      </Text>
                    </View>
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.cropTitle, { color: tc.neutralHeadings }]} numberOfLines={1}>
                        {group.cropName}
                      </Text>
                      <View style={[styles.coopPill, { backgroundColor: tc.surfaceSubtle }]}>
                        <Ionicons name="people-outline" size={11} color={tc.primary} />
                        <Text style={[styles.coopPillText, { color: tc.primary }]}>
                          {group.contributingLotsCount} {group.contributingLotsCount === 1 ? 'co-op' : 'co-ops'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.varietyText, { color: tc.neutralGray }]} numberOfLines={1}>
                      {group.variety || 'Bulk Standard'} · {group.cropType === 'PERISHABLE' ? 'Fresh' : 'Dry Storage'}
                    </Text>

                    {/* Volume & Price */}
                    <View style={[styles.metricRow, { backgroundColor: tc.surfaceSubtle }]}>
                      <View style={styles.metricCol}>
                        <Text style={[styles.metricLabel, { color: tc.neutralGray }]}>
                          {language === 'rw' ? 'Ingano Ihari' : 'Available'}
                        </Text>
                        <Text style={[styles.metricVal, { color: tc.neutralHeadings }]}>
                          {group.availableToOrderKg.toLocaleString()} kg
                        </Text>
                      </View>

                      <View style={[styles.metricColDivider, { backgroundColor: tc.borderLight }]} />

                      <View style={styles.metricCol}>
                        <Text style={[styles.metricLabel, { color: tc.neutralGray }]}>
                          {language === 'rw' ? 'Igiciro / kg' : 'Price / kg'}
                        </Text>
                        <Text style={[styles.priceVal, { color: tc.primary }]}>
                          {group.pricePerKgRwf.toLocaleString()} <Text style={styles.unitVal}>RWF</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Order Action Button */}
                    <View style={[styles.orderActionBtn, { backgroundColor: tc.primary }]}>
                      <Text style={styles.orderActionBtnText}>
                        {language === 'rw' ? 'Reba & Tumiza' : 'View & Order'}
                      </Text>
                      <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Explore Full Catalogue Banner (Links to Explore) */}
        <TouchableOpacity
          style={[styles.exploreBanner, { backgroundColor: tc.surface, borderColor: tc.borderLight }]}
          onPress={() => onNavigateToSearch?.()}
          activeOpacity={0.85}
        >
          <View style={[styles.exploreIconWrap, { backgroundColor: tc.surfaceSubtle }]}>
            <Ionicons name="compass-outline" size={24} color={tc.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.exploreTitle, { color: tc.neutralHeadings }]}>
              {language === 'rw' ? 'Vumbura ibindi mu Isoko ryose' : 'Explore Full Produce Marketplace'}
            </Text>
            <Text style={[styles.exploreSubtitle, { color: tc.neutralGray }]}>
              {language === 'rw'
                ? 'Reba ibinyampeke, ibinyamisogwe, ibirayi n\'ibindi byose biri mu bubiko bwizewe'
                : 'Browse all grains, legumes, roots, and verified co-op lots'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={tc.primary} />
        </TouchableOpacity>

        {/* Recent Active Orders Section */}
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: tc.neutralHeadings }]}>
                {language === 'rw' ? 'Ibyatumijwe Bya Hafi' : 'Recent Orders'}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: tc.neutralGray }]}>
                {language === 'rw' ? 'Ibyatumijwe n\'ibiri mu nzira yo kugezwaho' : 'Track your ongoing orders and delivery status'}
              </Text>
            </View>
            {recentOrders.length > 0 && (
              <TouchableOpacity onPress={onNavigateToOrders} style={styles.seeAllActionBtn}>
                <Text style={[styles.seeAllActionText, { color: tc.primary }]}>
                  {language === 'rw' ? 'Byose' : 'View all'} ({recentOrders.length})
                </Text>
                <Ionicons name="chevron-forward" size={14} color={tc.primary} />
              </TouchableOpacity>
            )}
          </View>

          {recentOrders.length === 0 ? (
            <View style={[styles.emptyOrdersCard, { backgroundColor: tc.surface, borderColor: tc.borderLight }]}>
              <Ionicons name="receipt-outline" size={32} color={tc.neutralGray} />
              <Text style={[styles.emptyOrdersTitle, { color: tc.neutralHeadings }]}>
                {language === 'rw' ? 'Nta komande urakora' : 'No orders placed yet'}
              </Text>
              <Text style={[styles.emptyOrdersText, { color: tc.neutralGray }]}>
                {language === 'rw'
                  ? 'Hitamo mu musaruro watoranyijwe hejuru maze utumize bwa mbere mu buryo bwizewe bwa Escrow.'
                  : 'Select an available crop from the featured stock above to place your first order.'}
              </Text>
            </View>
          ) : (
            recentOrders.slice(0, 3).map(order => (
              <TouchableOpacity
                key={order.id}
                style={[
                  styles.orderCard,
                  {
                    backgroundColor: tc.surfaceCard,
                    borderColor: tc.borderLight,
                  },
                ]}
                onPress={() => onSelectOrder(order)}
                activeOpacity={0.85}
              >
                <View style={styles.orderCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.orderNumber, { color: tc.neutralHeadings }]}>
                      {order.orderNumber}
                    </Text>
                    <Text style={[styles.orderCrop, { color: tc.neutralGray }]}>
                      {order.cropName} · {order.totalQuantityKg.toLocaleString()} kg
                    </Text>
                  </View>
                  <View style={[styles.orderStatusBadge, { backgroundColor: tc.surfaceSubtle }]}>
                    <Text style={[styles.orderStatusText, { color: tc.primary }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>

                <View style={[styles.orderCardDivider, { backgroundColor: tc.borderLight }]} />

                <View style={styles.orderCardBottom}>
                  <View style={styles.orderLocationRow}>
                    <Ionicons name="calendar-outline" size={13} color={tc.neutralGray} />
                    <Text style={[styles.orderDate, { color: tc.neutralGray }]}>
                      Delivery: {order.agreedDeliveryDate}
                    </Text>
                  </View>
                  <Text style={[styles.orderTotal, { color: tc.primary }]}>
                    {order.totalAmountRwf.toLocaleString()} RWF
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl + 20,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greetingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  verifiedBuyerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  verifiedBuyerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  greeting: {
    ...typography.h2,
    fontSize: 22,
    fontWeight: '800',
  },
  userName: {
    fontWeight: '800',
  },
  subGreeting: {
    ...typography.small,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 18,
  },
  compactTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  trustChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  seeAllActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  seeAllActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  featuredSwipeContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    gap: 12,
  },
  featuredCard: {
    width: 260,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardImageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradeBadgeFloating: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  gradeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  hubBadgeFloating: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  hubBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 100,
  },
  cardBody: {
    padding: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  coopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  coopPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  varietyText: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  metricCol: {
    flex: 1,
  },
  metricColDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  priceVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  unitVal: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: radii.full,
  },
  orderActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  exploreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.subtle,
  },
  exploreIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  exploreSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  ordersSection: {
    marginTop: spacing.xl,
  },
  emptyOrdersCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  emptyOrdersTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyOrdersText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  orderCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: 10,
    ...shadows.subtle,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderCrop: {
    fontSize: 12,
    marginTop: 2,
  },
  orderStatusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderCardDivider: {
    height: 1,
    marginVertical: 8,
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '800',
  },
  orderDate: {
    fontSize: 12,
  },
});
