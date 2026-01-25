import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import ParallaxScrollView from '../ParallaxScrollView';

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.ScrollView = RN.ScrollView;
  return RN;
});

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn(() => '#FFFFFF'),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 80,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('ParallaxScrollView Component', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#fff', dark: '#000' }}
        headerImage={<View />}
      >
        <Text>Content</Text>
      </ParallaxScrollView>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders header image', () => {
    const { UNSAFE_getByType } = render(
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#fff', dark: '#000' }}
        headerImage={<View testID="header-image" />}
      >
        <Text>Content</Text>
      </ParallaxScrollView>
    );
    expect(UNSAFE_getByType(View)).toBeTruthy();
  });

  it('renders children', () => {
    const { getByText } = render(
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#fff', dark: '#000' }}
        headerImage={<View />}
      >
        <Text>Test Content</Text>
      </ParallaxScrollView>
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#fff', dark: '#000' }}
        headerImage={<View />}
      >
        <Text>Snapshot</Text>
      </ParallaxScrollView>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
