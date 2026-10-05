import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toSegments } from '../lib/segments';
import { useReadAloud } from '../lib/speech';
import { useApp } from '../state/AppState';
import { BADGE_BG, BLUE, BLUE_WASH, RADIUS } from '../theme';
import { Icon } from './Icon';
import { ICON } from './icons';
import { Txt } from './Txt';

/** Pressable with the prototype's 0.98 press-down. */
export function Press({ style, children, ...rest }: React.ComponentProps<typeof Pressable> & { style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable {...rest} style={({ pressed }) => [style, pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }]}>
      {children}
    </Pressable>
  );
}

export function Eyebrow({ children, color = BLUE, spacing = 3.3 }: { children: ReactNode; color?: string; spacing?: number }) {
  return <Txt style={{ fontSize: 11, fontWeight: '600', letterSpacing: spacing, textTransform: 'uppercase', color }}>{children}</Txt>;
}

export function AIBadge({ color = BLUE }: { color?: string }) {
  return (
    <View style={styles.row5}>
      <Icon d={ICON.spark} size={11} color={color} filled />
      <Txt style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color }}>Akakū Intelligence</Txt>
    </View>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <Txt style={styles.h2}>{children}</Txt>;
}

export function SectionHeader({ title, aside, inset }: { title: string; aside?: ReactNode; inset?: boolean }) {
  const { colors } = useApp();
  return (
    <View style={[styles.sectionHeader, inset && { paddingHorizontal: 20 }]}>
      <Txt style={{ fontSize: 17, fontWeight: '700' }}>{title}</Txt>
      {typeof aside === 'string' ? <Txt style={{ fontSize: 13, color: colors.mist }}>{aside}</Txt> : aside}
    </View>
  );
}

export function Chip({ label, selected, onPress, height = 36, fontSize = 13 }: { label: string; selected: boolean; onPress: () => void; height?: number; fontSize?: number }) {
  const { colors } = useApp();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, { height, borderColor: selected ? BLUE : colors.border, backgroundColor: selected ? BLUE : 'transparent' }]}
    >
      <Txt style={{ fontSize, fontWeight: '600', color: selected ? '#fff' : colors.text }} numberOfLines={1}>{label}</Txt>
    </Pressable>
  );
}

type ButtonProps = { label: string; onPress?: () => void; variant?: 'primary' | 'outline' | 'quiet'; height?: number; fontSize?: number; flex?: boolean; bg?: string };

export function Button({ label, onPress, variant = 'primary', height = 44, fontSize = 15, flex, bg }: ButtonProps) {
  const { colors } = useApp();
  const look =
    variant === 'primary'
      ? { backgroundColor: bg ?? BLUE, borderColor: bg ?? BLUE, color: '#fff' }
      : variant === 'outline'
        ? { backgroundColor: 'transparent', borderColor: BLUE, color: BLUE }
        : { backgroundColor: 'transparent', borderColor: colors.border, color: colors.text };
  return (
    <Press onPress={onPress} accessibilityRole="button" style={[styles.button, { height, backgroundColor: look.backgroundColor, borderColor: look.borderColor }, flex && { flex: 1 }]}>
      <Txt style={{ fontSize, fontWeight: '600', color: look.color, textAlign: 'center' }}>{label}</Txt>
    </Press>
  );
}

export function Tag({ label, tone, height = 22 }: { label: string; tone: 'blue' | 'wash'; height?: number }) {
  const { colors } = useApp();
  return (
    <View style={[styles.tag, { height, backgroundColor: tone === 'blue' ? BLUE_WASH : colors.wash }]}>
      <Txt style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: tone === 'blue' ? BLUE : colors.text }}>{label}</Txt>
    </View>
  );
}

export function LiveBadge() {
  return (
    <View style={styles.live}>
      <View style={styles.liveDot} />
      <Txt style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.1, color: '#fff' }}>LIVE</Txt>
    </View>
  );
}

/** Small dark label on a thumbnail ("Live frame · 4s ago", durations). */
export function OverlayLabel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.overlayLabel, style]}>
      <Txt style={{ fontSize: 11, color: '#fff', fontVariant: ['tabular-nums'] }}>{children}</Txt>
    </View>
  );
}

/** 16:9 frame: the image when we have one, otherwise a labelled placeholder. */
export function Thumb({ uri, label, dark, radius = 0, children }: { uri?: string | null; label?: string; dark?: boolean; radius?: number; children?: ReactNode }) {
  const { colors } = useApp();
  return (
    <View style={[styles.thumb, { backgroundColor: dark ? '#111' : colors.surface, borderRadius: radius }]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : label ? (
        <Txt style={{ fontSize: 13, color: dark ? 'rgba(255,255,255,0.45)' : colors.mist }}>{label}</Txt>
      ) : null}
      {children}
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const { colors } = useApp();
  const base = [styles.card, { borderColor: colors.border }, style];
  return onPress ? (
    <Press onPress={onPress} style={base}>
      {children}
    </Press>
  ) : (
    <View style={base}>{children}</View>
  );
}

/** Dark editorial panel used for Akakū Intelligence output. */
export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useApp();
  return <View style={[styles.panel, { backgroundColor: colors.panel }, style]}>{children}</View>;
}

export function ReadAloudButton({ text, label = 'Read aloud' }: { text: string; label?: string }) {
  const { colors } = useApp();
  const { speaking, toggle } = useReadAloud(text);
  return (
    <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={speaking ? 'Stop reading' : label} style={[styles.pillButton, { borderColor: speaking ? BLUE : colors.border }]}>
      <Icon d={speaking ? ICON.pause : ICON.speaker} size={14} color={speaking ? BLUE : colors.text} strokeWidth={2} filled={speaking} />
      <Txt style={{ fontSize: 12, fontWeight: '600', color: speaking ? BLUE : colors.text }}>{speaking ? 'Stop' : label}</Txt>
    </Pressable>
  );
}

export function IconButton({ d, onPress, color, label, size = 44, iconSize = 22, border, strokeWidth }: { d: string; onPress?: () => void; color: string; label: string; size?: number; iconSize?: number; border?: string; strokeWidth?: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center', borderRadius: size / 2 }, border ? { borderWidth: 1, borderColor: border } : null]}
    >
      <Icon d={d} size={iconSize} color={color} strokeWidth={strokeWidth} />
    </Pressable>
  );
}

/** Header for pushed screens: back, title block, optional action. */
export function DetailHeader({ children, right, dark }: { children: ReactNode; right?: ReactNode; dark?: boolean }) {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, borderBottomWidth: dark ? 0 : 1, borderBottomColor: colors.border, backgroundColor: dark ? '#000' : colors.bg }}>
      <View style={styles.detailRow}>
        <IconButton d={ICON.back} label="Back" color={dark ? '#fff' : colors.text} strokeWidth={2} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
        {right}
      </View>
    </View>
  );
}

/**
 * Prose with tappable proof marks. Each mark jumps to its timestamp or source;
 * the active one is filled.
 */
export function ProofText({ text, active, onRef, size = 16, lineHeight = 25.6, color }: { text: string; active?: string | null; onRef?: (key: string) => void; size?: number; lineHeight?: number; color?: string }) {
  const segs = toSegments(text);
  return (
    <Txt style={{ fontSize: size, lineHeight, color }}>
      {segs.map((seg, i) => {
        if (seg.kind === 'text') return seg.t;
        const on = active === seg.key;
        const mark = (
          <View style={[styles.mark, { backgroundColor: on ? BLUE : BLUE_WASH, height: onRef ? 20 : 18, minWidth: onRef ? 20 : 18 }]}>
            <Txt style={{ fontSize: onRef ? 11 : 10, fontWeight: '700', color: on ? '#fff' : BLUE }}>{seg.n}</Txt>
          </View>
        );
        return onRef ? (
          <Pressable key={i} onPress={() => onRef(seg.key)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Proof ${seg.n}, jump to ${seg.key}`} style={styles.markWrap}>
            {mark}
          </Pressable>
        ) : (
          <View key={i} style={styles.markWrap}>
            {mark}
          </View>
        );
      })}
    </Txt>
  );
}

export function Deadlines({ items, onDark }: { items: { d: string; t: string }[]; onDark?: boolean }) {
  const { colors } = useApp();
  return (
    <>
      {items.map(dl => (
        <View key={dl.d + dl.t} style={[styles.deadline, { backgroundColor: onDark ? 'rgba(255,255,255,0.12)' : 'rgba(12,128,226,0.12)' }]}>
          <Txt style={{ fontSize: 12, fontWeight: '700', color: onDark ? '#4da3f0' : BLUE }}>{dl.d}</Txt>
          <Txt style={{ fontSize: 12, fontWeight: '600', color: onDark ? '#fff' : colors.text }}>{dl.t}</Txt>
        </View>
      ))}
    </>
  );
}

export function Stat({ n, label, size = 26 }: { n: string | number; label: string; size?: number }) {
  const { colors } = useApp();
  return (
    <View>
      <Txt style={{ fontSize: size, fontWeight: '800', lineHeight: size, letterSpacing: -0.5 }}>{n}</Txt>
      <Txt style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.mist, marginTop: 4 }}>{label}</Txt>
    </View>
  );
}

export const styles = StyleSheet.create({
  row5: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  h2: { fontSize: 28, fontWeight: '700', lineHeight: 29.4, letterSpacing: -0.42 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  chip: { paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  button: { paddingHorizontal: 16, borderRadius: RADIUS.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 9, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BLUE, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  overlayLabel: { position: 'absolute', right: 10, bottom: 10, backgroundColor: BADGE_BG, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  thumb: { aspectRatio: 16 / 9, width: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: RADIUS.card, overflow: 'hidden' },
  panel: { borderRadius: RADIUS.card, padding: 18, gap: 12 },
  pillButton: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12 },
  markWrap: { paddingHorizontal: 2, transform: [{ translateY: 3 }] },
  mark: { paddingHorizontal: 6, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  deadline: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 10, borderRadius: 999 },
});
