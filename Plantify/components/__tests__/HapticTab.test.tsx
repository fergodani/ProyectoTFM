import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { HapticTab } from '../HapticTab';
import { Text } from 'react-native';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

describe('HapticTab Component', () => {
  const mockOnPress = jest.fn();

  const renderWithNavigation = (component: React.ReactElement) => {
    return render(
      <NavigationContainer>
        {component}
      </NavigationContainer>
    );
  };

  it('renders without crashing', () => {
    const { toJSON } = renderWithNavigation(
      <HapticTab onPress={mockOnPress} isFocused={false}>
        <Text>Tab</Text>
      </HapticTab>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = renderWithNavigation(
      <HapticTab onPress={mockOnPress} isFocused={false}>
        <Text>Tab</Text>
      </HapticTab>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
