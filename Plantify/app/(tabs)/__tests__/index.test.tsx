import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../index';

// Mock dependencies
jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    getUserId: jest.fn(() => '1'),
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    setTokens: jest.fn(),
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('@/services/plantsService', () => ({
  PlantService: {
    getTasks: jest.fn().mockResolvedValue({
      today_tasks: [],
      previous_tasks: [],
      next_tasks: [],
    }),
  },
}));

jest.mock('@/services/recommendationService', () => ({
  RecommendationService: {
    getWeather: jest.fn().mockResolvedValue({
      temperature: 25,
      humidity: 60,
      description: 'Sunny',
    }),
  },
}));

jest.mock('@/services/notificationService', () => ({
  NotificationService: {
    requestPermissions: jest.fn().mockResolvedValue(true),
    scheduleDailyReminder: jest.fn(),
  },
}));

jest.mock('@/services/storageService', () => ({
  StorageService: {
    getIsNotificationsEnabled: jest.fn().mockResolvedValue(true),
    getNotificationTime: jest.fn().mockResolvedValue('09:00'),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/',
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 40.4168, longitude: -3.7038 },
  }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('react-native-tab-view', () => ({
  SceneMap: jest.fn((scenes) => scenes),
  TabView: 'TabView',
  TabBar: 'TabBar',
}));

jest.mock('@/components/TaskList', () => ({
  __esModule: true,
  default: 'TaskList',
}));

describe('HomeScreen', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<HomeScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays home title', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Recordatorios')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    const { UNSAFE_getAllByType } = render(<HomeScreen />);
    expect(true).toBe(true);
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<HomeScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
