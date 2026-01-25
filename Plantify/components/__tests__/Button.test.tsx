import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../Button';

describe('Button Component', () => {
  it('renders correctly with text', () => {
    const { getByText } = render(<Button text="Click Me" />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<Button text="Press" onPress={mockOnPress} />);
    
    fireEvent.press(getByText('Press'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button text="Disabled" onPress={mockOnPress} disabled={true} />
    );
    
    fireEvent.press(getByText('Disabled'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('applies disabled opacity style when disabled', () => {
    const { UNSAFE_getAllByType } = render(<Button text="Disabled" disabled={true} />);
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    expect(touchables.length).toBeGreaterThan(0);
    expect(touchables[0].props.style).toContainEqual({ opacity: 0.5 });
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<Button text="Snapshot Test" />);
    expect(toJSON()).toMatchSnapshot();
  });
});
