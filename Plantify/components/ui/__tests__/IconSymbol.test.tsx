import React from 'react';
import { render } from '@testing-library/react-native';
import { IconSymbol } from '../IconSymbol';

// Mock MaterialIcons
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

describe('IconSymbol Component', () => {
  it('renders with house.fill icon', () => {
    const { toJSON } = render(
      <IconSymbol name="house.fill" color="#000" size={24} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom size', () => {
    const { toJSON } = render(
      <IconSymbol name="search" color="#000" size={32} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom color', () => {
    const { toJSON } = render(
      <IconSymbol name="camera" color="#FF0000" size={24} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with style prop', () => {
    const { toJSON } = render(
      <IconSymbol name="alarm" color="#000" size={24} style={{ margin: 10 }} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <IconSymbol name="house.fill" color="#007AFF" size={24} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
