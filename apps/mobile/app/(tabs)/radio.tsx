import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { ICON } from '../../src/components/icons';
import { CastButton } from '../../src/components/media';
import { Txt } from '../../src/components/Txt';
import { Eyebrow, Press } from '../../src/components/ui';
import { RADIO_SCHEDULE } from '../../src/data/radio';
import { useApp } from '../../src/state/AppState';
import { BLUE, GUTTER } from '../../src/theme';

export default function RadioScreen() {
  const { colors, radioOn, toggleRadio } = useApp();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const now = RADIO_SCHEDULE.find(r => r.now);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      {focused ? <StatusBar style="light" /> : null}
      <View style={[styles.hero, { backgroundColor: colors.panel, paddingTop: insets.top + 12 }]}>
        <Eyebrow>Community radio</Eyebrow>
        <View style={{ gap: 4 }}>
          <Txt style={{ fontSize: 64, fontWeight: '700', lineHeight: 61, letterSpacing: -1.9, color: '#fff' }}>88.5</Txt>
          <Txt style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>KAKU FM</Txt>
          <Txt style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>The Voice of Maui · Kahului</Txt>
        </View>
        <View style={styles.playerRow}>
          <Press onPress={toggleRadio} accessibilityRole="button" accessibilityLabel={radioOn ? 'Pause radio' : 'Play radio'} style={styles.play}>
            <Icon d={radioOn ? ICON.pause : ICON.play} size={26} color="#fff" filled />
          </Press>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Txt style={{ fontSize: 12, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>{radioOn ? 'Now playing' : 'On air now'}</Txt>
            <Txt style={{ fontSize: 18, fontWeight: '700', lineHeight: 21.6, color: '#fff' }}>{now?.show}</Txt>
            <Txt style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{now?.host}</Txt>
          </View>
          <CastButton color="#fff" iconSize={20} border="rgba(255,255,255,0.25)" />
        </View>
      </View>

      <View style={{ paddingTop: 24, paddingHorizontal: GUTTER, gap: 12 }}>
        <Txt style={{ fontSize: 17, fontWeight: '700' }}>Today on KAKU</Txt>
        <View>
          {RADIO_SCHEDULE.map(r => (
            <View key={r.time} style={[styles.slot, { borderBottomColor: colors.border }]}>
              <Txt style={{ fontSize: 14, fontWeight: '600', minWidth: 64, color: r.now ? BLUE : colors.mist, fontVariant: ['tabular-nums'] }}>{r.time}</Txt>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt style={{ fontSize: 15, fontWeight: '600' }}>{r.show}</Txt>
                <Txt style={{ fontSize: 13, color: colors.mist }}>{r.host}</Txt>
              </View>
            </View>
          ))}
        </View>
        <Txt style={{ fontSize: 13, lineHeight: 19.5, color: colors.mist, marginTop: 8 }}>Want your voice on 88.5? Akakū trains community hosts. Ask at the Support tab.</Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: GUTTER, paddingBottom: 28, gap: 20, borderBottomWidth: 4, borderBottomColor: BLUE },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  play: { width: 64, height: 64, borderRadius: 32, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  slot: { flexDirection: 'row', gap: 16, paddingVertical: 12, borderBottomWidth: 1, alignItems: 'baseline' },
});
