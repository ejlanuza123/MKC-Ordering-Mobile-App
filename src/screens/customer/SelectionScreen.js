import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  ScrollView,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import ProductCard from '../../components/ProductCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import { useCart } from '../../context/CartContext';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import CustomAlertModal from '../../components/CustomAlertModal';
import { useProducts } from '../../context/ProductContext';
import { getShopHoursBadge } from '../../utils/shopHours';
import StorePauseBanner from '../../components/StorePauseBanner';
import { storeSettingsService } from '../../services/storeSettingsService';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

// Custom debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function SelectionScreen({ navigation, route }) {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { products, loading, refreshProducts, hasRealtimeUpdates } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('name_asc');
  const { cartItems, addToCart } = useCart();
  const { user } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [showUsageHints, setShowUsageHints] = useState(true);
  const [alertConfig, setAlertConfig] = useState({
    type: 'warning',
    title: '',
    message: ''
  });

  // favorites handled by context
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const shopHoursBadge = getShopHoursBadge();
  
  // Create a ref for the debounced function
  const debouncedSearchRef = useRef(null);

  const handleAddToCart = async (product) => {
    try {
      const pauseSettings = await storeSettingsService.getStorePauseSettings();
      if (pauseSettings?.isPaused && !pauseSettings?.allowPreorders) {
        setAlertConfig({
          type: 'warning',
          title: pauseSettings.title || 'Store Operations Paused',
          message: pauseSettings.reason || 'Deliveries are temporarily paused and pre-orders are currently disabled. Please check back when operations resume.',
        });
        setShowAlert(true);
        return;
      }
    } catch (e) {
      console.warn('Pause check error:', e);
    }

    if (product.stock_quantity <= 0) {
      setAlertConfig({
        type: 'warning',
        title: 'Out of Stock',
        message: `${product.name} is currently out of stock.`
      });
      setShowAlert(true);
      return;
    }
    
    const defaultQuantity = 1;
    const totalItemPrice = product.current_price * defaultQuantity;
    
    addToCart(product, defaultQuantity, totalItemPrice);
    
    setAlertConfig({
      type: 'success',
      title: 'Added to Cart',
      message: `${product.name} has been added to your cart.`
    });
    setShowAlert(true);
  };

  // We use refreshProducts from ProductContext instead of maintaining our own product state here.
  // That context already handles fetching + real-time updates.


  // Apply all filters and sorting
  const applyFilters = useCallback((productsList, query, sortMethod) => {
    let filtered = [...productsList];
    
    // Filter by search query
    if (query.trim() !== '') {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(lowerQuery) ||
        (product.description && product.description.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortMethod) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'price_asc':
          return parseFloat(a.current_price) - parseFloat(b.current_price);
        case 'price_desc':
          return parseFloat(b.current_price) - parseFloat(a.current_price);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    setFilteredProducts(filtered);
  }, []);

  // Initialize debounced search function
  useEffect(() => {
    debouncedSearchRef.current = debounce((query) => {
      try {
        applyFilters(Array.isArray(products) ? products : [], query, sortBy);
      } catch (err) {
        console.warn('applyFilters error (debounced):', err.message);
      }
    }, 300);
  }, [products, sortBy, applyFilters]);

  useEffect(() => {
    try {
      console.log('SelectionScreen init:', {
        loading,
        productsLength: Array.isArray(products) ? products.length : 0,
        hasRealtimeUpdates,
      });
    } catch (e) {
      console.warn('SelectionScreen init log failed', e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('SelectionScreen state update:', {
      loading,
      productsLength: Array.isArray(products) ? products.length : 0,
      filteredLength: Array.isArray(filteredProducts) ? filteredProducts.length : 0,
      hasRealtimeUpdates,
    });
  }, [loading, products, filteredProducts, hasRealtimeUpdates]);

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(text);
    }
  };

  // Handle sort selection
  const handleSortSelect = (sortMethod) => {
    setSortBy(sortMethod);
    applyFilters(products, searchQuery, sortMethod);
    setSortModalVisible(false);
  };

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Auto-refresh after realtime updates arrive (auto-apply after short delay)
  useEffect(() => {
    if (!hasRealtimeUpdates) return;

    const timer = setTimeout(() => {
      refreshProducts();
    }, 2500);

    return () => clearTimeout(timer);
  }, [hasRealtimeUpdates, refreshProducts]);

  useEffect(() => {
    try {
      const safeProducts = Array.isArray(products) ? products : [];
      applyFilters(safeProducts, searchQuery, sortBy);
    } catch (err) {
      console.warn('applyFilters error (initial):', err.message);
      setFilteredProducts([]);
    }
  }, [products, sortBy, searchQuery, applyFilters]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshProducts().finally(() => setRefreshing(false));
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetails', { product });
  };

  // Get sort label text
  const getSortLabel = () => {
    switch (sortBy) {
      case 'name_asc': return 'Name: A-Z';
      case 'name_desc': return 'Name: Z-A';
      case 'price_asc': return 'Price: Low to High';
      case 'price_desc': return 'Price: High to Low';
      default: return 'Sort by';
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={colors.surface} barStyle={isDarkMode ? 'light-content' : 'dark-content'}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.backgroundCanvas, { opacity: isDarkMode ? 0.25 : 0.8 }]} pointerEvents="none">
          <View style={[styles.backgroundOrb, styles.backgroundOrbTop]} />
          <View style={[styles.backgroundOrb, styles.backgroundOrbMid]} />
          <View style={[styles.backgroundOrb, styles.backgroundOrbBottom]} />
        </View>
        {/* Custom Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Home')}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={colors.primary} />
              </TouchableOpacity>
              
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: isDarkMode ? colors.textPrimary : colors.primary }]}>
                  MKC Products
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  Browse the full MKC foods catalog
                </Text>
                <View style={[styles.shopStatusBadge, { backgroundColor: shopHoursBadge.background }]}>
                  <View style={[styles.shopStatusDot, { backgroundColor: shopHoursBadge.accent }]} />
                  <Text style={[styles.shopStatusText, { color: shopHoursBadge.accent }]}>
                    {shopHoursBadge.label} · Mon-Fri 9:00 AM to 5:00 PM
                  </Text>
                </View>
              </View>
              
              <View style={styles.headerActions}>

                
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Cart')}
                  style={styles.cartButton}
                >
                  <Ionicons name="cart" size={24} color={colors.primary} />
                  {cartItems.length > 0 && (
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>
                        {cartItems.length > 9 ? '9+' : cartItems.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

              </View>
            </View>

          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: isDarkMode ? colors.surfaceElevated : '#fff', borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search products by name or description..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholderTextColor={colors.textSecondary}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => handleSearchChange('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {hasRealtimeUpdates && (
            <TouchableOpacity
              style={styles.realtimeBanner}
              onPress={() => refreshProducts()}
            >
              <Text style={styles.realtimeBannerText}>New updates available — tap to refresh</Text>
            </TouchableOpacity>
          )}
        </View>

        <StorePauseBanner />

        {/* Products Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonLoader variant="product-card" count={6} />
          </View>
        ) : (
          <View style={styles.productsContainer}>
            <View style={styles.productsHeader}>
              <Text style={[styles.productsCount, { color: colors.textSecondary }]}>
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Found
              </Text>
              <TouchableOpacity 
                style={[styles.filterButton, { backgroundColor: isDarkMode ? colors.surfaceElevated : '#f0f4ff' }]}
                onPress={() => setSortModalVisible(true)}
              >
                <Text style={[styles.filterText, { color: colors.primary }]}>{getSortLabel()}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {showUsageHints ? (
              <View style={[styles.actionHintBanner, { backgroundColor: isDarkMode ? colors.surfaceElevated : '#EEF4FF', borderColor: colors.border }]}>
                <Ionicons name="information-circle" size={16} color={colors.primary} />
                <Text style={[styles.actionHintBannerText, { color: colors.textPrimary }]}>
                  Tap product card for custom quantity. Use Quick Add to add default amount.
                </Text>
                <TouchableOpacity
                  style={styles.actionHintCloseButton}
                  onPress={() => setShowUsageHints(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.showTipsButton, { backgroundColor: isDarkMode ? colors.surfaceElevated : '#EEF4FF' }]}
                onPress={() => setShowUsageHints(true)}
              >
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                <Text style={[styles.showTipsButtonText, { color: colors.primary }]}>Show Tips</Text>
              </TouchableOpacity>
            )}

            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.productWrapper}>
                  <ProductCard 
                    product={item} 
                    onPress={() => handleProductPress(item)} 
                    onAddToCart={() => handleAddToCart(item)}
                    showActionHint={showUsageHints}
                    isFavorite={isFavorite(item.id)}
                    onToggleFavorite={async (p) => {
                      const added = await toggleFavorite(p.id);
                      setAlertConfig({
                        type: 'success',
                        title: added ? 'Added to Favorites' : 'Removed from Favorites',
                        message: added ? `${p.name} has been added to your favorites.`
                                       : `${p.name} has been removed from your favorites.`
                      });
                      setShowAlert(true);
                    }}
                  />
                </View>
              )}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons 
                    name="cube-outline" 
                    size={80} 
                    color={colors.border} 
                  />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    {searchQuery ? 'No matching products found' : 'No products available at the moment'}
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    {searchQuery 
                      ? 'Try searching with different keywords' 
                      : 'Please check back shortly or pull down to refresh'
                    }
                  </Text>
                  {searchQuery && (
                    <TouchableOpacity 
                      style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleSearchChange('')}
                    >
                      <Text style={styles.emptyButtonText}>Clear Search</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                    onPress={() => refreshProducts()}
                  >
                    <Text style={styles.emptyButtonText}>Refresh Products</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        )}

        {/* Sort Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={sortModalVisible}
          onRequestClose={() => setSortModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSortModalVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Sort Products</Text>
                <TouchableOpacity 
                  onPress={() => setSortModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.sortOptions}>
                <TouchableOpacity 
                  style={[
                    styles.sortOption,
                    { borderBottomColor: colors.border },
                    sortBy === 'name_asc' && [styles.sortOptionSelected, { backgroundColor: isDarkMode ? colors.surfaceElevated : '#f0f4ff' }]
                  ]}
                  onPress={() => handleSortSelect('name_asc')}
                >
                  <Ionicons 
                    name="text" 
                    size={20} 
                    color={sortBy === 'name_asc' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.sortOptionText,
                    { color: colors.textPrimary },
                    sortBy === 'name_asc' && [styles.sortOptionTextSelected, { color: colors.primary }]
                  ]}>
                    Name: A to Z
                  </Text>
                  {sortBy === 'name_asc' && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.sortOption,
                    { borderBottomColor: colors.border },
                    sortBy === 'name_desc' && [styles.sortOptionSelected, { backgroundColor: isDarkMode ? colors.surfaceElevated : '#f0f4ff' }]
                  ]}
                  onPress={() => handleSortSelect('name_desc')}
                >
                  <Ionicons 
                    name="text" 
                    size={20} 
                    color={sortBy === 'name_desc' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.sortOptionText,
                    { color: colors.textPrimary },
                    sortBy === 'name_desc' && [styles.sortOptionTextSelected, { color: colors.primary }]
                  ]}>
                    Name: Z to A
                  </Text>
                  {sortBy === 'name_desc' && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.sortOption,
                    { borderBottomColor: colors.border },
                    sortBy === 'price_asc' && [styles.sortOptionSelected, { backgroundColor: isDarkMode ? colors.surfaceElevated : '#f0f4ff' }]
                  ]}
                  onPress={() => handleSortSelect('price_asc')}
                >
                  <Ionicons 
                    name="arrow-up" 
                    size={20} 
                    color={sortBy === 'price_asc' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.sortOptionText,
                    { color: colors.textPrimary },
                    sortBy === 'price_asc' && [styles.sortOptionTextSelected, { color: colors.primary }]
                  ]}>
                    Price: Low to High
                  </Text>
                  {sortBy === 'price_asc' && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.sortOption,
                    { borderBottomColor: colors.border },
                    sortBy === 'price_desc' && [styles.sortOptionSelected, { backgroundColor: isDarkMode ? colors.surfaceElevated : '#f0f4ff' }]
                  ]}
                  onPress={() => handleSortSelect('price_desc')}
                >
                  <Ionicons 
                    name="arrow-down" 
                    size={20} 
                    color={sortBy === 'price_desc' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.sortOptionText,
                    { color: colors.textPrimary },
                    sortBy === 'price_desc' && [styles.sortOptionTextSelected, { color: colors.primary }]
                  ]}>
                    Price: High to Low
                  </Text>
                  {sortBy === 'price_desc' && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

      </View>
      <CustomAlertModal
        visible={showAlert}
        onClose={() => setShowAlert(false)}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText="OK"
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backgroundCanvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EEF3FF',
    overflow: 'hidden',
  },
  backgroundOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 1,
  },
  backgroundOrbTop: {
    top: -40,
    left: -70,
    width: 220,
    height: 220,
    backgroundColor: 'rgba(0, 51, 160, 0.12)',
  },
  backgroundOrbMid: {
    top: 120,
    right: -90,
    width: 260,
    height: 260,
    backgroundColor: 'rgba(244, 196, 48, 0.16)',
  },
  backgroundOrbBottom: {
    bottom: -120,
    left: '20%',
    width: 320,
    height: 320,
    backgroundColor: 'rgba(0, 51, 160, 0.08)',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0033A0',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  shopStatusBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  shopStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ED2939',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryTabs: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  categoryTabsContent: {
    paddingRight: 4,
  },
  categoryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d9e3ff',
  },
  categoryPickerCopy: {
    flex: 1,
    marginRight: 12,
  },
  categoryPickerLabel: {
    color: '#5B6B85',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  categoryPickerValue: {
    color: '#0033A0',
    fontSize: 16,
    fontWeight: '700',
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    zIndex: 1,
  },
  activeCategoryTab: {
    backgroundColor: 'transparent',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  activeCategoryTabText: {
    color: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#333',
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  actionHintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CFE0FF',
  },
  actionHintBannerText: {
    flex: 1,
    marginLeft: 8,
    color: '#1F3F78',
    fontSize: 12,
    fontWeight: '500',
  },
  actionHintCloseButton: {
    marginLeft: 8,
    padding: 2,
  },
  showTipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#CFE0FF',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  showTipsButtonText: {
    marginLeft: 6,
    color: '#0033A0',
    fontSize: 12,
    fontWeight: '600',
  },
  productsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterText: {
    color: '#0033A0',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  columnWrapper: {
    paddingHorizontal: 2,
  },
  productWrapper: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 2,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 25,
  },
  emptyButton: {
    backgroundColor: '#0033A0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 10,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  realtimeBanner: {
    backgroundColor: '#0033A0',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  realtimeBannerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  categoryModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '78%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  sortOptions: {
    paddingHorizontal: 20,
  },
  categoryOptions: {
    paddingHorizontal: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoryOptionSelected: {
    backgroundColor: '#f0f4ff',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryOptionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  categoryOptionTextSelected: {
    color: '#0033A0',
    fontWeight: '700',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sortOptionSelected: {
    backgroundColor: '#f0f4ff',
  },
  sortOptionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  sortOptionTextSelected: {
    color: '#0033A0',
    fontWeight: '600',
  },
});