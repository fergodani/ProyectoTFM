import TabBarBackground from '../TabBarBackground';

describe('TabBarBackground', () => {
  it('exports default (may be function or undefined based on platform)', () => {
    // On iOS it exports BlurTabBarBackground function, on web/Android it's undefined
    expect(TabBarBackground === undefined || typeof TabBarBackground === 'function').toBe(true);
  });
});
