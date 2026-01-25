import React from 'react';
import { render } from '@testing-library/react-native';
import TaskList from '../TaskList';
import { Task } from '@/models/Plant';

// Mock dependencies
jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    getUserId: jest.fn(() => '1'),
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh-token',
    setTokens: jest.fn(),
  }),
}));
jest.mock('@/services/plantsService');
jest.mock('@/services/userService');

const mockTasks: Task[] = [
  {
    type: 'watering',
    next_date: '2026-01-18',
    user_plant: {
      custom_name: 'My Plant',
      photo: null,
      last_watered_date: '2026-01-17',
      last_pruning_date: null,
      last_spraying_date: null,
      last_rotating_date: null,
      last_fertilized_date: null,
      plant_info: {
        id: 1,
        common_name: 'Rose',
        scientific_name: ['Rosa'],
        watering: 'regular',
        pruning: 'monthly',
        image_url: 'https://example.com/rose.jpg',
      },
    } as any,
  },
];

describe('TaskList Component', () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing with empty tasks', () => {
    const { toJSON } = render(
      <TaskList tasks={[]} onRefresh={mockOnRefresh} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with tasks', () => {
    const { toJSON } = render(
      <TaskList tasks={mockTasks} onRefresh={mockOnRefresh} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with isToday flag', () => {
    const { toJSON } = render(
      <TaskList tasks={mockTasks} isToday={true} onRefresh={mockOnRefresh} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with isNext flag', () => {
    const { toJSON } = render(
      <TaskList tasks={mockTasks} isNext={true} onRefresh={mockOnRefresh} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders correctly with empty tasks', () => {
    const { toJSON } = render(
      <TaskList tasks={[]} onRefresh={mockOnRefresh} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders correctly with tasks', () => {
    const { toJSON } = render(
      <TaskList tasks={mockTasks} onRefresh={mockOnRefresh} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
