import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PlantSettings from '../plant-settings';

const mockUserPlant = {
  id: 1,
  name: 'Test Plant',
  wateringFrequencyDays: 7,
  fertilityFrequencyDays: 30,
  pruningFrequencyDays: 60,
  userGardenId: 1,
  perenual_details: {
    scientific_name: ['Test Scientific Name'],
    common_name: 'Test Plant',
  },
};

const mockUseLocalSearchParams = jest.fn();
const mockBack = jest.fn();
const mockUseRouter = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => mockUseRouter(),
  useNavigation: () => ({
    setOptions: jest.fn(),
    goBack: jest.fn(),
  }),
  router: {
    back: jest.fn(),
  },
}));

jest.mock('@/services/plantsService', () => ({
  PlantService: {
    updateUserPlant: jest.fn().mockResolvedValue({}),
    deleteUserPlant: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    setTokens: jest.fn(),
  }),
}));

jest.mock('@quidone/react-native-wheel-picker', () => ({
  __esModule: true,
  default: 'WheelPicker',
}));

describe('PlantSettings', () => {
  beforeEach(() => {
    // Reset mock and provide default return value
    mockUseLocalSearchParams.mockReturnValue({
      plant: JSON.stringify(mockUserPlant),
    });
    mockUseRouter.mockReturnValue({
      back: mockBack,
      replace: jest.fn(),
    });
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<PlantSettings />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays plant information', async () => {
    const { getByText } = render(<PlantSettings />);
    
    await waitFor(() => {
      expect(getByText('Test Scientific Name')).toBeTruthy();
      expect(getByText('Horario de cuidado de plantas')).toBeTruthy();
      expect(getByText('Altura de la planta')).toBeTruthy();
    });
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<PlantSettings />);
    expect(toJSON()).toMatchSnapshot();
  });
});
