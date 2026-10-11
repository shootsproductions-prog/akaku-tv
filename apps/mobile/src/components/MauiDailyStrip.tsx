import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { dayLabel, fetchMauiWeek, groupByDay, isCurrent, pickedStories, storyTime, storyUrl, type MauiStory, type MauiWeek } from '../data/mauiDaily.ts';
import { openUrl } from '../lib/navigate';
import { useApp } from '../state/AppState';
import { BLUE, GUTTER } from '../theme';
import { ReportLink } from './IssueBits';
import { Txt } from './Txt';
import { Card, Eyebrow, Press } from './ui';

const SHOWN = 6;

function Story({ s, compact }: { s: MauiStory; compact?: boolean }) {
  const { colors } = useApp();
  return (
    <View style={[styles.story, { borderBottomColor: colors.border }]}>
      <Press onPress={() => openUrl(storyUrl(s))} accessibilityRole="link" accessibilityLabel={`Watch: ${s.headline}, ${dayLabel(s.dateISO)}, from ${storyTime(s)} in the episode`} style={{ gap: 4 }}>
        <Txt style={{ fontSize: 12, fontWeight: '600', color: colors.mist }}>{dayLabel(s.dateISO)}{s.topics[0] ? ` · ${s.topics[0]}` : ''}</Txt>
        <Txt style={{ fontSize: 17, fontWeight: '700', lineHeight: 22 }}>{s.headline}</Txt>
        {!compact && s.summary ? <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }} numberOfLines={3}>{s.summary}</Txt> : null}
        <Txt style={{ fontSize: 14, fontWeight: '600', color: BLUE }}>Watch at {storyTime(s)} →</Txt>
      </Press>
      <ReportLink ctx={{ kind: 'entry', id: s.id, label: s.headline, where: `${s.youtubeId} at ${storyTime(s)}` }} />
    </View>
  );
}

/** "This week on The Maui Daily": the picked stories, with "See all" by day. Renders nothing until there are picks. */
export function MauiDailyStrip() {
  const { colors } = useApp();
  const [week, setWeek] = useState<MauiWeek | null>(null);
  const [all, setAll] = useState(false);
  const [more, setMore] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchMauiWeek().then(w => alive && setWeek(w));
    return () => { alive = false; };
  }, []);

  if (!week || !isCurrent(week)) return null;
  const picked = pickedStories(week);
  if (!picked.length) return null;
  const top = more ? picked : picked.slice(0, SHOWN);

  return (
    <View style={styles.section}>
      <Eyebrow>This week on The Maui Daily</Eyebrow>
      <Card style={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 14 }}>
        {top.map(s => <Story key={s.id} s={s} />)}
        {picked.length > SHOWN ? (
          <Press onPress={() => setMore(m => !m)} accessibilityRole="button" style={styles.link}>
            <Txt style={{ fontSize: 15, fontWeight: '600', color: BLUE }}>{more ? 'Show fewer' : `Show ${picked.length - SHOWN} more`}</Txt>
          </Press>
        ) : null}
        <Press onPress={() => setAll(a => !a)} accessibilityRole="button" accessibilityState={{ expanded: all }} style={styles.link}>
          <Txt style={{ fontSize: 15, fontWeight: '600', color: BLUE }}>{all ? 'Hide the full list' : `See all ${week.stories.length} stories`}</Txt>
        </Press>
        {all ? groupByDay(week.stories).map(day => (
          <View key={day.dateISO} style={{ marginTop: 10 }}>
            <Txt style={{ fontSize: 13, fontWeight: '700', color: colors.mist, letterSpacing: 0.4 }}>{dayLabel(day.dateISO).toUpperCase()}</Txt>
            {day.stories.map(s => <Story key={s.id} s={s} compact />)}
          </View>
        )) : null}
        <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist, marginTop: 10 }}>
          {week.disclaimer} Headlines and summaries describe what the show said on air. They are not fact-checked.
        </Txt>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 28, marginHorizontal: GUTTER, gap: 12 },
  story: { gap: 6, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  link: { paddingVertical: 12, alignSelf: 'flex-start' },
});
