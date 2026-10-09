import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { ICON } from '../../src/components/icons';
import { CastButton } from '../../src/components/media';
import { Txt } from '../../src/components/Txt';
import { Button, Eyebrow, Press } from '../../src/components/ui';
import { useApp } from '../../src/state/AppState';
import { useRadio } from '../../src/state/Radio';
import { BLUE, GUTTER } from '../../src/theme';

const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/** KAKU 88.5 FM: listen live in the app and see what's coming up. */
export default function RadioScreen() {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  const { available, playing, loading, failed, toggle, now, upcoming } = useRadio();

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={[styles.hero, { backgroundColor: colors.panel, paddingTop: insets.top + 12 }]}>
        <Eyebrow>Community radio</Eyebrow>
        <View style={{ gap: 4 }}>
          <Txt style={{ fontSize: 64, fontWeight: '700', lineHeight: 61, letterSpacing: -1.9, color: '#fff' }}>88.5</Txt>
          <Txt style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>KAKU FM</Txt>
          <Txt style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>The Voice of Maui</Txt>
        </View>
        {available ? (
          <View style={styles.playerRow}>
            <Press onPress={toggle} accessibilityRole="button" accessibilityLabel={playing ? 'Pause radio' : 'Play radio'} style={styles.play}>
              <Icon d={playing ? ICON.pause : ICON.play} size={26} color="#fff" filled />
            </Press>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Txt style={{ fontSize: 12, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
                {failed ? 'Couldn’t connect' : loading ? 'Connecting…' : playing ? 'Now playing' : 'On air now'}
              </Txt>
              <Txt style={{ fontSize: 18, fontWeight: '700', lineHeight: 21.6, color: '#fff' }} numberOfLines={2}>
                {now?.title ?? 'KAKU 88.5 FM'}
              </Txt>
              {now?.host ? <Txt style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{now.host}</Txt> : null}
            </View>
            <CastButton color="#fff" iconSize={20} border="rgba(255,255,255,0.25)" />
          </View>
        ) : null}
      </View>

      <View style={{ paddingTop: 24, paddingHorizontal: GUTTER, gap: 14 }}>
        {available ? (
          failed ? (
            <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }}>The stream didn’t start. Check your connection and tap play to try again.</Txt>
          ) : null
        ) : (
          <>
            <Txt style={{ fontSize: 16, lineHeight: 24 }}>Tune your radio to 88.5 FM, or listen live on akaku.org.</Txt>
            <Button label="Listen live on akaku.org →" height={52} fontSize={17} onPress={() => Linking.openURL('https://www.akaku.org/')} />
            <Txt style={{ fontSize: 13, lineHeight: 19.5, color: colors.mist }}>Listening here in the app is coming.</Txt>
          </>
        )}

        {upcoming.length ? (
          <View style={{ gap: 4 }}>
            <Txt style={{ fontSize: 17, fontWeight: '700', marginBottom: 6 }}>Coming up on KAKU</Txt>
            {upcoming.slice(0, 12).map(s => (
              <View key={s.start} style={[styles.slot, { borderBottomColor: colors.border }]}>
                <Txt style={{ fontSize: 14, fontWeight: '600', minWidth: 76, color: colors.mist, fontVariant: ['tabular-nums'] }}>{clock(s.start)}</Txt>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt style={{ fontSize: 15, fontWeight: '600' }}>{s.title}</Txt>
                  {s.host ? <Txt style={{ fontSize: 13, color: colors.mist }}>{s.host}</Txt> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: GUTTER, paddingBottom: 28, gap: 20, borderBottomWidth: 4, borderBottomColor: BLUE },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  play: { width: 64, height: 64, borderRadius: 32, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  slot: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, alignItems: 'baseline' },
});
