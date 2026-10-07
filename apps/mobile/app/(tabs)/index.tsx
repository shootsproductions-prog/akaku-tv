import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { ICON } from '../../src/components/icons';
import { Txt } from '../../src/components/Txt';
import { Card, Eyebrow, H2, LiveBadge, Press, Thumb } from '../../src/components/ui';
import { CHANNELS } from '../../src/data/channels';
import { freshFrame } from '../../src/data/liveFeeds';
import { fetchSchedule, nowNext, type Schedule } from '../../src/data/schedule';
import { openPlayer } from '../../src/lib/navigate';
import { useApp } from '../../src/state/AppState';
import { useContent } from '../../src/state/Content';
import { BLUE, GREEN, GUTTER, RED } from '../../src/theme';

// Colour bar + number per channel, matching the broadcast branding.
const EDGE: Record<number, string> = { 55: BLUE, 54: RED, 53: GREEN };
const clockTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function LiveScreen() {
  const { colors, isDark, toggleTheme, kupuna, toggleKupuna } = useApp();
  const { source, meetings } = useContent();
  const latest = meetings[0];
  const insets = useSafeAreaInsets();
  const [frameStamp] = useState(() => Date.now());
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    let alive = true;
    const load = () => fetchSchedule().then(r => alive && r && setSchedule(r));
    load();
    const poll = setInterval(load, 60 * 1000);
    const tick = setInterval(() => setClock(Date.now()), 30 * 1000);
    return () => { alive = false; clearInterval(poll); clearInterval(tick); };
  }, []);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}>
      <LinearGradient colors={['rgba(12,128,226,0.10)', colors.bg, colors.bg]} locations={[0, 0.6, 1]} style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.brand}>
            <Image source={require('../../assets/akaku-logo-mark.png')} style={styles.logo} accessibilityLabel="Akakū" />
            <Txt style={{ fontSize: 24, fontWeight: '800', letterSpacing: -0.48, lineHeight: 24 }}>Akakū</Txt>
            <Eyebrow>Maui</Eyebrow>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Press onPress={toggleTheme} accessibilityRole="button" accessibilityLabel="Light or dark" style={[styles.roundBtn, { borderColor: colors.border }]}>
              <Icon d={isDark ? ICON.moon : ICON.sun} size={18} color={colors.text} />
            </Press>
            <Press
              onPress={toggleKupuna}
              accessibilityRole="switch"
              accessibilityState={{ checked: kupuna }}
              accessibilityLabel="Large type"
              style={[styles.roundBtn, { borderColor: colors.border, backgroundColor: kupuna ? colors.text : colors.bg, paddingHorizontal: 12, width: undefined, minWidth: 44 }]}
            >
              <Txt style={{ fontSize: 15, fontWeight: '700', color: kupuna ? colors.bg : colors.text }}>Aa</Txt>
            </Press>
          </View>
        </View>
        <View style={{ marginTop: 22, gap: 6 }}>
          <Eyebrow>Watch live</Eyebrow>
          <H2>Three channels, streaming now from Maui Nui.</H2>
        </View>
      </LinearGradient>

      <View style={{ paddingTop: 12 }}>
        {CHANNELS.map(ch => {
          const { now, next, progress } = nowNext(schedule?.[ch.num], clock);
          const edge = EDGE[ch.num] ?? BLUE;
          return (
            <View key={ch.num} style={{ borderTopWidth: 4, borderTopColor: edge, marginBottom: 14, backgroundColor: colors.bg }}>
              <Press onPress={() => openPlayer(ch.num)} accessibilityLabel={`Watch Channel ${ch.num}${now ? `, on now ${now.title}` : ''}`}>
                <Thumb uri={schedule?.[ch.num]?.thumb ?? freshFrame(ch.thumbnailUrl, frameStamp)} label={`Channel ${ch.num} live frame`}>
                  <View style={styles.playWrap} pointerEvents="none">
                    <View style={styles.play}>
                      <Icon d={ICON.play} size={26} color={BLUE} />
                    </View>
                  </View>
                  {now ? (
                    <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.78)']} style={styles.onNow}>
                      <Eyebrow color="rgba(255,255,255,0.8)">On now</Eyebrow>
                      <Txt style={{ fontSize: 20, fontWeight: '800', lineHeight: 24, color: '#fff' }} numberOfLines={2}>{now.title}</Txt>
                      <View style={styles.track}>
                        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
                      </View>
                    </LinearGradient>
                  ) : null}
                </Thumb>
              </Press>
              <View style={styles.chRow}>
                <Txt style={{ fontSize: 40, fontWeight: '800', lineHeight: 40, letterSpacing: -1.5, color: edge, minWidth: 56 }}>{ch.num}</Txt>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Txt style={{ fontSize: 18, fontWeight: '700', lineHeight: 22 }} numberOfLines={1}>{ch.name}</Txt>
                  {next ? (
                    <Txt style={{ fontSize: 14, color: colors.mist }} numberOfLines={1}>Next {clockTime(next.start)} · {next.title}</Txt>
                  ) : ch.hlsUrl ? null : (
                    <Txt style={{ fontSize: 14, color: colors.mist }} numberOfLines={1}>Next · {ch.next}</Txt>
                  )}
                </View>
                <LiveBadge />
              </View>
            </View>
          );
        })}
      </View>

      {source === 'live' ? (
        <View style={styles.section}>
          <Eyebrow>Latest from County Watch</Eyebrow>
          <Card onPress={() => router.navigate({ pathname: '/meeting/[id]', params: { id: latest.id, seek: '0:00:00' } })} style={{ padding: 18, gap: 10 }}>
            <Txt style={{ fontSize: 12, fontWeight: '600', color: colors.mist }}>{latest.date} · {latest.body}</Txt>
            <Txt style={{ fontSize: 17, fontWeight: '700', lineHeight: 22 }}>{latest.summary}</Txt>
            <Txt style={{ fontSize: 15, fontWeight: '600', color: BLUE }}>Read the recap →</Txt>
          </Card>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Eyebrow>County Watch</Eyebrow>
            <Card onPress={() => router.navigate('/meetings')} style={{ padding: 18, gap: 10 }}>
              <Txt style={{ fontSize: 19, fontWeight: '700', lineHeight: 22.8 }}>Your county, this week: 3 things happened, 2 deadlines, 1 thing to watch.</Txt>
              <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }}>
                Storm recovery money, a new housing program, and a vote that got pushed. Read it in 90 seconds — every line linked to its proof. Powered by Akakū Intelligence.
              </Txt>
              <Txt style={{ fontSize: 15, fontWeight: '600', color: BLUE }}>Read this week's brief →</Txt>
            </Card>
          </View>

          <View style={styles.section}>
            <Eyebrow>Maui's daily news show</Eyebrow>
            <Card>
              <Thumb label="Latest Maui Daily thumbnail" />
              <View style={{ padding: 16, gap: 6 }}>
                <Txt style={{ fontSize: 19, fontWeight: '700', lineHeight: 22.8 }}>The Maui Daily</Txt>
                <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }}>Latest episode · Friday, October 2. New episodes 7 PM across all Akakū platforms.</Txt>
              </View>
            </Card>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 12, paddingHorizontal: GUTTER, paddingBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { height: 28, width: 36, resizeMode: 'contain' },
  roundBtn: { height: 44, width: 44, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  playWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  play: { height: 64, width: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },
  onNow: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: GUTTER, paddingTop: 28, paddingBottom: 12, gap: 2 },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 8, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: '#fff' },
  chRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: GUTTER },
  section: { marginTop: 28, marginHorizontal: GUTTER, gap: 12 },
});
