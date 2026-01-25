import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedView } from '../ThemedView';
import { Text } from 'react-native';

// Mock the useThemeColor hook
jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn((colors) => colors.light || '#FFFFFF'),
}));

describe('ThemedView Component', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>Test Content</Text>
      </ThemedView>
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies custom light color', () => {
    const { getByTestId } = render(
      <ThemedView testID="themed-view" lightColor="#FF0000">
        <Text>Content</Text>
      </ThemedView>
    );
    const view = getByTestId('themed-view');
    expect(view.props.style).toContainEqual({ backgroundColor: '#FF0000' });
  });

  it('merges custom styles', () => {
    const customStyle = { padding: 20 };
    const { getByTestId } = render(
      <ThemedView testID="themed-view" style={customStyle}>
        <Text>Content</Text>
      </ThemedView>
    );
    const view = getByTestId('themed-view');
    expect(view.props.style).toContainEqual(customStyle);
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <ThemedView>
        <Text>Snapshot Test</Text>
      </ThemedView>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
