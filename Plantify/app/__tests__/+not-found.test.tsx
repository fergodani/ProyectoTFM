import React from 'react';
import { render } from '@testing-library/react-native';
import NotFoundScreen from '../+not-found';

// Mock expo-router
jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ children }: any) => children,
  },
  Link: ({ children, ...props }: any) => children,
}));

describe('NotFoundScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<NotFoundScreen />);
    
    expect(getByText("This screen doesn't exist.")).toBeTruthy();
    expect(getByText('Go to home screen!')).toBeTruthy();
  });

  it('displays error message', () => {
    const { getByText } = render(<NotFoundScreen />);
    expect(getByText("This screen doesn't exist.")).toBeTruthy();
  });

  it('displays link to home', () => {
    const { getByText } = render(<NotFoundScreen />);
    expect(getByText('Go to home screen!')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<NotFoundScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
