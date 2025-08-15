/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';
const green = '#e5e460';
const lightGreen = '#f8f09b';
const lightBlue = '#f7f8f6';

export const Colors = {
  light: {
    text: '#11181C',
    buttonText: '#11181C',
    //background: '#fff',
    background: 'rgb(252, 250, 246)',
    //background: 'rgb(191,216,197)',
    tint: '#bfd8c5ff',
    icon: '#687076',
    tabIconDefault: green,
    tabIconSelected: green,
    cardBackground: '#FFFFFF',
    green: green,
    lightGreen: lightGreen,
  },
  dark: {
    text: '#ECEDEE',
    buttonText: '#11181C',
    background: '#151718',
    //background: 'rgb(68,83,90)',
    tint: 'rgb(191,216,197)',
    icon: '#9BA1A6',
    tabIconDefault: green,
    tabIconSelected: green,
    cardBackground: '#222',
    green: green,
    lightGreen: lightGreen,
  },
} as const;
