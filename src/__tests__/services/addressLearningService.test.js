// src/__tests__/services/addressLearningService.test.js
// MKC Foods Corporation - mkc-mobile-app

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args) => mockGetItem(...args),
  setItem: (...args) => mockSetItem(...args),
}));

const mockFrom = jest.fn();
const mockLimit = jest.fn();
const mockOrder = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockAuthGetUser = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    auth: {
      getUser: (...args) => mockAuthGetUser(...args),
    },
  },
}));

describe('AddressLearningService.getLearnedCorrection', () => {
  let service;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    mockGetItem.mockResolvedValue(null);
    mockLimit.mockResolvedValue({ data: [], error: null });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    const mod = require('../../services/addressLearningService');
    service = mod.addressLearningService;
    await new Promise((r) => setTimeout(r, 20));
  });

  it('returns null when cache is empty', () => {
    expect(service.getLearnedCorrection(14.35, 121.03)).toBeNull();
  });

  it('returns null for invalid/null coordinates', () => {
    expect(service.getLearnedCorrection(null, null)).toBeNull();
    expect(service.getLearnedCorrection(NaN, NaN)).toBeNull();
  });

  it('returns a matched correction when within threshold (~120m)', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } });
    mockInsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    await service.registerCorrection({
      latitude: 14.3500,
      longitude: 121.0300,
      barangay: 'Pacita',
      street: 'Rizal Ave',
      landmark: 'Mall',
      fullAddress: 'Pacita, San Pedro',
    });

    const result = service.getLearnedCorrection(14.3501, 121.0301);
    expect(result).not.toBeNull();
    expect(result.barangay).toBe('Pacita');
  });

  it('returns null when coordinates are far beyond threshold', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } });
    mockInsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    await service.registerCorrection({
      latitude: 14.35,
      longitude: 121.03,
      barangay: 'Pacita',
      street: '',
      landmark: '',
      fullAddress: '',
    });

    expect(service.getLearnedCorrection(15.0, 122.0)).toBeNull();
  });
});

describe('AddressLearningService.registerCorrection', () => {
  let service;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    mockLimit.mockResolvedValue({ data: [], error: null });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } } });
    mockInsert.mockResolvedValue({ error: null });

    const mod = require('../../services/addressLearningService');
    service = mod.addressLearningService;
    await new Promise((r) => setTimeout(r, 20));
  });

  it('does nothing when required fields are missing', async () => {
    mockFrom.mockReturnValue({ insert: mockInsert });
    await service.registerCorrection({ latitude: null, longitude: null, barangay: null });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('saves correction to AsyncStorage', async () => {
    mockFrom.mockReturnValue({ insert: mockInsert });
    await service.registerCorrection({
      latitude: 14.35,
      longitude: 121.03,
      barangay: 'Pacita Complex',
      street: 'A',
      landmark: 'B',
      fullAddress: 'Pacita Complex, San Pedro',
    });
    expect(mockSetItem).toHaveBeenCalled();
  });

  it('inserts correction into Supabase', async () => {
    mockFrom.mockReturnValue({ insert: mockInsert });
    await service.registerCorrection({
      latitude: 14.35,
      longitude: 121.03,
      barangay: 'Landayan',
      street: 'Main',
      landmark: 'Gasoline',
      fullAddress: 'Landayan, San Pedro',
    });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 14.35, barangay: 'Landayan' })
    );
  });

  it('continues gracefully when Supabase insert fails', async () => {
    mockFrom.mockReturnValue({ insert: jest.fn().mockRejectedValue(new Error('db error')) });
    await expect(
      service.registerCorrection({
        latitude: 14.35, longitude: 121.03, barangay: 'Test',
        street: '', landmark: '', fullAddress: '',
      })
    ).resolves.toBeUndefined();
  });
});
