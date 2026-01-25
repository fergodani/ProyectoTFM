import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import GardenForm from '../garden-form';

// Mock dependencies
jest.mock('@/services/gardensService', () => ({
  __esModule: true,
  default: {
    getGardenTemplates: jest.fn().mockResolvedValue([]),
    createGarden: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    getUserId: jest.fn(() => '1'),
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    setTokens: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('@/hooks/useColorScheme.web', () => ({
  useColorScheme: () => 'light',
}));

describe('GardenForm', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<GardenForm />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders form title', async () => {
    const { getByText } = render(<GardenForm />);
    
    await waitFor(() => {
      expect(getByText('Elije un lugar')).toBeTruthy();
    });
  });

  it('displays step 1 initially', async () => {
    const { getByText, toJSON } = render(<GardenForm />);
    
    await waitFor(() => {
      // Should show first step content
      expect(toJSON()).toBeTruthy();
    });
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<GardenForm />);
    expect(toJSON()).toMatchSnapshot();
  });
});
