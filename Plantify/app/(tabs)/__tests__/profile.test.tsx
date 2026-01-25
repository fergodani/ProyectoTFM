import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../profile';

// Mock dependencies
jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    getUserId: jest.fn(() => '1'),
    logout: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useNavigation: () => ({
    setOptions: jest.fn(),
  }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('react-native-tab-view', () => ({
  SceneMap: jest.fn((scenes) => scenes),
  TabView: 'TabView',
  TabBar: 'TabBar',
}));

jest.mock('@/components/Plants', () => ({
  __esModule: true,
  default: 'Plants',
}));

jest.mock('@/components/Gardens', () => ({
  __esModule: true,
  default: 'Gardens',
}));

describe('ProfileScreen - Authenticated', () => {
  it('renders when authenticated', () => {
    const { toJSON } = render(<ProfileScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows TabView when authenticated', () => {
    const { UNSAFE_getByType } = render(<ProfileScreen />);
    expect(UNSAFE_getByType('TabView' as any)).toBeTruthy();
  });

  it('matches snapshot when authenticated', () => {
    const { toJSON } = render(<ProfileScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});

describe('ProfileScreen - Not Authenticated', () => {
  beforeEach(() => {
    jest.spyOn(require('@/hooks/useAuthContext'), 'useAuth').mockReturnValue({
      isAuthenticated: false,
      getUserId: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('shows login prompt when not authenticated', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('No estás autenticado')).toBeTruthy();
  });

  it('shows login button when not authenticated', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Iniciar sesión')).toBeTruthy();
  });

  it('shows signup button when not authenticated', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Crea una')).toBeTruthy();
  });

  it('navigates to login on button press', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue({
      push: mockPush,
    });

    const { getByText } = render(<ProfileScreen />);
    const loginButton = getByText('Iniciar sesión');
    
    fireEvent.press(loginButton);
    
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/login',
      params: { from: '/(tabs)/profile' },
    });
  });

  it('matches snapshot when not authenticated', () => {
    const { toJSON } = render(<ProfileScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
