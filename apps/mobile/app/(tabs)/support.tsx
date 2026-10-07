import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { ICON } from '../../src/components/icons';
import { YouTubeEmbed } from '../../src/components/media';
import { Txt } from '../../src/components/Txt';
import { Button, Eyebrow, Panel, Press } from '../../src/components/ui';
import { useApp } from '../../src/state/AppState';
import { BLUE, BLUE_SOFT, GUTTER } from '../../src/theme';

/** "Our story" — the welcome video on akaku.org/about. */
const STORY_VIDEO = '84dtX0NDPN0';
const FACTS = [
  { n: '1992', label: 'On the air since' },
  { n: '3 + 1', label: 'TV channels + KAKU 88.5' },
  { n: '2', label: 'Studios · Kahului, Kaunakakai' },
  { n: '501(c)(3)', label: 'Community nonprofit' },
];

export default function SupportScreen() {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  const [story, setStory] = useState(false);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={['rgba(12,128,226,0.10)', colors.bg, colors.bg]} locations={[0, 0.6, 1]} style={styles.hero}>
        <Eyebrow>Sustaining members</Eyebrow>
        <Txt style={{ fontSize: 28, fontWeight: '700', lineHeight: 29.4, letterSpacing: -0.42 }}>
          Everything here stays free. <Txt style={{ fontSize: 28, lineHeight: 29.4, color: BLUE }}>This is how.</Txt>
        </Txt>
        <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist, marginTop: 4 }}>
          Live channels, Meeting Watch, KAKU, the archive — no paywall, ever. Members keep the lights on at 333 Dairy Road.
        </Txt>
      </LinearGradient>

      <View style={{ paddingHorizontal: GUTTER, paddingBottom: 24, gap: 14 }}>
        <View style={styles.story}>
          {story ? (
            <YouTubeEmbed id={STORY_VIDEO} title="Our story — Akakū" />
          ) : (
            <>
              <Image source={{ uri: `https://i.ytimg.com/vi/${STORY_VIDEO}/maxresdefault.jpg` }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel="Akakū — our story" />
              <LinearGradient colors={['rgba(14,18,24,0)', 'rgba(14,18,24,0.75)']} locations={[0.4, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
              <Press onPress={() => setStory(true)} accessibilityRole="button" accessibilityLabel="Play our story" style={styles.storyPlay}>
                <Icon d={ICON.play} size={26} color="#fff" filled />
              </Press>
              <View style={styles.storyCaption} pointerEvents="none">
                <Txt style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: BLUE_SOFT, fontWeight: '700' }}>Our story</Txt>
                <Txt style={{ fontSize: 17, fontWeight: '700', lineHeight: 20.4, color: '#fff' }}>Akakū means a reflection — as in a mirror.</Txt>
              </View>
            </>
          )}
        </View>

        <Txt style={{ fontSize: 15, lineHeight: 24 }}>
          Since 1992 Akakū has been reflecting Maui back to itself. It is Maui's only daily local TV newsroom, the only place every Council and commission meeting airs start to finish, and the only studio where anyone in Maui Nui can learn to tell their own story — for free.
        </Txt>

        <View style={styles.facts}>
          {FACTS.map(f => (
            <View key={f.n} style={[styles.fact, { backgroundColor: colors.surface }]}>
              <Txt style={{ fontSize: 24, fontWeight: '800', lineHeight: 24, letterSpacing: -0.48 }}>{f.n}</Txt>
              <Txt style={{ fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: colors.mist }}>{f.label}</Txt>
            </View>
          ))}
        </View>

        <Panel style={{ gap: 10 }}>
          <Eyebrow color={BLUE_SOFT}>Why it matters here</Eyebrow>
          <Txt style={{ fontSize: 19, fontWeight: '700', lineHeight: 23.75, letterSpacing: -0.19, color: '#fff' }}>On an island, there is no second newsroom down the road.</Txt>
          <Txt style={{ fontSize: 14, lineHeight: 21.7, color: 'rgba(255,255,255,0.85)' }}>
            When the fires came, Akakū was the lifeline channel. When the Council votes, Akakū is the only camera in the room. When a kupuna in Hāna or a student in Kaunakakai has something to say, Akakū is the microphone. Local media works best when it stays local — and it only stays if the community carries it.
          </Txt>
        </Panel>
      </View>

      <View style={{ paddingHorizontal: GUTTER, gap: 14 }}>
        <Txt style={{ fontSize: 17, fontWeight: '700' }}>Become a sustaining member</Txt>
        <Txt style={{ fontSize: 14, lineHeight: 22, color: colors.mist }}>Memberships and gifts are handled securely on akaku.org.</Txt>
        <Button label="Give or join at akaku.org →" height={52} fontSize={17} onPress={() => Linking.openURL('https://www.akaku.org/')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 12, paddingHorizontal: GUTTER, paddingBottom: 24, gap: 6 },
  story: { aspectRatio: 16 / 9, marginHorizontal: -GUTTER, overflow: 'hidden', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  storyPlay: { width: 64, height: 64, borderRadius: 32, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', shadowColor: BLUE, shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  storyCaption: { position: 'absolute', left: 16, right: 16, bottom: 14, gap: 2 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fact: { flexGrow: 1, flexBasis: '45%', padding: 14, borderRadius: 12, gap: 2 },
  segmented: { flexDirection: 'row', borderRadius: 8, padding: 4 },
  segment: { flex: 1, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { shadowColor: '#0e1218', shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  amount: { flex: 1, height: 56, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  custom: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 8, height: 48, paddingHorizontal: 14 },
  protect: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 10, marginTop: 8 },
});
