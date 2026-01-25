import React from 'react';
import { render } from '@testing-library/react-native';
import Plants from '../Plants';
import { ActivityIndicator } from 'react-native/Libraries/Components/ActivityIndicator/ActivityIndicator';
import { PlantService } from '@/services/plantsService';

// Mock dependencies
jest.mock('@/services/plantsService');
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
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
}));

// Mock gesture handler imports
jest.mock('react-native-gesture-handler/Swipeable', () => 'Swipeable');
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
  };
});

describe('Plants Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (PlantService.getPlantsByGarden as jest.Mock) = jest.fn().mockResolvedValue([]);
    (PlantService.getAllPlants as jest.Mock) = jest.fn().mockResolvedValue([]);
  });

  it('renders with gardenId prop', () => {
    const { toJSON } = render(<Plants gardenId={123} />);
    expect(toJSON()).toBeTruthy();
  });
});
