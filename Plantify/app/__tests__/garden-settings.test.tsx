import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import GardenSettings from '../garden-settings';

jest.mock('@/services/gardensService', () => ({
  default: {
    updateGarden: jest.fn().mockResolvedValue({}),
    deleteGarden: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    setTokens: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    gardenString: JSON.stringify({
      id: 1,
      name: 'Test Garden',
      location: 'outdoor',
      humidity: 'normal',
      sunlight_exposure: 'full_sun',
    }),
  }),
}));

describe('GardenSettings', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<GardenSettings />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays garden name', () => {
    const { getAllByText } = render(<GardenSettings />);
    const elements = getAllByText('Test Garden');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<GardenSettings />);
    expect(toJSON()).toMatchSnapshot();
  });
});
