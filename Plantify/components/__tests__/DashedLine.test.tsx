import React from 'react';
import { render } from '@testing-library/react-native';
import DashedLine from '../DashedLine';

describe('DashedLine Component', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<DashedLine />);
    expect(toJSON()).toBeTruthy();
  });

  it('has correct dashed border style', () => {
    const { getByTestId } = render(<DashedLine />);
    const { toJSON } = render(<DashedLine />);
    const view = toJSON();
    
    expect(view).toMatchObject({
      type: 'View',
      props: {
        style: expect.objectContaining({
          borderBottomWidth: 1,
          borderStyle: 'dashed',
          borderColor: '#ccc',
          marginVertical: 16,
          width: '100%',
        })
      }
    });
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<DashedLine />);
    expect(toJSON()).toMatchSnapshot();
  });
});
