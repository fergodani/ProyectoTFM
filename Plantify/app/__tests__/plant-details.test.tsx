import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PlantDetails from '../plant-details';

jest.mock('@/services/plantsService', () => ({
  PlantService: {
    getUserPlantById: jest.fn().mockResolvedValue({
      id: 1,
      common_name: 'Rosa',
      scientific_name: ['Rosa'],
      photo: 'https://example.com/image.jpg',
    }),
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
  useLocalSearchParams: () => ({
    id: '1',
  }),
  useNavigation: () => ({
    setOptions: jest.fn(),
  }),
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

describe('PlantDetails', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<PlantDetails />);
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<PlantDetails />);
    expect(toJSON()).toMatchSnapshot();
  });
});
