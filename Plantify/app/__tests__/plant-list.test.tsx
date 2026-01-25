import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PlantList from '../plant-list';
import { ActivityIndicator } from 'react-native';

// Mock dependencies
jest.mock('@/services/plantsService', () => ({
  PlantService: {
    getPlantInfoList: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/services/gardensService', () => ({
  default: {
    getGardensName: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    getUserId: jest.fn(() => '1'),
    accessToken: 'mock-token',
    isAuthenticated: true,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    plants: '[]',
    filter: '',
    isInfiniteScroll: 'false',
  }),
}));

describe('PlantList', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<PlantList />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with empty plant list', () => {
    const { toJSON } = render(<PlantList />);
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<PlantList />);
    expect(toJSON()).toMatchSnapshot();
  });
});
