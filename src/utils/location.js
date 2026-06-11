import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

// Request location permissions
export const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

// Get current location
export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Location permission is needed to detect your address. Please enable it in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    
    return location;
  } catch (error) {
    console.error('Error getting location:', error);
    Alert.alert('Error', 'Failed to get your current location');
    return null;
  }
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    
    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      return formatAddress(address);
    }
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};

// Format address from geocoding result
export const formatAddress = (address) => {
  const parts = [];

  const pushUnique = (value) => {
    if (!value) return;
    const s = String(value).trim();
    if (!s) return;
    if (parts.includes(s)) return;
    parts.push(s);
  };

  // NOTE: expo Location.reverseGeocodeAsync uses provider-specific fields.
  // These commonly include barangay/locality-like information under different keys.
  // We add multiple fallbacks so barangay shows up more reliably.

  pushUnique(address.street);

  // Barangay / district / neighbourhood-ish fields
  pushUnique(address.district);
  pushUnique(address.subdistrict);
  pushUnique(address.neighborhood);
  pushUnique(address.suburb);
  pushUnique(address.locality);

  pushUnique(address.city);
  pushUnique(address.region);
  pushUnique(address.postalCode);

  return parts.join(', ');
};

// Get address from current location
export const getAddressFromCurrentLocation = async () => {
  const location = await getCurrentLocation();
  if (!location) return null;
  
  const address = await reverseGeocode(
    location.coords.latitude,
    location.coords.longitude
  );
  
  return {
    ...location,
    address,
  };
};