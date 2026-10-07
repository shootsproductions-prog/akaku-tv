import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CastButton, LiveVideo } from '../../src/components/media';
import { Txt } from '../../src/components/Txt';
import { DetailHeader, Eyebrow, LiveBadge, Press, Thumb } from '../../src/components/ui';
import { CHANNELS } from '../../src/data/channels';
import { useApp } from '../../src/state/AppState';
import { BLUE, BLUE_TINT, GUTTER } from '../../src/theme';

export default function PlayerScreen() {
  const { num } = useLocalSearchParams<{ num: string }>();
  const { colors, castDevice, setCastDevice } = useApp();
  const ch = CHANNELS.find(c => String(c.num) === num) ?? CHANNELS[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <View style={{ backgroundColor: '#000' }}>
        <DetailHeader dark right={<CastButton color="#fff" />}>
          <Txt style={{ fontSize: 17, fontWeight: '700', color: '#fff' }} numberOfLines={1}>
            Channel {ch.num} · {ch.name}
          </Txt>
        </DetailHeader>
        {castDevice ? (
          <View style={styles.castBar}>
            <Txt style={{ fontSize: 13, color: '#fff', flexShrink: 1 }}>
              Playing on <Txt style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>{castDevice}</Txt>
            </Txt>
            <Pressable onPress={() => setCastDevice(null)} accessibilityRole="button" style={styles.stop}>
              <Txt style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>Stop</Txt>
            </Pressable>
          </View>
        ) : null}
        <Thumb uri={ch.thumbnailUrl} label={`Live stream · Channel ${ch.num}`} dark>
          {ch.hlsUrl ? <LiveVideo key={ch.hlsUrl} uri={ch.hlsUrl} /> : null}
          <View style={styles.liveTag} pointerEvents="none">
            <LiveBadge />
          </View>
        </Thumb>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12, paddingHorizontal: 16 }}>
          {CHANNELS.map(c => {
            const on = c.num === ch.num;
            return (
              <Press
                key={c.num}
                onPress={() => router.setParams({ num: String(c.num) })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.pill, { borderColor: on ? BLUE : 'rgba(255,255,255,0.3)', backgroundColor: on ? BLUE : 'transparent' }]}
              >
                <Txt style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                  {c.num} · {c.short}
                </Txt>
              </Press>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingVertical: 20, paddingBottom: 40 }}>
        {/* The schedule and live-transcript copy below is demo content. Show it only until a real stream is wired. */}
        {ch.hlsUrl ? (
          <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }}>{ch.desc}</Txt>
        ) : (
          <>
            <Eyebrow>On now</Eyebrow>
            <Txt style={{ fontSize: 22, fontWeight: '700', lineHeight: 25.3, marginTop: 6, marginBottom: 4 }}>{ch.now}</Txt>
            <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist, marginBottom: 20 }}>{ch.desc}</Txt>
            {ch.isGov ? (
              <Press onPress={() => router.navigate('/meetings')} style={styles.transcript}>
                <Txt style={{ fontSize: 15, fontWeight: '700' }}>Live transcript running</Txt>
                <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }}>Search this meeting while it happens. Recap and vote record post within an hour of adjournment.</Txt>
              </Press>
            ) : null}
            <Txt style={{ fontSize: 15, fontWeight: '700', marginBottom: 8 }}>Tonight on {ch.num}</Txt>
            {ch.guide.map(g => (
              <View key={g.t + g.s} style={[styles.guideRow, { borderBottomColor: colors.border }]}>
                <Txt style={{ fontSize: 14, fontWeight: '600', minWidth: 68, color: colors.mist, fontVariant: ['tabular-nums'] }}>{g.t}</Txt>
                <Txt style={{ fontSize: 15, flex: 1 }}>{g.s}</Txt>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  castBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: BLUE },
  stop: { height: 30, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', justifyContent: 'center' },
  liveTag: { position: 'absolute', top: 10, left: 10 },
  pill: { height: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, justifyContent: 'center' },
  transcript: { borderWidth: 1, borderColor: BLUE, backgroundColor: BLUE_TINT, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, gap: 6, marginBottom: 20 },
  guideRow: { flexDirection: 'row', gap: 16, paddingVertical: 10, borderBottomWidth: 1 },
});
