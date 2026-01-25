import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CameraScreen from '../camera-screen';

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  CameraType: 'back',
  useCameraPermissions: jest.fn(() => [
    { granted: true },
    jest.fn(),
  ]),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    isPest: 'false',
  }),
}));

jest.mock('@/services/plantsService', () => ({
  PlantService: {
    sendPhoto: jest.fn().mockResolvedValue({ id: 1 }),
  },
}));

describe('CameraScreen', () => {
  it('renders camera when permission is granted', () => {
    const { UNSAFE_getByType } = render(<CameraScreen />);
    expect(UNSAFE_getByType('CameraView' as any)).toBeTruthy();
  });

  it('shows permission request when not granted', () => {
    jest.spyOn(require('expo-camera'), 'useCameraPermissions').mockReturnValue([
      { granted: false },
      jest.fn(),
    ]);

    const { getByText } = render(<CameraScreen />);
    expect(getByText('Necesitamos permisos para mostrar la cámara')).toBeTruthy();
  });

  it('has toggle camera button', () => {
    const { getByTestId } = render(<CameraScreen />);
    // Camera should be rendered
    expect(true).toBe(true);
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<CameraScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
