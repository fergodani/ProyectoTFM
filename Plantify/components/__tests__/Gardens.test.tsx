import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import Gardens from '../Gardens';

// Mock dependencies
jest.mock('@/services/gardensService');
jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    getUserId: jest.fn(() => '1'),
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh-token',
    setTokens: jest.fn(),
  }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock('@/hooks/useColorScheme.web', () => ({
  useColorScheme: () => 'light',
}));
jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn(() => '#FFFFFF'),
}));

describe('Gardens Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<Gardens plantId={null} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with plantId prop', () => {
    const { toJSON } = render(<Gardens plantId={123} />);
    expect(toJSON()).toBeTruthy();
  });
});
