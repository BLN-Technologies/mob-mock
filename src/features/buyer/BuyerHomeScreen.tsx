import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing, shadows } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { warehouseService, orderService } from '../../services/mock/mockServices';
import { User, WarehouseStockGroup, Order } from '../../domain/models';
import { QualityGrade, OrderStatus } from '../../domain/enums';

interface BuyerHomeScreenProps {
  user: User;
  onNavigateToSearch: (initialQuery?: string) => void;
  onSelectStockGroup: (group: WarehouseStockGroup) => void;
  onNavigateToRequestStock: () => void;
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
  onNavigateToRequestStock,
  onNavigateToOrders,
  onSelectOrder,
}) => {
  const { t, language } = useTranslation();
  const [stockGroups, setStockGroups] = useState<WarehouseStockGroup[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');

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

  // Filter stock groups for category chips
  const filteredGroups = stockGroups.filter(g => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'GRAINS') {
      return g.cropName.toLowerCase().includes('maize') || g.cropName.toLowerCase().includes('rice');
    }
    if (selectedCategory === 'LEGUMES') {
      return g.cropName.toLowerCase().includes('bean') || g.cropName.toLowerCase().includes('soy');
    }
    if (selectedCategory === 'ROOTS') {
      return g.cropName.toLowerCase().includes('potato') || g.cropName.toLowerCase().includes('cassava');
    }
    return true;
  });

  const totalWarehouseKg = stockGroups.reduce((acc, g) => acc + g.availableToOrderKg, 0);

  const getCropImage = (group: WarehouseStockGroup) => {
    if (group.photos && group.photos.length > 0) return group.photos[0];
    const key = group.cropName.trim().toLowerCase();
    return CROP_FALLBACK_IMAGES[key] || CROP_FALLBACK_IMAGES.maize;
  };

  const getGradeBadgeStyle = (grade: QualityGrade) => {
    if (grade === QualityGrade.GRADE_A) return { bg: '#EAF2EC', text: '#174A35', label: 'Grade A' };
    if (grade === QualityGrade.GRADE_B) return { bg: '#FEF3C7', text: '#A96812', label: 'Grade B' };
    return { bg: '#F1F5F9', text: '#64748B', label: 'Grade C' };
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#174A35']} />
        }
      >
        {/* Header Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {language === 'rw' ? 'Muraho, ' : 'Welcome, '}
              <Text style={styles.userName}>{user.fullName.split(' ')[0]}</Text>
            </Text>
            <Text style={styles.subGreeting}>
              {language === 'rw'
                ? 'Ububiko Bukuru bwa Cargo Rwanda'
                : 'Cargo Central Warehouse Exchange'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.requestStockPill}
            onPress={onNavigateToRequestStock}
            activeOpacity={0.8}
            accessibilityLabel="Request Stock"
          >
            <Ionicons name="add-circle" size={15} color="#174A35" />
            <Text style={styles.requestStockPillText}>
              {language === 'rw' ? 'Gusaba Umusaruro' : 'Request stock'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar - opens dedicated discovery */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => onNavigateToSearch(searchInputValue)}
          activeOpacity={0.9}
        >
          <Ionicons name="search" size={18} color="#66716A" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInputText}
            placeholder={
              language === 'rw'
                ? 'Shakisha ibigori, ibishyimbo, ibirayi...'
                : 'Search agricultural stock, grades, varieties...'
            }
            placeholderTextColor="#94A3B8"
            value={searchInputValue}
            onChangeText={setSearchInputValue}
            onSubmitEditing={() => onNavigateToSearch(searchInputValue)}
          />
          <TouchableOpacity
            style={styles.filterIconBtn}
            onPress={() => onNavigateToSearch(searchInputValue)}
          >
            <Ionicons name="options-outline" size={16} color="#174A35" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Central Warehouse Highlights Banner */}
        <View style={styles.warehouseHighlightCard}>
          <View style={styles.highlightLeft}>
            <View style={styles.highlightBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.highlightBadgeText}>CENTRAL WAREHOUSE</Text>
            </View>
            <Text style={styles.highlightNumber}>
              {totalWarehouseKg.toLocaleString()} kg
            </Text>
            <Text style={styles.highlightLabel}>
              {language === 'rw'
                ? 'Umusaruro wemejwe uhari'
                : 'Aggregated Available Stock (Verified)'}
            </Text>
          </View>

          <View style={styles.highlightRight}>
            <View style={styles.shieldWrap}>
              <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.escrowNote}>Escrow Protected</Text>
          </View>
        </View>

        {/* Category Quick Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesRow}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          {[
            { id: 'ALL', label: language === 'rw' ? 'Byose' : 'All Produce' },
            { id: 'GRAINS', label: language === 'rw' ? 'Ibinyampeke' : 'Grains (Maize/Rice)' },
            { id: 'LEGUMES', label: language === 'rw' ? 'Ibinyamisogwe' : 'Legumes (Beans/Soy)' },
            { id: 'ROOTS', label: language === 'rw' ? 'Ibinyarubuto' : 'Roots (Potatoes)' },
          ].map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Curated Product Cards Carousel */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>
              {language === 'rw' ? 'Umusaruro Uri mu Bubiko' : 'Available Warehouse Stock'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {language === 'rw'
                ? 'Kanda kuri buri kintu ngo utumize'
                : 'Curated lots aggregated across verified suppliers'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onNavigateToSearch()}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>
              {language === 'rw' ? 'Reba byose' : 'View all'} ({filteredGroups.length})
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#174A35" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Carousel showing approximately 3 polished stock cards with swipe support */}
        {filteredGroups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyText}>
              {language === 'rw'
                ? 'Nta musaruro uraboneka muri iki cyiciro.'
                : 'No approved warehouse stock currently in this category.'}
            </Text>
            <TouchableOpacity style={styles.requestStockMiniBtn} onPress={onNavigateToRequestStock}>
              <Text style={styles.requestStockMiniText}>Request stock</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={248}
            decelerationRate="fast"
          >
            {filteredGroups.map(group => {
              const badge = getGradeBadgeStyle(group.grade);
              const imgUri = getCropImage(group);

              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.productCard}
                  onPress={() => onSelectStockGroup(group)}
                  activeOpacity={0.85}
                  accessibilityLabel={`${group.cropName} ${badge.label}`}
                >
                  <View style={styles.cardImageWrap}>
                    <Image source={{ uri: imgUri }} style={styles.cardImage} resizeMode="cover" />
                    <View style={[styles.gradeTag, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.gradeTagText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                    <View style={styles.coopCountTag}>
                      <Ionicons name="people" size={11} color="#FFFFFF" />
                      <Text style={styles.coopCountText}>
                        {group.contributingLotsCount} {group.contributingLotsCount === 1 ? 'coop' : 'coops'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cropTitle} numberOfLines={1}>
                      {group.cropName}
                    </Text>
                    <Text style={styles.varietySubtitle} numberOfLines={1}>
                      {group.variety || 'Standard Bulk'} · {group.cropType === 'PERISHABLE' ? 'Perishable' : 'Non-perishable'}
                    </Text>

                    <View style={styles.quantityPriceRow}>
                      <View>
                        <Text style={styles.quantityLabel}>Available to Order</Text>
                        <Text style={styles.quantityValue}>
                          {group.availableToOrderKg.toLocaleString()} kg
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.priceLabel}>Price</Text>
                        <Text style={styles.priceValue}>
                          {group.pricePerKgRwf.toLocaleString()} RWF<Text style={styles.unitText}>/kg</Text>
                        </Text>
                      </View>
                    </View>

                    <View style={styles.locationFooter}>
                      <Ionicons name="location-outline" size={13} color="#66716A" />
                      <Text style={styles.locationFooterText} numberOfLines={1}>
                        {group.hubLocation}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Concise Sourcing Request Callout */}
        <View style={styles.requestStockCard}>
          <View style={styles.requestStockTextWrap}>
            <Text style={styles.requestStockTitle}>
              {language === 'rw' ? 'Ntubona ingano ukeneye?' : 'Need custom volume?'}
            </Text>
            <Text style={styles.requestStockDesc}>
              {language === 'rw'
                ? 'Ohereza ubusabe bwo gushakirwa umusaruro wihariye.'
                : 'Post a sourcing request for specific quantities or crops.'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.requestStockActionBtn}
            onPress={onNavigateToRequestStock}
            activeOpacity={0.8}
          >
            <Text style={styles.requestStockActionText}>Request stock</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Active Orders Section */}
        {recentOrders.length > 0 && (
          <View style={styles.ordersSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  {language === 'rw' ? 'Ibyo Utumije Bya Hafi' : 'Recent Orders'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {language === 'rw' ? 'Amaposho n\'ibiri mu nzira' : 'Track ongoing delivery and settlement'}
                </Text>
              </View>
              <TouchableOpacity onPress={onNavigateToOrders} style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>
                  {language === 'rw' ? 'Byose' : 'View all'} ({recentOrders.length})
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#174A35" />
              </TouchableOpacity>
            </View>

            {recentOrders.slice(0, 2).map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => onSelectOrder(order)}
                activeOpacity={0.85}
              >
                <View style={styles.orderCardTop}>
                  <View>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.orderCrop}>
                      {order.cropName} · {order.totalQuantityKg.toLocaleString()} kg
                    </Text>
                  </View>
                  <View style={styles.orderStatusBadge}>
                    <Text style={styles.orderStatusText}>{order.status}</Text>
                  </View>
                </View>
                <View style={styles.orderCardBottom}>
                  <Text style={styles.orderTotal}>
                    {order.totalAmountRwf.toLocaleString()} RWF
                  </Text>
                  <Text style={styles.orderDate}>{order.agreedDeliveryDate}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  greeting: {
    fontSize: 18,
    color: '#202822',
    fontWeight: '500',
  },
  userName: {
    fontWeight: '800',
    color: '#174A35',
  },
  subGreeting: {
    fontSize: 12,
    color: '#66716A',
    marginTop: 2,
  },
  requestStockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF2EC',
    borderWidth: 1,
    borderColor: '#DCE4DD',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  requestStockPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#174A35',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4DD',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    ...shadows.sm,
  },
  searchInputText: {
    flex: 1,
    fontSize: 13,
    color: '#202822',
    paddingVertical: 4,
  },
  filterIconBtn: {
    padding: 4,
    backgroundColor: '#EAF2EC',
    borderRadius: 6,
  },
  warehouseHighlightCard: {
    backgroundColor: '#103B2B',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.md,
  },
  highlightLeft: {
    flex: 1,
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3FA379',
  },
  highlightBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EAF2EC',
    letterSpacing: 0.5,
  },
  highlightNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F7F8F5',
    letterSpacing: -0.5,
  },
  highlightLabel: {
    fontSize: 12,
    color: '#DCE4DD',
    marginTop: 2,
  },
  highlightRight: {
    alignItems: 'center',
    marginLeft: 12,
  },
  shieldWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2F6B4F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  escrowNote: {
    fontSize: 10,
    color: '#DCE4DD',
    fontWeight: '600',
  },
  categoriesRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4DD',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#174A35',
    borderColor: '#174A35',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#66716A',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#202822',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#66716A',
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#174A35',
  },
  carousel: {
    marginBottom: 20,
  },
  carouselContent: {
    gap: 14,
    paddingRight: 16,
  },
  productCard: {
    width: 236,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCE4DD',
    ...shadows.sm,
  },
  cardImageWrap: {
    height: 120,
    width: '100%',
    position: 'relative',
    backgroundColor: '#EAF2EC',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradeTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  gradeTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  coopCountTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(23, 74, 53, 0.85)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coopCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 12,
  },
  cropTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#202822',
  },
  varietySubtitle: {
    fontSize: 11,
    color: '#66716A',
    marginTop: 1,
  },
  quantityPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quantityLabel: {
    fontSize: 10,
    color: '#66716A',
  },
  quantityValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#174A35',
  },
  priceLabel: {
    fontSize: 10,
    color: '#66716A',
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#202822',
  },
  unitText: {
    fontSize: 10,
    fontWeight: '400',
    color: '#66716A',
  },
  locationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  locationFooterText: {
    fontSize: 11,
    color: '#66716A',
    flex: 1,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE4DD',
    marginBottom: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#66716A',
    textAlign: 'center',
  },
  requestStockMiniBtn: {
    backgroundColor: '#174A35',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  requestStockMiniText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  requestStockCard: {
    backgroundColor: '#EAF2EC',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DCE4DD',
  },
  requestStockTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  requestStockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#174A35',
  },
  requestStockDesc: {
    fontSize: 11,
    color: '#66716A',
    marginTop: 2,
    lineHeight: 15,
  },
  requestStockActionBtn: {
    backgroundColor: '#174A35',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  requestStockActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ordersSection: {
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCE4DD',
    marginBottom: 10,
    gap: 8,
    ...shadows.sm,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202822',
  },
  orderCrop: {
    fontSize: 12,
    color: '#66716A',
    marginTop: 2,
  },
  orderStatusBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A96812',
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  orderTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#174A35',
  },
  orderDate: {
    fontSize: 11,
    color: '#66716A',
  },
});
