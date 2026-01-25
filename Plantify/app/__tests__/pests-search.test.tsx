import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PestsSearch from '../pests-search';

jest.mock('@/services/pestsService', () => ({
  PestService: {
    searchPests: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('PestsSearch', () => {
  it('renders search input', () => {
    const { getByPlaceholderText } = render(<PestsSearch />);
    expect(getByPlaceholderText('Buscar plagas/enfermedades...')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<PestsSearch />);
    expect(toJSON()).toMatchSnapshot();
  });
});
