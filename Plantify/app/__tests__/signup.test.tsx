import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignupScreen from '../signup';

// Mock dependencies
jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    signup: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('SignupScreen', () => {
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText, queryAllByPlaceholderText } = render(<SignupScreen />);
    
    expect(getByText('Crear una cuenta')).toBeTruthy();
    expect(getByPlaceholderText('Introduce tu nombre de usuario')).toBeTruthy();
    expect(getByPlaceholderText('Introduce tu correo')).toBeTruthy();
    expect(getByPlaceholderText('Introduce tu contraseña')).toBeTruthy();
    expect(getByPlaceholderText('Confirma tu contraseña')).toBeTruthy();
  });

  it('shows error when fields are empty', async () => {
    const { getByText } = render(<SignupScreen />);
    
    const signupButton = getByText('Registrarse');
    fireEvent.press(signupButton);
    
    await waitFor(() => {
      expect(getByText('Por favor, completa todos los campos.')).toBeTruthy();
    });
  });

  it('shows error when passwords do not match', async () => {
    const { getByPlaceholderText, getAllByPlaceholderText, getByText } = render(<SignupScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Introduce tu nombre de usuario'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Introduce tu correo'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Introduce tu contraseña'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirma tu contraseña'), 'password456');
    
    fireEvent.press(getByText('Registrarse'));
    
    await waitFor(() => {
      expect(getByText('Las contraseñas no coinciden.')).toBeTruthy();
    });
  });

  it('updates all input fields', () => {
    const { getByPlaceholderText } = render(<SignupScreen />);
    
    const usernameInput = getByPlaceholderText('Introduce tu nombre de usuario');
    const emailInput = getByPlaceholderText('Introduce tu correo');
    const passwordInput = getByPlaceholderText('Introduce tu contraseña');
    const confirmPasswordInput = getByPlaceholderText('Confirma tu contraseña');
    
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    
    expect(usernameInput.props.value).toBe('testuser');
    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password123');
    expect(confirmPasswordInput.props.value).toBe('password123');
  });

  it('calls signup function when form is valid', async () => {
    const mockSignup = jest.fn().mockResolvedValue({});
    jest.spyOn(require('@/hooks/useAuthContext'), 'useAuth').mockReturnValue({
      signup: mockSignup,
    });

    const { getByText, getByPlaceholderText, getAllByPlaceholderText } = render(<SignupScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Introduce tu nombre de usuario'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Introduce tu correo'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Introduce tu contraseña'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirma tu contraseña'), 'password123');
    
    fireEvent.press(getByText('Registrarse'));
    
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123');
    });
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<SignupScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
