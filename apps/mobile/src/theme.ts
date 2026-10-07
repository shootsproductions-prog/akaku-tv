import { Platform } from 'react-native';

// Akakū brand, matched to the Graphics Kit Generator (akaku-pipeline/public/styles.css).
export const BLUE = '#0c80e2';
export const BLUE_INK = '#0a6bbd';
export const BLUE_SOFT = '#4da3f0';
export const BLUE_WASH = 'rgba(12,128,226,0.15)';
export const BLUE_TINT = 'rgba(12,128,226,0.10)';
export const GREEN = '#059669';
export const RED = '#dc2626';
export const SCRIM = 'rgba(14,18,24,0.45)';
export const BADGE_BG = 'rgba(14,18,24,0.72)';

export type Palette = {
  bg: string;
  text: string;
  mist: string;
  surface: string;
  border: string;
  wash: string;
  /** Dark editorial panel — stays dark in both themes. */
  panel: string;
  tabbar: string;
};

export const THEMES: Record<'light' | 'dark', Palette> = {
  light: { bg: '#ffffff', text: '#0e1218', mist: '#5b6573', surface: '#f3f6fa', border: '#e1e6ee', wash: 'rgba(14,18,24,0.07)', panel: '#0e1218', tabbar: 'rgba(255,255,255,0.92)' },
  dark: { bg: '#0e1218', text: '#f3f6fa', mist: '#9aa5b4', surface: '#161c25', border: '#243040', wash: 'rgba(255,255,255,0.09)', panel: '#161c25', tabbar: 'rgba(14,18,24,0.92)' },
};

/** Helvetica Neue on iOS (the brand face); the system sans elsewhere. */
export const FONT = Platform.select({ ios: 'Helvetica Neue', default: undefined });

/** Kūpuna mode enlarges every type size by this factor. */
export const KUPUNA_SCALE = 1.18;

/** Side margin of every screen. One number to tune how close content sits to the screen edge. */
export const GUTTER = 14;

export const RADIUS = { card: 14, control: 8, sheet: 20 };
