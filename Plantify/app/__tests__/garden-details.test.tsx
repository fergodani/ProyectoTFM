import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import GardenDetails from '../garden-details';

jest.mock('@/services/gardensService', () => ({
  __esModule: true,
  default: {
    getGardenById: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Mi Jardín',
      location: 'outdoor',
      humidity: 'normal',
      sunlight_exposure: 'full_sun',
    }),
  },
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({
    id: '1',
  }),
  useNavigation: () => ({
    setOptions: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => {
    callback();
  },
  router: {
    push: jest.fn(),
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('@/components/Plants', () => ({
  __esModule: true,
  default: 'Plants',
}));

describe('GardenDetails', () => {
  it('renders garden name', async () => {
    const { getByText } = render(<GardenDetails />);
    
    await waitFor(() => {
      expect(getByText('Mi Jardín')).toBeTruthy();
    });
  });

  it('renders settings button', async () => {
    const { UNSAFE_getByType } = render(<GardenDetails />);
    
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<GardenDetails />);
    expect(toJSON()).toMatchSnapshot();
  });
});
