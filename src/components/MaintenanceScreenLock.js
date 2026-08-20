// src/components/MaintenanceScreenLock.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storeSettingsService } from '../services/storeSettingsService';

export default function MaintenanceScreenLock({ userRole = 'customer' }) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(null);
  const [checking, setChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadSettings = async (showLoading = false) => {
    if (showLoading) setChecking(true);
    try {
      const data = await storeSettingsService.getStorePauseSettings();
      setSettings(data);
    } catch (err) {
      console.warn('Error loading store settings for maintenance lock:', err);
    } finally {
      if (showLoading) {
        setTimeout(() => setChecking(false), 600);
      }
    }
  };

  useEffect(() => {
    loadSettings();
    const unsubscribe = storeSettingsService.subscribeToStorePauseChanges((fresh) => {
      setSettings(fresh);
    });
    return () => unsubscribe();
  }, []);

  // Check if maintenance lock should be active
  // Locks full screen if mode is 'maintenance' or if emergency pause has pre-orders disabled
  const isLocked = Boolean(
    settings?.isPaused &&
    (settings?.mode === 'maintenance' || (settings?.mode === 'emergency' && !settings?.allowPreorders)) &&
    userRole !== 'rider'
  );

  // Fade in animation when locked
  useEffect(() => {
    if (isLocked) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isLocked, fadeAnim]);

  // Gentle pulsing and gear rotation animations
  useEffect(() => {
    if (!isLocked) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulse.start();
    rotate.start();

    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, [isLocked, pulseAnim, rotateAnim]);

  // Live countdown timer
  useEffect(() => {
    if (!isLocked || !settings?.reopenAt || typeof settings.reopenAt !== 'string' || !settings.reopenAt.trim()) {
      setTimeLeft('');
      return;
    }

    const calculateTime = () => {
      const target = new Date(settings.reopenAt).getTime();
      if (Number.isNaN(target) || target <= 0) {
        setTimeLeft('');
        return;
      }

      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        if (settings.autoReopen !== false) {
          setTimeLeft('Reopening now...');
          loadSettings();
        } else {
          setTimeLeft('');
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      parts.push(`${minutes < 10 && hours > 0 ? '0' : ''}${minutes}m`);
      parts.push(`${seconds < 10 ? '0' : ''}${seconds}s`);

      setTimeLeft(parts.join(' '));
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [isLocked, settings?.reopenAt, settings?.autoReopen]);

  if (!isLocked) {
    return null;
  }

  const isEmergency = settings?.mode === 'emergency';
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.overlayContainer, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" translucent />
      
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 30 }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Status Pill */}
        <View style={[styles.statusBadge, isEmergency ? styles.emergencyBadge : styles.maintenanceBadge]}>
          <View style={[styles.statusDot, isEmergency ? styles.emergencyDot : styles.maintenanceDot]} />
          <Text style={styles.statusBadgeText}>
            {isEmergency ? 'OPERATIONS TEMPORARILY SUSPENDED' : 'UNDER SCHEDULED MAINTENANCE'}
          </Text>
        </View>

        {/* Animated Icon Container */}
        <View style={styles.iconSection}>
          <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.iconCircle, isEmergency ? styles.emergencyIconCircle : styles.maintenanceIconCircle]}>
            <Animated.View style={{ transform: isEmergency ? [] : [{ rotate: spin }] }}>
              <Ionicons
                name={isEmergency ? 'warning-outline' : 'construct-outline'}
                size={54}
                color={isEmergency ? '#F87171' : '#FBBF24'}
              />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Title & Reason */}
        <Text style={styles.mainTitle}>
          {settings?.title || (isEmergency ? 'Emergency Operations Notice' : "We're Under Maintenance")}
        </Text>

        <Text style={styles.reasonText}>
          {settings?.reason ||
            (isEmergency
              ? 'Deliveries are temporarily paused due to inclement weather and road safety conditions. Active orders will be fulfilled safely.'
              : 'We are currently performing routine kitchen equipment sanitation and system maintenance to serve you better.')}
        </Text>

        {/* Live Reopen Countdown Card */}
        {timeLeft ? (
          <View style={styles.countdownCard}>
            <View style={styles.countdownHeader}>
              <Ionicons name="time-outline" size={16} color="#FDE68A" style={{ marginRight: 6 }} />
              <Text style={styles.countdownLabel}>ESTIMATED TIME REMAINING</Text>
            </View>
            <Text style={styles.countdownValue}>{timeLeft}</Text>
            <Text style={styles.countdownHint}>The application will automatically unlock upon reopening.</Text>
          </View>
        ) : null}

        {/* Refresh / Check Status Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => loadSettings(true)}
          disabled={checking}
          activeOpacity={0.8}
        >
          {checking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.refreshButtonText}>Check Status / Refresh</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Customer Support Contact */}
        <View style={styles.supportBox}>
          <Text style={styles.supportTitle}>Need urgent assistance with an existing order?</Text>
          <Text style={styles.supportPhone}>📞 MKC Hotline: (02) 8808-5678 / 0918-987-6543</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111827',
    zIndex: 99999,
    elevation: 99999,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 28,
  },
  maintenanceBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  emergencyBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 8,
  },
  maintenanceDot: {
    backgroundColor: '#FBBF24',
  },
  emergencyDot: {
    backgroundColor: '#F87171',
  },
  statusBadgeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: 130,
    height: 130,
  },
  pulseCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  maintenanceIconCircle: {
    backgroundColor: 'rgba(120, 53, 15, 0.4)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  emergencyIconCircle: {
    backgroundColor: 'rgba(127, 29, 29, 0.4)',
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  reasonText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  countdownCard: {
    width: '100%',
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.5)',
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  countdownLabel: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  countdownValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginVertical: 4,
  },
  countdownHint: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 4,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  supportBox: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.6)',
    alignItems: 'center',
    width: '100%',
  },
  supportTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  supportPhone: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
});
