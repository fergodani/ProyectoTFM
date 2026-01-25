import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableWithoutFeedback, Modal } from 'react-native';
import CustomModal from '../Modal';

describe('CustomModal Component', () => {
  it('renders when visible is true', () => {
    const { getByText } = render(
      <CustomModal visible={true} dismiss={() => {}}>
        <Text>Modal Content</Text>
      </CustomModal>
    );
    expect(getByText('Modal Content')).toBeTruthy();
  });

  it('calls dismiss when overlay is pressed', () => {
    const mockDismiss = jest.fn();
    const { UNSAFE_getByType } = render(
      <CustomModal visible={true} dismiss={mockDismiss}>
        <Text>Content</Text>
      </CustomModal>
    );
    
    // Find TouchableWithoutFeedback and trigger onPress
    const touchable = UNSAFE_getByType(TouchableWithoutFeedback);
    fireEvent.press(touchable);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders with transparent prop', () => {
    const { UNSAFE_getByType } = render(
      <CustomModal visible={true} transparent={true} dismiss={() => {}}>
        <Text>Content</Text>
      </CustomModal>
    );
    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.transparent).toBe(true);
  });

  it('renders with custom animation type', () => {
    const { UNSAFE_getByType } = render(
      <CustomModal visible={true} animationType="slide" dismiss={() => {}}>
        <Text>Content</Text>
      </CustomModal>
    );
    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.animationType).toBe('slide');
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <CustomModal visible={true} dismiss={() => {}}>
        <Text>Snapshot Test</Text>
      </CustomModal>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
