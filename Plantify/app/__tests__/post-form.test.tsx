import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PostForm from '../post-form';

jest.mock('@/services/postService', () => ({
  PostService: {
    createPost: jest.fn().mockResolvedValue({ id: 1 }),
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
    plantId: '1',
  }),
  useNavigation: () => ({
    setOptions: jest.fn(),
    goBack: jest.fn(),
  }),
}));

describe('PostForm', () => {
  it('renders form fields', () => {
    const { getByPlaceholderText } = render(<PostForm />);
    
    expect(getByPlaceholderText('Título...')).toBeTruthy();
    expect(getByPlaceholderText('Escribe el contenido de la publicación...')).toBeTruthy();
  });

  it('updates input fields', () => {
    const { getByPlaceholderText } = render(<PostForm />);
    
    const titleInput = getByPlaceholderText('Título...');
    fireEvent.changeText(titleInput, 'New Post');
    
    expect(titleInput.props.value).toBe('New Post');
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<PostForm />);
    expect(toJSON()).toMatchSnapshot();
  });
});
