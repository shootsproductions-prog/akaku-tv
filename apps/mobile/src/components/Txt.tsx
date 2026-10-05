import { StyleSheet, Text, type TextProps } from 'react-native';

import { useApp } from '../state/AppState';
import { FONT } from '../theme';

/** App text: brand face, theme colour, and Kūpuna-mode scaling of size and leading. */
export function Txt({ style, ...rest }: TextProps) {
  const { colors, scale } = useApp();
  const flat = StyleSheet.flatten(style) ?? {};
  const fontSize = (flat.fontSize ?? 16) * scale;
  const lineHeight = flat.lineHeight != null ? flat.lineHeight * scale : undefined;
  return <Text {...rest} style={[styles.base, { color: colors.text }, flat, { fontSize, lineHeight }]} />;
}

const styles = StyleSheet.create({ base: { fontFamily: FONT } });
