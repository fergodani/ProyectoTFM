import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HealthTab from '../health';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('HealthTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<HealthTab />);
    expect(getByText('Diagnóstico')).toBeTruthy();
  });

  it('renders description text', () => {
    const { getByText } = render(<HealthTab />);
    expect(getByText('Ayuda a tus plantas a mantenerse saludables con un diagnóstico inteligente')).toBeTruthy();
  });

  it('renders diagnostic card', () => {
    const { getByText } = render(<HealthTab />);
    expect(getByText('¿Problemas con tus plantas?')).toBeTruthy();
  });

  it('renders autodiagnosis button', () => {
    const { getByText } = render(<HealthTab />);
    expect(getByText('Autodiagnóstico')).toBeTruthy();
  });

  it('renders pests and diseases button', () => {
    const { getByText } = render(<HealthTab />);
    expect(getByText('Plagas y enfermedades')).toBeTruthy();
  });

  it('navigates to camera on autodiagnosis press', () => {
    const { router } = require('expo-router');
    const { getByText } = render(<HealthTab />);
    const autodiagnosisButton = getByText('Autodiagnóstico');
    
    fireEvent.press(autodiagnosisButton);
    
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/camera-screen',
      params: { isPest: 'true' },
    });
  });

  it('navigates to pests search on button press', () => {
    const { router } = require('expo-router');
    const { getByText } = render(<HealthTab />);
    const pestsButton = getByText('Plagas y enfermedades');
    
    fireEvent.press(pestsButton);
    
    expect(router.push).toHaveBeenCalledWith('/pests-search');
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<HealthTab />);
    expect(toJSON()).toMatchSnapshot();
  });
});
