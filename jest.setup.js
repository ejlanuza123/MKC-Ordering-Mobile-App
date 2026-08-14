import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage for tests
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    multiRemove: jest.fn(),
    getAllKeys: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 9.7535, longitude: 118.7479, accuracy: 5 }
  }),
  getLastKnownPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 9.7535, longitude: 118.7479, accuracy: 5 }
  }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([
    {
      street: 'BM Road',
      district: 'San Manuel',
      city: 'Puerto Princesa City',
      region: 'Palawan',
      postalCode: '5300'
    }
  ]),
  Accuracy: {
    Highest: 6,
    BestForNavigation: 6
  }
}));
