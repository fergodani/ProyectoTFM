import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CommentForm from '../comment-form';

jest.mock('@/services/postService', () => ({
  PostService: {
    createComment: jest.fn().mockResolvedValue({ id: 1 }),
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
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    postId: '1',
  }),
  useNavigation: () => ({
    setOptions: jest.fn(),
    goBack: jest.fn(),
  }),
}));

describe('CommentForm', () => {
  it('renders comment input', () => {
    const { getByPlaceholderText } = render(<CommentForm />);
    expect(getByPlaceholderText('Escribe tu comentario...')).toBeTruthy();
  });

  it('updates input field', () => {
    const { getByPlaceholderText } = render(<CommentForm />);
    
    const input = getByPlaceholderText('Escribe tu comentario...');
    fireEvent.changeText(input, 'Great post!');
    
    expect(input.props.value).toBe('Great post!');
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<CommentForm />);
    expect(toJSON()).toMatchSnapshot();
  });
});
