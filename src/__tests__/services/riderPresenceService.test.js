const mockFetch = jest.fn();
const mockNetInfoAddEventListener = jest.fn();
const mockAppStateAddEventListener = jest.fn();
const mockFrom = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: (...args) => mockFetch(...args),
    addEventListener: (...args) => mockNetInfoAddEventListener(...args),
  },
}));

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: (...args) => mockAppStateAddEventListener(...args),
  },
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}));

describe('riderPresenceService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('does not mark rider offline when AppState becomes inactive', async () => {
    let appStateCallback;
    mockAppStateAddEventListener.mockImplementation((_event, cb) => {
      appStateCallback = cb;
      return { remove: jest.fn() };
    });

    mockFetch.mockResolvedValue({ isConnected: true });

    const { riderPresenceService } = require('../../services/riderPresenceService');

    const setOnlineSpy = jest.spyOn(riderPresenceService, 'setOnlineStatus').mockResolvedValue(undefined);
    const checkOnlineSpy = jest.spyOn(riderPresenceService, 'checkIfOnline').mockResolvedValue(true);

    riderPresenceService.subscribeToAppState('r-1');

    await appStateCallback('inactive');
    expect(setOnlineSpy).not.toHaveBeenCalled();
    expect(checkOnlineSpy).not.toHaveBeenCalled();

    await appStateCallback('background');
    expect(checkOnlineSpy).toHaveBeenCalledWith('r-1');
    expect(setOnlineSpy).toHaveBeenCalledWith('r-1', false);

    await appStateCallback('active');
    expect(setOnlineSpy).toHaveBeenCalledWith('r-1', true);
  });

  it('ignores NetInfo events with unknown connectivity', async () => {
    let netInfoCallback;
    const unsubscribe = jest.fn();
    mockNetInfoAddEventListener.mockImplementation((cb) => {
      netInfoCallback = cb;
      return unsubscribe;
    });

    const { riderPresenceService } = require('../../services/riderPresenceService');
    const setOnlineSpy = jest.spyOn(riderPresenceService, 'setOnlineStatus').mockResolvedValue(undefined);

    riderPresenceService.subscribeToNetworkState('r-2');

    await netInfoCallback({ isConnected: null });
    expect(setOnlineSpy).not.toHaveBeenCalled();

    await netInfoCallback({ isConnected: true, isInternetReachable: false });
    expect(setOnlineSpy).toHaveBeenCalledWith('r-2', false);
  });
});

