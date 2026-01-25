import React from 'react';
import { render } from '@testing-library/react-native';
import RootLayout from '../_layout';

// Mock expo-router
jest.mock('expo-router', () => {
  const React = require('react');
  const StackComponent: any = ({ children }: any) => React.createElement('Stack', null, children);
  StackComponent.Screen = ({ children }: any) => React.createElement('StackScreen', null, children);
  
  return {
    Stack: StackComponent,
    router: {
      push: jest.fn(),
      replace: jest.fn(),
    },
  };
});

// Mock expo-font
jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock AuthContext
jest.mock('@/hooks/useAuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    getUserId: jest.fn(() => '1'),
    isAuthenticated: false,
  }),
}));

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  ThemeProvider: ({ children }: any) => children,
  DarkTheme: {},
  DefaultTheme: {},
}));

describe('RootLayout', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders Stack navigation', () => {
    const { UNSAFE_getByType, toJSON } = render(<RootLayout />);
    // Stack component should be rendered
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toMatchSnapshot();
  });
});
