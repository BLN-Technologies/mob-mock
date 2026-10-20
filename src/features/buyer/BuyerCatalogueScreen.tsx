import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CropBadge } from '../../components/ui/CropBadge';
import { Button } from '../../components/ui/Button';
import { SafeImage } from '../../components/ui/SafeImage';
import { EmptyState } from '../../components/feedback/EmptyState';
import { lotService } from '../../services/mock/mockServices';
import { formatRwf, formatQuantity } from '../../domain/calculations/lotCalculations';
import { BuyerLotProjection } from '../../domain/models';

interface BuyerCatalogueScreenProps {
  onNavigateToCreateRequest?: () => void;
  onSelectLot: (lot: BuyerLotProjection) => void;
}

export const BuyerCatalogueScreen: React.FC<BuyerCatalogueScreenProps> = ({
  onNavigateToCreateRequest,
  onSelectLot,
}) => {
  const { t } = useTranslation();
  const { colors: tc, isDark } = useTheme();
  const [lots, setLots] = useState<BuyerLotProjection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Temporary filter modal draft states
  const [modalGrade, setModalGrade] = useState('ALL');
  const [modalDistrict, setModalDistrict] = useState('ALL');
  const [modalSort, setModalSort] = useState('NEWEST');

  const categories = useMemo(
    () => [
      { key: 'ALL', label: t.buyer.categoryAll, icon: 'apps-outline' as const },
      { key: 'GRAINS', label: t.buyer.categoryGrains, icon: 'nutrition-outline' as const },
      { key: 'LEGUMES', label: t.buyer.categoryLegumes, icon: 'radio-button-on' as const },
      { key: 'ROOTS', label: t.buyer.categoryRoots, icon: 'cube-outline' as const },
      { key: 'VEGETABLES', label: t.buyer.categoryVegetables, icon: 'flame-outline' as const },
      { key: 'FRUITS', label: t.buyer.categoryFruits, icon: 'leaf-outline' as const },
      { key: 'CASH_CROPS', label: t.buyer.categoryCashCrops, icon: 'cafe-outline' as const },
    ],
    [t]
  );

  const districts = ['ALL', 'Nyagatare', 'Huye', 'Musanze', 'Bugesera', 'Kirehe', 'Rwamagana'];
  const grades = [
    { key: 'ALL', label: t.buyer.gradeAll },
    { key: 'GRADE_A', label: t.statuses.GRADE_A },
    { key: 'GRADE_B', label: t.statuses.GRADE_B },
  ];
  const sortOptions = [
    { key: 'NEWEST', label: t.buyer.sortNewest },
    { key: 'PRICE_ASC', label: t.buyer.sortPriceAsc },
    { key: 'PRICE_DESC', label: t.buyer.sortPriceDesc },
    { key: 'QTY_DESC', label: t.buyer.sortQtyDesc },
  ];

  const loadCatalogue = async () => {
    const fetched = await lotService.getBuyerCatalogue(
      'All',
      selectedGrade,
      selectedDistrict,
      searchQuery,
      selectedCategory,
      sortBy
    );
    setLots(fetched);
  };

  useEffect(() => {
    loadCatalogue();
  }, [selectedCategory, selectedGrade, selectedDistrict, searchQuery, sortBy]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCatalogue();
    setRefreshing(false);
  };

  const openFilterModal = () => {
    setModalGrade(selectedGrade);
    setModalDistrict(selectedDistrict);
    setModalSort(sortBy);
    setIsFilterModalOpen(true);
  };

  const applyModalFilters = () => {
    setSelectedGrade(modalGrade);
    setSelectedDistrict(modalDistrict);
    setSortBy(modalSort);
    setIsFilterModalOpen(false);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedGrade('ALL');
    setSelectedDistrict('ALL');
    setSortBy('NEWEST');
    setModalGrade('ALL');
    setModalDistrict('ALL');
    setModalSort('NEWEST');
  };

  const activeFilterCount =
    (selectedGrade !== 'ALL' ? 1 : 0) +
    (selectedDistrict !== 'ALL' ? 1 : 0) +
    (sortBy !== 'NEWEST' ? 1 : 0);

  // Featured lots: high-volume Grade A lots (shown when no search query is active)
  const featuredLots = useMemo(() => {
    if (searchQuery.trim().length > 0) return [];
    return lots.filter(l => l.grade === 'GRADE_A' && l.availableQuantityKg >= 8000).slice(0, 4);
  }, [lots, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      {/* 1. Marketplace Header */}
      <View style={[styles.header, { backgroundColor: tc.surface, borderBottomColor: tc.borderLight }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitles}>
            <View style={styles.headerTagRow}>
              <View style={[styles.liveIndicatorDot, { backgroundColor: tc.primary }]} />
              <Text style={[styles.headerTagText, { color: tc.primary }]}>{t.buyer.verifiedBadge}</Text>
            </View>
            <Text style={[styles.title, { color: tc.neutralHeadings }]}>{t.buyer.discoverTitle}</Text>
            <Text style={[styles.subtitle, { color: tc.neutralGray }]} numberOfLines={2}>
              {t.buyer.discoverSubtitle}
            </Text>
          </View>
        </View>

        {/* 2. Interactive Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: tc.surfaceSubtle, borderColor: tc.borderLight }]}>
          <Ionicons name="search" size={18} color={tc.neutralGray} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t.buyer.searchPlaceholder}
            placeholderTextColor={tc.neutralGray}
            style={[styles.searchInput, { color: tc.neutralDark }]}
            returnKeyType="search"
            accessibilityLabel={t.buyer.searchPlaceholder}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t.buyer.resetSearch}
            >
              <Ionicons name="close-circle" size={18} color={colors.neutralGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Horizontal Category Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
          style={styles.categoryScroll}
        >
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setSelectedCategory(cat.key)}
                activeOpacity={0.75}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? tc.primary : tc.surfaceSubtle,
                    borderColor: isSelected ? tc.primary : tc.borderLight,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : tc.neutralHeadings}
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: isSelected ? '#FFFFFF' : tc.neutralHeadings,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Filter & Controls Bar */}
      <View style={[styles.controlsBar, { backgroundColor: tc.surface, borderBottomColor: tc.borderLight }]}>
        <View style={styles.controlsLeft}>
          <TouchableOpacity
            style={[
              styles.filterTrigger,
              {
                backgroundColor: activeFilterCount > 0 ? tc.primary : tc.surfaceSubtle,
                borderColor: activeFilterCount > 0 ? tc.primary : tc.borderLight,
              },
            ]}
            onPress={openFilterModal}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t.buyer.filterButton}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={activeFilterCount > 0 ? '#FFFFFF' : tc.neutralHeadings}
            />
            <Text
              style={[
                styles.filterTriggerText,
                { color: activeFilterCount > 0 ? '#FFFFFF' : tc.neutralHeadings },
              ]}
            >
              {t.buyer.filterButton}
            </Text>
            {activeFilterCount > 0 && (
              <View style={[styles.activeFilterBadge, { backgroundColor: '#FFFFFF' }]}>
                <Text style={[styles.activeFilterBadgeText, { color: tc.primary }]}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.resultsCountText, { color: tc.neutralGray }]}>
            {lots.length} {t.buyer.resultsCount}
          </Text>
        </View>

        {/* View Mode Toggle (List vs Grid) */}
        <View style={[styles.viewToggleGroup, { backgroundColor: tc.surfaceSubtle, borderColor: tc.borderLight }]}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'list' && { backgroundColor: tc.surfaceCard }]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t.buyer.viewList}
          >
            <Ionicons
              name="list"
              size={16}
              color={viewMode === 'list' ? tc.primary : tc.neutralGray}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'grid' && { backgroundColor: tc.surfaceCard }]}
            onPress={() => setViewMode('grid')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t.buyer.viewGrid}
          >
            <Ionicons
              name="grid"
              size={16}
              color={viewMode === 'grid' ? tc.primary : tc.neutralGray}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Active Filter Badges */}
      {(selectedGrade !== 'ALL' || selectedDistrict !== 'ALL' || selectedCategory !== 'ALL' || searchQuery.length > 0) && (
        <View style={styles.activeFiltersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedCategory !== 'ALL' && (
              <View style={styles.activeFilterPill}>
                <Text style={styles.activeFilterPillText}>
                  {categories.find(c => c.key === selectedCategory)?.label}
                </Text>
                <TouchableOpacity onPress={() => setSelectedCategory('ALL')}>
                  <Ionicons name="close" size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            {selectedGrade !== 'ALL' && (
              <View style={styles.activeFilterPill}>
                <Text style={styles.activeFilterPillText}>{selectedGrade}</Text>
                <TouchableOpacity onPress={() => setSelectedGrade('ALL')}>
                  <Ionicons name="close" size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            {selectedDistrict !== 'ALL' && (
              <View style={styles.activeFilterPill}>
                <Text style={styles.activeFilterPillText}>{selectedDistrict}</Text>
                <TouchableOpacity onPress={() => setSelectedDistrict('ALL')}>
                  <Ionicons name="close" size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={resetAllFilters} style={styles.clearAllLink}>
              <Text style={styles.clearAllLinkText}>{t.buyer.resetFilters}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 6. Product Catalogue Scrollable Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Featured Sourcing Section (when relevant) */}
        {featuredLots.length > 0 && selectedCategory === 'ALL' && selectedGrade === 'ALL' && (
          <View style={styles.featuredSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>{t.buyer.featuredLots}</Text>
                <Text style={styles.sectionSubtitle}>{t.buyer.featuredSubtitle}</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
              {featuredLots.map(item => (
                <TouchableOpacity
                  key={`feat-${item.id}`}
                  style={styles.featuredCard}
                  onPress={() => onSelectLot(item)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <SafeImage
                    uri={item.photos[0]}
                    cropName={item.cropName}
                    style={styles.featuredImage}
                  />
                  <View style={styles.featuredBadgeOverlay}>
                    <StatusBadge status={item.grade} size="small" />
                  </View>
                  <View style={styles.featuredCardBody}>
                    <Text style={styles.featuredCropName} numberOfLines={1}>
                      {item.cropName}
                    </Text>
                    <Text style={styles.featuredVariety} numberOfLines={1}>
                      {item.variety || 'Standard Bulk'}
                    </Text>
                    <View style={styles.featuredMetaRow}>
                      <View style={styles.locationSmallWrap}>
                        <Ionicons name="location-outline" size={12} color={colors.neutralGray} />
                        <Text style={styles.featuredLocationText}>{item.district}</Text>
                      </View>
                      <Text style={styles.featuredVolumeText}>
                        {formatQuantity(item.availableQuantityKg)}
                      </Text>
                    </View>
                    <View style={styles.featuredPriceRow}>
                      <Text style={styles.featuredPriceText}>
                        {formatRwf(item.pricePerKgRwf)}
                        <Text style={styles.pricePerKgSub}>{t.buyer.perKg}</Text>
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Produce List / Grid */}
        <View style={styles.catalogSection}>
          {featuredLots.length > 0 && (
            <View style={styles.catalogSectionHeader}>
              <Text style={styles.sectionTitle}>{t.buyer.allLots}</Text>
            </View>
          )}

          {lots.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title={t.buyer.noResultsTitle}
              description={t.buyer.noResultsDesc}
              actionTitle={t.buyer.postRequest}
              onActionPress={onNavigateToCreateRequest}
            />
          ) : viewMode === 'grid' ? (
            /* 2-Column Responsive Grid View */
            <View style={styles.gridContainer}>
              {lots.map(lot => (
                <TouchableOpacity
                  key={lot.id}
                  style={styles.gridCard}
                  onPress={() => onSelectLot(lot)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <View style={styles.gridImageWrap}>
                    <SafeImage
                      uri={lot.photos[0]}
                      cropName={lot.cropName}
                      style={styles.gridImage}
                    />
                    <View style={styles.gridBadgeOverlay}>
                      <StatusBadge status={lot.grade} size="small" />
                    </View>
                    {lot.photos.length > 1 && (
                      <View style={styles.photoCountBadge}>
                        <Ionicons name="images-outline" size={11} color="#FFFFFF" />
                        <Text style={styles.photoCountText}>{lot.photos.length}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.gridCardBody}>
                    <Text style={styles.gridCropTitle} numberOfLines={1}>
                      {lot.cropName}
                    </Text>
                    <Text style={styles.gridVariety} numberOfLines={1}>
                      {lot.variety || 'Bulk Sourcing'}
                    </Text>

                    <View style={styles.gridMetaRow}>
                      <Ionicons name="location-outline" size={12} color={colors.neutralGray} />
                      <Text style={styles.gridLocationText} numberOfLines={1}>
                        {lot.district}
                      </Text>
                    </View>

                    <View style={styles.gridDivider} />

                    <View style={styles.gridQuantityRow}>
                      <Text style={styles.gridVolumeLabel}>{t.supplier.remainingStock}</Text>
                      <Text style={styles.gridVolumeVal}>
                        {formatQuantity(lot.availableQuantityKg)}
                      </Text>
                    </View>

                    <View style={styles.gridPriceRow}>
                      <Text style={styles.gridPriceText}>
                        {formatRwf(lot.pricePerKgRwf)}
                      </Text>
                      <Text style={styles.pricePerKgSub}>{t.buyer.perKg}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            /* Detailed 1-Column List View */
            lots.map(lot => (
              <Card
                key={lot.id}
                onPress={() => onSelectLot(lot)}
                style={styles.lotCard}
                padding="none"
              >
                <View style={styles.cardImageContainer}>
                  <SafeImage
                    uri={lot.photos[0]}
                    cropName={lot.cropName}
                    style={styles.lotImage}
                  />
                  <View style={styles.imageOverlayGrade}>
                    <StatusBadge status={lot.grade} size="small" />
                  </View>
                  <View style={styles.imageOverlayVerified}>
                    <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
                    <Text style={styles.imageOverlayVerifiedText}>{t.buyer.verifiedBadge}</Text>
                  </View>
                  {lot.photos.length > 1 && (
                    <View style={styles.imageOverlayPhotos}>
                      <Ionicons name="images" size={12} color="#FFFFFF" />
                      <Text style={styles.imageOverlayPhotosText}>{lot.photos.length}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.lotCardBody}>
                  <View style={styles.cardHeaderRow}>
                    <CropBadge cropName={lot.cropName} size="small" />
                    <View style={styles.cropInfoWrap}>
                      <Text style={styles.cropTitle}>{lot.cropName}</Text>
                      <Text style={styles.lotCode}>
                        {lot.variety || 'Standard Bulk'} · {lot.lotCode}
                      </Text>
                    </View>
                    <View style={styles.locationChip}>
                      <Ionicons name="location-outline" size={12} color={colors.primary} />
                      <Text style={styles.locationChipText}>{lot.district}</Text>
                    </View>
                  </View>

                  <View style={styles.metricsRow}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>{t.supplier.remainingStock}</Text>
                      <Text style={styles.metricValHighlight}>
                        {formatQuantity(lot.availableQuantityKg)}
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>{t.buyer.pricingTerms}</Text>
                      <Text style={styles.metricVal}>
                        {formatRwf(lot.pricePerKgRwf)}
                        <Text style={styles.pricePerKgSmall}>{t.buyer.perKg}</Text>
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Ready Date</Text>
                      <Text style={styles.metricVal}>
                        {new Date(lot.availabilityDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.minOrderNoticeWrap}>
                      <Ionicons name="cube-outline" size={13} color={colors.neutralGray} />
                      <Text style={styles.minOrderNoticeText}>Bulk Cooperative Supply</Text>
                    </View>
                    <View style={styles.detailsBadge}>
                      <Text style={styles.detailsBadgeText}>{t.common.viewDetails} →</Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* 7. Slide-In Practical Filter Modal */}
      <Modal
        visible={isFilterModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsFilterModalOpen(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <Ionicons name="filter" size={20} color={colors.primary} />
                <Text style={styles.modalTitle}>{t.buyer.filterTitle}</Text>
              </View>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity onPress={resetAllFilters} style={styles.modalResetBtn}>
                  <Text style={styles.modalResetText}>{t.buyer.resetFilters}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsFilterModalOpen(false)}
                  style={styles.modalCloseBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={22} color={colors.neutralDark} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Quality Grade Filter */}
              <Text style={styles.modalSectionLabel}>{t.buyer.gradeLabel}</Text>
              <View style={styles.modalChipsWrap}>
                {grades.map(g => (
                  <TouchableOpacity
                    key={g.key}
                    style={[styles.modalChip, modalGrade === g.key && styles.modalChipActive]}
                    onPress={() => setModalGrade(g.key)}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        modalGrade === g.key && styles.modalChipTextActive,
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sourcing District Filter */}
              <Text style={styles.modalSectionLabel}>{t.buyer.districtLabel}</Text>
              <View style={styles.modalChipsWrap}>
                {districts.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.modalChip, modalDistrict === d && styles.modalChipActive]}
                    onPress={() => setModalDistrict(d)}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        modalDistrict === d && styles.modalChipTextActive,
                      ]}
                    >
                      {d === 'ALL' ? t.buyer.districtAll : d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sort By Filter */}
              <Text style={styles.modalSectionLabel}>{t.buyer.sortByLabel}</Text>
              <View style={styles.modalChipsWrap}>
                {sortOptions.map(s => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.modalChip, modalSort === s.key && styles.modalChipActive]}
                    onPress={() => setModalSort(s.key)}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        modalSort === s.key && styles.modalChipTextActive,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={t.buyer.applyFilters}
                onPress={applyModalFilters}
                size="medium"
                fullWidth
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
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.sm,
    ...shadows.subtle,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerTitles: {
    flex: 1,
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  headerTagText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    ...typography.h2,
    fontSize: 19,
    color: colors.neutralHeadings,
  },
  subtitle: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 1,
    lineHeight: 15,
  },
  postRequestBtn: {
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    marginHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 42,
    marginBottom: spacing.xs + 2,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.neutralDark,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  clearSearchBtn: {
    padding: 2,
  },
  categoryScroll: {
    paddingBottom: spacing.sm,
  },
  categoryScrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIcon: {
    marginRight: 5,
  },
  categoryChipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutralHeadings,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  filterTriggerActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTriggerText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralHeadings,
  },
  filterTriggerTextActive: {
    color: '#FFFFFF',
  },
  activeFilterBadge: {
    backgroundColor: '#FFFFFF',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  activeFilterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  resultsCountText: {
    ...typography.caption,
    color: colors.neutralGray,
    fontSize: 12,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  viewToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  activeFiltersRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlighted,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radii.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
    gap: 4,
  },
  activeFilterPillText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  clearAllLink: {
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  clearAllLinkText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl + 30,
  },
  featuredSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionHeaderRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.neutralHeadings,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 1,
  },
  featuredScroll: {
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  featuredCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm + 2,
    overflow: 'hidden',
    ...shadows.subtle,
  },
  featuredImage: {
    width: '100%',
    height: 110,
  },
  featuredBadgeOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  featuredCardBody: {
    padding: spacing.sm,
  },
  featuredCropName: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutralHeadings,
  },
  featuredVariety: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
    marginBottom: 4,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationSmallWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  featuredLocationText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  featuredVolumeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  featuredPriceRow: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  featuredPriceText: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  catalogSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  catalogSectionHeader: {
    marginBottom: spacing.sm,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 2,
    overflow: 'hidden',
    ...shadows.subtle,
  },
  gridImageWrap: {
    position: 'relative',
    height: 105,
    backgroundColor: '#E2E8F0',
  },
  gridImage: {
    width: '100%',
    height: 105,
  },
  gridBadgeOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: radii.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  photoCountText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gridCardBody: {
    padding: spacing.xs + 2,
  },
  gridCropTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutralHeadings,
  },
  gridVariety: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
    marginBottom: 4,
  },
  gridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  gridLocationText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
    flex: 1,
  },
  gridDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 3,
  },
  gridQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  gridVolumeLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.neutralGray,
  },
  gridVolumeVal: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  gridPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  gridPriceText: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  pricePerKgSub: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.neutralGray,
  },
  lotCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    height: 150,
    backgroundColor: '#E2E8F0',
  },
  lotImage: {
    width: '100%',
    height: 150,
  },
  imageOverlayGrade: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  imageOverlayVerified: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 59, 36, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 4,
  },
  imageOverlayVerifiedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  imageOverlayPhotos: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.sm,
    gap: 4,
  },
  imageOverlayPhotosText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  lotCardBody: {
    padding: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cropInfoWrap: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  cropTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.neutralHeadings,
  },
  lotCode: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 1,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlighted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.successBorder,
    gap: 3,
  },
  locationChipText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  metricLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  metricVal: {
    ...typography.bodyMedium,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginTop: 2,
    textAlign: 'center',
  },
  metricValHighlight: {
    ...typography.bodyMedium,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
    textAlign: 'center',
  },
  pricePerKgSmall: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.neutralGray,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  minOrderNoticeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  minOrderNoticeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.neutralGray,
  },
  detailsBadge: {
    backgroundColor: colors.surfaceHighlighted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  detailsBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  /* Filter Modal Styles */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '80%',
    paddingBottom: spacing.lg,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  modalTitle: {
    ...typography.h3,
    fontSize: 17,
    color: colors.neutralHeadings,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalResetBtn: {
    paddingVertical: 4,
  },
  modalResetText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  modalCloseBtn: {
    padding: 2,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  modalSectionLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralHeadings,
    marginTop: spacing.sm,
    marginBottom: spacing.xs + 2,
    textTransform: 'uppercase',
  },
  modalChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  modalChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalChipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutralHeadings,
  },
  modalChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
