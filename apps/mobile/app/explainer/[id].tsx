import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { SourceRow } from '../../src/components/SourceRow';
import { Txt } from '../../src/components/Txt';
import { AIBadge, Card, DetailHeader, Eyebrow, Panel, ProofText, ReadAloudButton } from '../../src/components/ui';
import { EXPLAINERS } from '../../src/data/countyWatch';
import { plainText } from '../../src/lib/segments';
import { openTarget } from '../../src/lib/navigate';
import { useApp } from '../../src/state/AppState';
import { BLUE, BLUE_SOFT, FONT } from '../../src/theme';

export default function ExplainerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useApp();
  const ex = EXPLAINERS.find(e => e.id === id) ?? EXPLAINERS[0];
  const [activeEx, setActiveEx] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState('');

  const onRef = (key: string) => {
    const src = ex.sources.find(x => String(x.n) === key);
    if (!src) return;
    setActiveEx(key);
    setTimeout(() => openTarget(src), 350);
  };

  const listenText = [ex.q, ex.short, ...ex.reasons.map(r => `${r.title}. ${plainText(r.text)}`)].join(' ');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DetailHeader right={<ReadAloudButton text={listenText} label="Listen" />}>
        <AIBadge />
        <Txt style={{ fontSize: 12, color: colors.mist }}>{ex.basis}</Txt>
      </DetailHeader>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 26 }} keyboardShouldPersistTaps="handled">
        <Txt style={{ fontSize: 28, fontWeight: '700', lineHeight: 30.8, letterSpacing: -0.42 }}>{ex.q}</Txt>

        <Panel style={{ gap: 8 }}>
          <Eyebrow color={BLUE_SOFT}>The short answer</Eyebrow>
          <Txt style={{ fontSize: 19, fontWeight: '700', lineHeight: 23.75, letterSpacing: -0.19, color: '#fff' }}>{ex.short}</Txt>
        </Panel>

        <View style={{ gap: 12 }}>
          <Txt style={styles.h}>The real reasons, in order of weight</Txt>
          {ex.reasons.map(r => (
            <Card key={r.title} style={styles.reason}>
              <View style={{ alignItems: 'center', gap: 4, minWidth: 44 }}>
                <Txt style={{ fontSize: 24, fontWeight: '800', lineHeight: 24, color: BLUE }}>{r.pct}</Txt>
                <Txt style={{ fontSize: 9, letterSpacing: 1.08, textTransform: 'uppercase', color: colors.mist }}>of the talk</Txt>
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                <Txt style={{ fontSize: 15, fontWeight: '700', lineHeight: 19.5 }}>{r.title}</Txt>
                <ProofText text={r.text} active={activeEx} onRef={onRef} size={14} lineHeight={21.7} />
              </View>
            </Card>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <Txt style={styles.h}>How we got here</Txt>
          <View>
            {ex.history.map(h => (
              <Pressable key={h.year + h.what} onPress={() => openTarget(h)} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                <Txt style={{ fontSize: 15, fontWeight: '800', minWidth: 44, color: BLUE }}>{h.year}</Txt>
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                  <Txt style={{ fontSize: 14, fontWeight: '600', lineHeight: 18.9 }}>{h.what}</Txt>
                  <Txt style={{ fontSize: 12, color: colors.mist }}>{h.src}</Txt>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.grid}>
          <InfoTile label="Who decides" body={ex.who} />
          <InfoTile label="What would change it" body={ex.lever} />
        </View>

        <View style={{ gap: 10 }}>
          <Txt style={styles.h}>Sources</Txt>
          {ex.sources.map(src => (
            <SourceRow key={src.n} src={src} active={activeEx === String(src.n)} />
          ))}
        </View>

        {/* Follow-up answers come from Akakū Intelligence once the transcript index is live. */}
        <View style={[styles.ask, { borderColor: colors.border }]}>
          <TextInput
            value={followUp}
            onChangeText={setFollowUp}
            placeholder="Ask a follow-up…"
            placeholderTextColor={colors.mist}
            style={{ flex: 1, minWidth: 0, fontSize: 15, fontFamily: FONT, color: colors.text, paddingVertical: 0 }}
          />
          <View style={styles.askBtn}>
            <Txt style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Ask</Txt>
          </View>
        </View>
        <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist }}>
          Built from transcripts of {ex.meetings} public meetings on Akakū's YouTube channel and Channel 53 archive. Percentages are the share of discussion time on this question. Nothing here comes from outside the public record.
        </Txt>
      </ScrollView>
    </View>
  );
}

function InfoTile({ label, body }: { label: string; body: string }) {
  const { colors } = useApp();
  return (
    <View style={[styles.tile, { backgroundColor: colors.surface }]}>
      <Txt style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.mist, fontWeight: '700' }}>{label}</Txt>
      <Txt style={{ fontSize: 13, lineHeight: 18.85 }}>{body}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 15, fontWeight: '700' },
  reason: { flexDirection: 'row', gap: 14, padding: 14 },
  historyRow: { flexDirection: 'row', gap: 14, paddingVertical: 12, borderBottomWidth: 1 },
  grid: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, padding: 14, borderRadius: 14, gap: 6 },
  ask: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 999, paddingLeft: 16, paddingRight: 6, height: 52 },
  askBtn: { height: 40, paddingHorizontal: 16, borderRadius: 999, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
});
