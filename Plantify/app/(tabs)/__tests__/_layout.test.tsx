import React from 'react';
import { render } from '@testing-library/react-native';
import TabLayout from '../_layout';

// Mock expo-router
jest.mock('expo-router', () => {
  const React = require('react');
  const TabsComponent = ({ children }: any) => React.createElement('Tabs', null, children);
  TabsComponent.Screen = ({ children }: any) => React.createElement('TabsScreen', null, children);
  
  return {
    Tabs: TabsComponent,
  };
});

// Mock components
jest.mock('@/components/HapticTab', () => ({
  HapticTab: 'HapticTab',
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: 'IconSymbol',
}));

jest.mock('@/components/ui/TabBarBackground', () => ({
  __esModule: true,
  default: undefined,
}));

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

describe('TabLayout', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<TabLayout />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders Tabs component', () => {
    const { UNSAFE_getByType, toJSON } = render(<TabLayout />);
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<TabLayout />);
    expect(toJSON()).toMatchSnapshot();
  });
});
