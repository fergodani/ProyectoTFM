import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PestDetails from '../pest-details';
import { ActivityIndicator } from 'react-native';

jest.mock('@/services/pestsService', () => ({
  PestService: {
    getPestById: jest.fn().mockResolvedValue({
      id: 1,
      common_name: 'Aphid',
      description: 'Small insect',
    }),
    getPestDetails: jest.fn().mockResolvedValue({
      id: 1,
      common_name: 'Aphid',
      description: 'Small insect',
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
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 80,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('PestDetails', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<PestDetails />);
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<PestDetails />);
    expect(toJSON()).toMatchSnapshot();
  });
});
