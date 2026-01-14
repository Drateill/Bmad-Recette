// Jest setup file for React Native tests

// Mock expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiBaseUrl: 'http://localhost:3001',
      googleClientId: 'mock-google-client-id',
      appleClientId: 'mock-apple-client-id',
    },
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'mock-redirect-uri'),
  AuthRequest: jest.fn(),
  exchangeCodeAsync: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock reanimated for tests using animated components (e.g. FAB Group)
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
