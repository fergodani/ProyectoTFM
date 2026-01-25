import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PlantInfoDetails from '../plant-info-details';

jest.mock('@/services/plantsService', () => ({
  PlantService: {
    getPlantInfoById: jest.fn().mockResolvedValue({
      id: 1,
      common_name: 'Rosa',
      scientific_name: ['Rosa'],
      watering: 'regular',
      description: 'Beautiful flower',
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
  useFocusEffect: jest.fn(),
}));

describe('PlantInfoDetails', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<PlantInfoDetails />);
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<PlantInfoDetails />);
    expect(toJSON()).toMatchSnapshot();
  });
});
