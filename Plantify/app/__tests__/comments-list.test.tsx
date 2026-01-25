const mockGetUserComments = jest.fn();

jest.mock('@/services/postService', () => ({
  PostService: {
    getUserComments: (...args: any[]) => mockGetUserComments(...args),
    deleteComment: jest.fn(),
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
import CommentsList from '../comments-list';

describe('CommentsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserComments.mockResolvedValue([]);
  });

  it('renders without crashing', async () => {
    const { getByText } = render(<CommentsList />);
    await waitFor(() => {
      expect(getByText('No hay comentarios disponibles.')).toBeTruthy();
    });
  });

  it('calls getUserComments on mount', async () => {
    render(<CommentsList />);
    await waitFor(() => {
      expect(mockGetUserComments).toHaveBeenCalledWith('mock-token');
    });
  });
});
