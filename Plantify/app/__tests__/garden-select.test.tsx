import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import GardenSelect from '../garden-select';

// Mock the Gardens component to avoid complex internal logic
jest.mock('@/components/Gardens', () => {
  return jest.fn(({ plantId }) => {
    const { Text, View } = require('react-native');
    return (
      <View>
        <Text>Jardín 1</Text>
        <Text>Jardín 2</Text>
      </View>
    );
  });
});

jest.mock('@/services/plantsService', () => ({
  PlantService: {
    addPlantToGarden: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    accessToken: 'mock-token',
    getUserId: jest.fn(() => '1'),
    isAuthenticated: true,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    id: '1',
  }),
}));

describe('GardenSelect', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<GardenSelect />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows garden list after loading', async () => {
    const { getByText } = render(<GardenSelect />);
    
    await waitFor(() => {
      expect(getByText('Jardín 1')).toBeTruthy();
      expect(getByText('Jardín 2')).toBeTruthy();
    });
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<GardenSelect />);
    expect(toJSON()).toMatchSnapshot();
  });
});
