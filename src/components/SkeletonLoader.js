import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

/**
 * Reusable shimmer skeleton placeholder component.
 * Renders animated pulsing placeholder shapes that mimic content layout
 * for a premium loading experience.
 *
 * Usage:
 *   <SkeletonLoader variant="product-card" count={6} />
 *   <SkeletonLoader variant="order-card" count={4} />
 *   <SkeletonLoader variant="dashboard-stats" />
 *   <SkeletonLoader variant="delivery-card" count={3} />
 */

const SHIMMER_DURATION = 1200;

function ShimmerBlock({ style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: SHIMMER_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: SHIMMER_DURATION,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.shimmerBase, style, { opacity }]} />;
}

function ProductCardSkeleton() {
  return (
    <View style={styles.productCard}>
      <ShimmerBlock style={styles.productImage} />
      <View style={styles.productInfo}>
        <ShimmerBlock style={styles.productTitle} />
        <ShimmerBlock style={styles.productSubtitle} />
        <View style={styles.productFooter}>
          <ShimmerBlock style={styles.productPrice} />
          <ShimmerBlock style={styles.productButton} />
        </View>
      </View>
    </View>
  );
}

function OrderCardSkeleton() {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={{ flex: 1 }}>
          <ShimmerBlock style={styles.orderNumber} />
          <ShimmerBlock style={styles.orderDate} />
        </View>
        <ShimmerBlock style={styles.statusBadge} />
      </View>
      <ShimmerBlock style={styles.orderItemLine} />
      <ShimmerBlock style={[styles.orderItemLine, { width: '60%' }]} />
      <View style={styles.orderFooterSkel}>
        <ShimmerBlock style={styles.orderTotal} />
        <ShimmerBlock style={styles.orderChevron} />
      </View>
    </View>
  );
}

function DashboardStatsSkeleton() {
  return (
    <View>
      {/* KPI Cards Row */}
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <ShimmerBlock style={styles.statIcon} />
            <ShimmerBlock style={styles.statValue} />
            <ShimmerBlock style={styles.statLabel} />
          </View>
        ))}
      </View>
      {/* Earnings Card */}
      <View style={styles.earningsCard}>
        <ShimmerBlock style={{ width: 120, height: 14, borderRadius: 4 }} />
        <ShimmerBlock style={{ width: 180, height: 28, borderRadius: 6, marginTop: 8 }} />
        <ShimmerBlock style={{ width: '100%', height: 8, borderRadius: 4, marginTop: 16 }} />
      </View>
      {/* Activity List */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.activityItem}>
          <ShimmerBlock style={styles.activityDot} />
          <View style={{ flex: 1 }}>
            <ShimmerBlock style={{ width: '80%', height: 12, borderRadius: 4 }} />
            <ShimmerBlock style={{ width: '50%', height: 10, borderRadius: 4, marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

function DeliveryCardSkeleton() {
  return (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryHeader}>
        <ShimmerBlock style={styles.deliveryBadge} />
        <ShimmerBlock style={styles.deliveryTime} />
      </View>
      <ShimmerBlock style={{ width: '90%', height: 12, borderRadius: 4, marginTop: 10 }} />
      <ShimmerBlock style={{ width: '70%', height: 12, borderRadius: 4, marginTop: 6 }} />
      <View style={styles.deliveryFooterSkel}>
        <ShimmerBlock style={{ width: 80, height: 32, borderRadius: 8 }} />
        <ShimmerBlock style={{ width: 80, height: 32, borderRadius: 8 }} />
      </View>
    </View>
  );
}

export default function SkeletonLoader({ variant = 'product-card', count = 3 }) {
  switch (variant) {
    case 'product-card':
      return (
        <View style={styles.productGrid}>
          {Array.from({ length: count }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </View>
      );

    case 'order-card':
      return (
        <View style={styles.listContainer}>
          {Array.from({ length: count }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </View>
      );

    case 'dashboard-stats':
      return <DashboardStatsSkeleton />;

    case 'delivery-card':
      return (
        <View style={styles.listContainer}>
          {Array.from({ length: count }).map((_, i) => (
            <DeliveryCardSkeleton key={i} />
          ))}
        </View>
      );

    default:
      return (
        <View style={styles.listContainer}>
          {Array.from({ length: count }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  shimmerBase: {
    backgroundColor: '#E5E7EB',
  },

  // Product Card Skeleton
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 10,
  },
  productCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 0,
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    width: '85%',
    height: 13,
    borderRadius: 4,
  },
  productSubtitle: {
    width: '55%',
    height: 10,
    borderRadius: 4,
    marginTop: 6,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  productPrice: {
    width: 55,
    height: 16,
    borderRadius: 4,
  },
  productButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },

  // Order Card Skeleton
  listContainer: {
    paddingHorizontal: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    width: 130,
    height: 14,
    borderRadius: 4,
  },
  orderDate: {
    width: 90,
    height: 10,
    borderRadius: 4,
    marginTop: 6,
  },
  statusBadge: {
    width: 75,
    height: 26,
    borderRadius: 13,
  },
  orderItemLine: {
    width: '80%',
    height: 10,
    borderRadius: 4,
    marginTop: 4,
  },
  orderFooterSkel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  orderTotal: {
    width: 100,
    height: 18,
    borderRadius: 4,
  },
  orderChevron: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  // Dashboard Stats Skeleton
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    marginBottom: 8,
  },
  statValue: {
    width: 50,
    height: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
  statLabel: {
    width: 60,
    height: 10,
    borderRadius: 4,
  },
  earningsCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Delivery Card Skeleton
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryBadge: {
    width: 90,
    height: 24,
    borderRadius: 12,
  },
  deliveryTime: {
    width: 70,
    height: 12,
    borderRadius: 4,
  },
  deliveryFooterSkel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
});
