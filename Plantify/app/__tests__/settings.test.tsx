import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../settings';
import { ActivityIndicator } from 'react-native';

// Mock dependencies
jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    getUserId: jest.fn(() => '1'),
    accessToken: 'mock-token',
    logout: jest.fn(),
  }),
}));

jest.mock('@/services/storageService', () => ({
  StorageService: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    getIsNotificationsEnabled: jest.fn().mockResolvedValue(true),
    saveIsNotificationsEnabled: jest.fn().mockResolvedValue(undefined),
    getNotificationTime: jest.fn().mockResolvedValue(9),
    saveNotificationTime: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/services/notificationService', () => ({
  NotificationService: {
    scheduleDailyNotification: jest.fn(),
    cancelAllNotifications: jest.fn(),
  },
}));

jest.mock('@/services/userService', () => ({
  UserService: {
    getUser: jest.fn().mockResolvedValue({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    }),
    updateUser: jest.fn().mockResolvedValue({}),
  },
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

jest.mock('@quidone/react-native-wheel-picker', () => ({
  __esModule: true,
  default: 'WheelPicker',
}));

describe('SettingsScreen', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<SettingsScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays settings title', async () => {
    const { getByText } = render(<SettingsScreen />);
    
    await waitFor(() => {
      expect(getByText('Cuenta')).toBeTruthy();
    });
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<SettingsScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
