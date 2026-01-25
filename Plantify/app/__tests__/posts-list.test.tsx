const mockGetUserPosts = jest.fn();

jest.mock('@/services/postService', () => ({
  PostService: {
    getUserPosts: (...args: any[]) => mockGetUserPosts(...args),
    deletePost: jest.fn(),
  },
}));

jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    getUserId: () => '123',
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    setTokens: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PostsList from '../posts-list';

describe('PostsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserPosts.mockResolvedValue([]);
  });

  it('renders without crashing', async () => {
    const { getByText } = render(<PostsList />);
    await waitFor(() => {
      expect(getByText('No hay publicaciones disponibles.')).toBeTruthy();
    });
  });

  it('calls getUserPosts on mount', async () => {
    render(<PostsList />);
    await waitFor(() => {
      expect(mockGetUserPosts).toHaveBeenCalledWith('mock-token');
    });
  });
});
