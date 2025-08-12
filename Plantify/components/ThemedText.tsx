import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'title2' | 'defaultSemiBold' | 'subtitle' | 'link' | 'light' | 'button' | 'italic';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'title2' ? styles.title2 : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'light' ? styles.light : undefined,
        type === 'button' ? styles.button : undefined,
        type === 'italic' ? styles.italic : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'LexendDeca'
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    fontFamily: 'LexendDeca'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
    fontFamily: 'LexendDeca',
    paddingVertical: 8,
  },
  title2: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: 'LexendDeca'
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    fontFamily: 'LexendDeca'
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
    fontFamily: 'LexendDeca'
  },
  light: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'LexendDeca',
    color: '#11181C'
  },
  italic: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'LexendDeca',
    fontStyle: 'italic',
    opacity: 0.8,
  }
});
