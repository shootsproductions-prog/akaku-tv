import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../state/AppState';
import { useRadio } from '../state/Radio';
import { BLUE } from '../theme';
import { Icon } from './Icon';
import { ICON, TAB_ICON } from './icons';
import { Txt } from './Txt';

const LABELS: Record<string, { label: string; icon: string }> = {
  index: { label: 'Live', icon: TAB_ICON.live },
  meetings: { label: 'Meetings', icon: TAB_ICON.meetings },
  videos: { label: 'Videos', icon: TAB_ICON.videos },
  radio: { label: 'Radio', icon: TAB_ICON.radio },
  support: { label: 'Support', icon: TAB_ICON.support },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useApp();
  const { playing: radioOn } = useRadio();
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;

  return (
    <View>
      {radioOn && current !== 'radio' ? <MiniPlayer /> : null}
      <View style={[styles.bar, { borderTopColor: colors.border, backgroundColor: colors.tabbar, paddingBottom: Math.max(insets.bottom, 12) }]}>
        {state.routes.map((route, i) => {
          const meta = LABELS[route.name];
          if (!meta) return null;
          const focused = state.index === i;
          const color = focused ? BLUE : colors.mist;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              onPress={() => {
                const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
              }}
              style={styles.tab}
            >
              <Icon d={meta.icon} size={22} color={color} strokeWidth={1.6} />
              <Txt style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.44, color }}>{meta.label}</Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** KAKU 88.5 keeps playing above the tab bar while you browse. */
function MiniPlayer() {
  const { colors } = useApp();
  const { toggle: toggleRadio, now } = useRadio();
  return (
    <View style={[styles.mini, { backgroundColor: colors.panel }]}>
      <Txt style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>88.5</Txt>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt style={{ fontSize: 13, fontWeight: '600', color: '#fff' }} numberOfLines={1}>{now?.title ?? 'KAKU 88.5 FM'}</Txt>
        <Txt style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>KAKU 88.5 FM · live</Txt>
      </View>
      <LevelBars />
      <Pressable onPress={toggleRadio} accessibilityRole="button" accessibilityLabel="Pause radio" style={styles.miniBtn}>
        <Icon d={ICON.pause} size={16} color="#fff" filled />
      </Pressable>
    </View>
  );
}

function LevelBars() {
  const bars = useRef([0, 1, 2, 3].map(() => new Animated.Value(0.25))).current;
  useEffect(() => {
    const loops = bars.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(v, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.25, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [bars]);
  return (
    <View style={styles.levels}>
      {bars.map((v, i) => (
        <Animated.View key={i} style={[styles.level, { transform: [{ translateY: 8 }, { scaleY: v }, { translateY: -8 }] }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 6, paddingHorizontal: 4 },
  tab: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', gap: 4 },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  miniBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  levels: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 16 },
  level: { width: 3, height: 16, borderRadius: 1, backgroundColor: BLUE },
});
