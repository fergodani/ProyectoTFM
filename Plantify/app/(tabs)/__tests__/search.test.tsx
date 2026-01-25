import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SearchScreen from '../search';
import { TouchableOpacity } from 'react-native/Libraries/Components/Touchable/TouchableOpacity';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('@/services/plantsService', () => ({
  PlantService: {
    getPlantInfoList: jest.fn().mockResolvedValue([]),
  },
}));

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search title', () => {
    const { getByText } = render(<SearchScreen />);
    expect(getByText('Encuentra plantas')).toBeTruthy();
  });

  it('renders search input', () => {
    const { getByText } = render(<SearchScreen />);
    expect(getByText('Buscar plantas...')).toBeTruthy();
  });

  it('renders view all plants button', () => {
    const { getByText } = render(<SearchScreen />);
    expect(getByText('Ver todas las plantas')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<SearchScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
