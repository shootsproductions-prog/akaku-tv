import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '../../src/components/Txt';
import { Button, Eyebrow } from '../../src/components/ui';
import { useApp } from '../../src/state/AppState';
import { BLUE, GUTTER } from '../../src/theme';

/** KAKU 88.5 FM. The in-app stream and show schedule arrive once Akakū provides the stream address and a schedule feed. */
export default function RadioScreen() {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={[styles.hero, { backgroundColor: colors.panel, paddingTop: insets.top + 12 }]}>
        <Eyebrow>Community radio</Eyebrow>
        <View style={{ gap: 4 }}>
          <Txt style={{ fontSize: 64, fontWeight: '700', lineHeight: 61, letterSpacing: -1.9, color: '#fff' }}>88.5</Txt>
          <Txt style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>KAKU FM</Txt>
          <Txt style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>The Voice of Maui</Txt>
        </View>
      </View>

      <View style={{ paddingTop: 24, paddingHorizontal: GUTTER, gap: 14 }}>
        <Txt style={{ fontSize: 16, lineHeight: 24 }}>Tune your radio to 88.5 FM, or listen live on akaku.org.</Txt>
        <Button label="Listen live on akaku.org →" height={52} fontSize={17} onPress={() => Linking.openURL('https://www.akaku.org/')} />
        <Txt style={{ fontSize: 13, lineHeight: 19.5, color: colors.mist }}>Listening here in the app, with today’s shows, is coming.</Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: GUTTER, paddingBottom: 28, gap: 20, borderBottomWidth: 4, borderBottomColor: BLUE },
});
