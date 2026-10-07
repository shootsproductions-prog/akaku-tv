import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useApp } from '../state/AppState';
import { FONT } from '../theme';

/** App text: brand face, theme colour, and Kūpuna-mode scaling of size and leading. */
export function Txt({ style, ...rest }: TextProps) {
  const { colors, scale } = useApp();
  // Drop explicit `undefined` values: they would override the theme colour (invisible text in dark mode).
  const flat = Object.fromEntries(Object.entries(StyleSheet.flatten(style) ?? {}).filter(([, v]) => v !== undefined)) as TextStyle;
  const fontSize = (flat.fontSize ?? 16) * scale;
  const lineHeight = flat.lineHeight != null ? flat.lineHeight * scale : undefined;
  return <Text {...rest} style={[styles.base, { color: colors.text }, flat, { fontSize, lineHeight }]} />;
}

const styles = StyleSheet.create({ base: { fontFamily: FONT } });
