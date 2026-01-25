import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PostDetails from '../post-details';

jest.mock('@/services/postService', () => ({
  PostService: {
    getPostById: jest.fn().mockResolvedValue({
      id: 1,
      title: 'Test Post',
      content: 'Test content',
      user: { username: 'testuser' },
    }),
  },
}));

jest.mock('@/hooks/useAuthContext', () => ({
  useAuth: () => ({
    accessToken: 'mock-token',
    getUserId: jest.fn(() => '1'),
  }),
}));

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    id: '1',
  }),
  useFocusEffect: jest.fn(),
  useNavigation: () => ({
    setOptions: jest.fn(),
    goBack: jest.fn(),
  }),
}));

describe('PostDetails', () => {
  it('renders loading initially', () => {
    const { UNSAFE_getAllByType } = render(<PostDetails />);
    const indicators = UNSAFE_getAllByType('ActivityIndicator' as any);
    expect(indicators.length).toBeGreaterThan(0);
  });

  it('renders post details after loading', async () => {
    const { getByText } = render(<PostDetails />);
    
    await waitFor(() => {
      expect(getByText('Test Post')).toBeTruthy();
    });
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<PostDetails />);
    expect(toJSON()).toMatchSnapshot();
  });
});
