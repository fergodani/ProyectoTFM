import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../login';

// Mock dependencies
jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useNavigation: () => ({
    setOptions: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('LoginScreen', () => {
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    expect(getByText('Iniciar sesión')).toBeTruthy();
    expect(getByPlaceholderText('Introduce tu nombre de usuario')).toBeTruthy();
    expect(getByPlaceholderText('Introduce tu contraseña')).toBeTruthy();
  });

  it('shows error when fields are empty', async () => {
    const { getByText } = render(<LoginScreen />);
    
    const loginButton = getByText('Entrar');
    fireEvent.press(loginButton);
    
    await waitFor(() => {
      expect(getByText('Por favor, completa todos los campos.')).toBeTruthy();
    });
  });

  it('updates email and password fields', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    
    const emailInput = getByPlaceholderText('Introduce tu nombre de usuario');
    const passwordInput = getByPlaceholderText('Introduce tu contraseña');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    
    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('calls login function when form is submitted', async () => {
    const mockLogin = jest.fn().mockResolvedValue({});
    jest.spyOn(require('@/hooks/useAuthContext'), 'useAuth').mockReturnValue({
      login: mockLogin,
    });

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Introduce tu nombre de usuario'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Introduce tu contraseña'), 'password123');
    
    fireEvent.press(getByText('Entrar'));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows signup link', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('¿No tienes cuenta?')).toBeTruthy();
    expect(getByText('Regístrate aquí')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<LoginScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
