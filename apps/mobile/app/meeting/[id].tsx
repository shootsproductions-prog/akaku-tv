import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CastButton } from '../../src/components/media';
import { Txt } from '../../src/components/Txt';
import { Card, DetailHeader, Eyebrow, OverlayLabel, ProofText, ReadAloudButton, Thumb } from '../../src/components/ui';
import { DEFAULT_DISCLAIMER } from '../../src/data/issues.ts';
import { isYoutubeId, youtubeThumb } from '../../src/lib/recaps.ts';
import { voteSides } from '../../src/lib/votes.ts';
import { openVideo } from '../../src/lib/navigate';
import { useContent } from '../../src/state/Content';
import { useApp } from '../../src/state/AppState';
import { BLUE, GREEN, RED, GUTTER } from '../../src/theme';

export default function MeetingScreen() {
  const params = useLocalSearchParams<{ id: string; seek?: string }>();
  const { colors } = useApp();
  const { meetings, recapFor } = useContent();
  const m = meetings.find(x => x.id === params.id) ?? meetings[0];
  const disclaimer = recapFor(m.id)?.disclaimer ?? DEFAULT_DISCLAIMER;
  const real = isYoutubeId(m.id);
  const sides = voteSides(m);
  // Where the recording is cued. Proof marks and moments move it.
  const [seek, setSeek] = useState(params.seek || '0:00:00');
  useEffect(() => setSeek(params.seek || '0:00:00'), [params.id, params.seek]);
  // Cue the recording; for a real YouTube recording, also open it at that moment.
  const mark = (t: string) => {
    setSeek(t);
    if (real) openVideo(m.id, t);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DetailHeader right={<CastButton color={colors.text} />}>
        <Txt style={{ fontSize: 16, fontWeight: '700', lineHeight: 19.2 }}>{m.body}</Txt>
        <Txt style={{ fontSize: 12, color: colors.mist }}>
          {m.date} · {m.dur}
        </Txt>
      </DetailHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Pressable onPress={() => mark(seek)} disabled={!real} accessibilityRole="button" accessibilityLabel={`Watch the meeting recording from ${seek}`}>
          <Thumb uri={real ? youtubeThumb(m.id) : null} label="Meeting recording" dark>
            <OverlayLabel>
              <Txt style={{ fontSize: 12, color: '#fff' }}>{real ? `▶ Watch from ${seek}` : `▶ ${seek}`}</Txt>
            </OverlayLabel>
          </Thumb>
        </Pressable>
        <View style={{ paddingHorizontal: GUTTER, paddingVertical: 20, gap: 24 }}>
          <View style={{ gap: 10 }}>
            <View style={styles.spread}>
              <Eyebrow>The 90-second version</Eyebrow>
              <ReadAloudButton text={m.recap} />
            </View>
            <ProofText text={m.recap} active={seek} onRef={mark} />
            <Txt style={{ fontSize: 12, lineHeight: 17, color: colors.mist }}>{disclaimer} Tap a number to check the moment in the recording.</Txt>
            <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist }}>
              Every numbered mark is a timestamp in the recording — tap it to watch the proof. The transcript and video are the record; the recap is a guide to them.
            </Txt>
          </View>

          <View style={{ gap: 8 }}>
            <Txt style={styles.h}>What was decided</Txt>
            {m.decided.map(d => (
              <View key={d} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={styles.bullet} />
                <Txt style={{ fontSize: 15, lineHeight: 22.5, flex: 1 }}>{d}</Txt>
              </View>
            ))}
          </View>

          <View style={{ gap: 8 }}>
            <Txt style={styles.h}>What's next</Txt>
            <Txt style={{ fontSize: 15, lineHeight: 22.5, color: colors.mist }}>{m.next}</Txt>
          </View>

          <View style={{ gap: 10 }}>
            <Txt style={styles.h}>How they voted · {m.voteItem}</Txt>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {sides.length === 0 ? (
                <Txt style={{ fontSize: 15, color: colors.mist }}>No count was stated in the meeting (likely a voice vote).</Txt>
              ) : (
                sides.map(side => <Tally key={side.label} n={side.n} label={side.label} />)
              )}
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
              {m.votes.map(v => (
                <View key={v.seat} style={[styles.voteRow, { borderBottomColor: colors.border }]}>
                  <Txt style={{ fontSize: 14, flex: 1 }}>Councilmember · {v.seat}</Txt>
                  <Txt style={{ fontSize: 14, fontWeight: '700', color: v.vote === 'Aye' ? GREEN : RED }}>{v.vote}</Txt>
                </View>
              ))}
            </View>
            <Txt style={{ fontSize: 12, color: colors.mist }}>Votes read from the roll call on the recording; names link to the official minutes when posted.</Txt>
          </View>

          <View style={{ gap: 10 }}>
            <Txt style={styles.h}>Jump to a moment</Txt>
            {m.moments.map(mo => (
              <Card key={mo.t} onPress={() => mark(mo.t)} style={[styles.moment, seek === mo.t && { borderColor: BLUE }]}>
                <Txt style={{ fontSize: 14, fontWeight: '600', color: BLUE, minWidth: 60, fontVariant: ['tabular-nums'] }}>{mo.t}</Txt>
                <Txt style={{ fontSize: 14, lineHeight: 21, flex: 1 }}>{mo.q}</Txt>
              </Card>
            ))}
          </View>
          <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist }}>{disclaimer}</Txt>
        </View>
      </ScrollView>
    </View>
  );
}

function Tally({ n, label }: { n: number | null; label: string }) {
  const { colors } = useApp();
  return (
    <View>
      {n === null ? (
        <Txt style={{ fontSize: 15, fontWeight: '600', lineHeight: 28, color: colors.mist }}>Not stated</Txt>
      ) : (
        <Txt style={{ fontSize: 28, fontWeight: '700', lineHeight: 28, letterSpacing: -0.56 }}>{n}</Txt>
      )}
      <Txt style={{ fontSize: 10, fontWeight: '500', letterSpacing: 1.5, textTransform: 'uppercase', color: colors.mist, marginTop: 2 }}>{label}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h: { fontSize: 15, fontWeight: '700' },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: BLUE, marginTop: 9 },
  voteRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  moment: { flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
});
