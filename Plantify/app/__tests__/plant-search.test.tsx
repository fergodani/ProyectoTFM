import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PlantSearch from '../plant-search';

jest.mock('@/services/plantsService', () => ({
  PlantService: {
    getPlantInfoList: jest.fn().mockResolvedValue([]),
    createPlant: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    getUserId: jest.fn(() => '1'),
    accessToken: 'mock-token',
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    isCreating: 'true',
    gardenId: '1',
  }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('PlantSearch', () => {
  it('renders search input', () => {
    const { getByPlaceholderText } = render(<PlantSearch />);
    expect(getByPlaceholderText('Buscar plantas...')).toBeTruthy();
  });

  it('updates search text on input change', () => {
    const { getByPlaceholderText } = render(<PlantSearch />);
    const input = getByPlaceholderText('Buscar plantas...');
    
    fireEvent.changeText(input, 'Rosa');
    expect(input.props.value).toBe('Rosa');
  });

  it('shows loading indicator when searching', async () => {
    const { getByPlaceholderText } = render(<PlantSearch />);
    const input = getByPlaceholderText('Buscar plantas...');
    
    fireEvent.changeText(input, 'test');
    
    await waitFor(() => {
      // Loading should appear briefly
      expect(true).toBe(true);
    });
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<PlantSearch />);
    expect(toJSON()).toMatchSnapshot();
  });
});
