import { ScrollView, View } from 'react-native';

import { isHeatingUp, whyRanked, type Basis, type CatalogIssue, type TimelineEntry } from '../data/catalog.ts';
import { openUrl, openVideo } from '../lib/navigate';
import { useApp } from '../state/AppState';
import { BLUE, GUTTER } from '../theme';
import { FollowToggle, IssueTags, SampleTag } from './IssueBits';
import { Txt } from './Txt';
import { DetailHeader, Eyebrow, Panel, Press, Stat, Tag } from './ui';

const BASIS_LABEL: Record<Basis, string> = {
  'said-at-meeting': 'Said at a meeting',
  confirmed: 'Confirmed by two records',
  conflicting: 'Sources disagree',
};
const SOURCE_LABEL: Record<string, string> = {
  meeting: 'Meeting video',
  'county-release': 'County releases',
  'county-page': 'County pages',
  other: 'Other public sources',
};

const day = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

/** Entries that disagree are shown together, both sides, under one heading. */
function group(entries: TimelineEntry[]): TimelineEntry[][] {
  const out: TimelineEntry[][] = [];
  const seen = new Map<string, TimelineEntry[]>();
  for (const e of entries) {
    if (!e.conflictGroup) {
      out.push([e]);
      continue;
    }
    const g = seen.get(e.conflictGroup);
    if (g) g.push(e);
    else {
      const fresh = [e];
      seen.set(e.conflictGroup, fresh);
      out.push(fresh);
    }
  }
  return out;
}

function Proof({ e }: { e: TimelineEntry }) {
  const { colors } = useApp();
  const s = e.source;
  if (s.type === 'meeting') {
    return (
      <Press onPress={() => openVideo(s.videoId, s.ts)} accessibilityRole="link" style={{ alignSelf: 'flex-start', paddingVertical: 4 }}>
        <Txt style={{ fontSize: 14, fontWeight: '700', color: BLUE, fontVariant: ['tabular-nums'] }}>▶ Watch at {s.ts}</Txt>
      </Press>
    );
  }
  return (
    <View style={{ gap: 4 }}>
      <Txt style={{ fontSize: 13, lineHeight: 19, fontStyle: 'italic', color: colors.mist }}>“{s.quote}”</Txt>
      <Press onPress={() => openUrl(s.url)} accessibilityRole="link" style={{ alignSelf: 'flex-start', paddingVertical: 4 }}>
        <Txt style={{ fontSize: 14, fontWeight: '700', color: BLUE }}>Read it on {s.publisher} →</Txt>
      </Press>
    </View>
  );
}

function Entry({ e }: { e: TimelineEntry }) {
  const { colors } = useApp();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Txt style={{ fontSize: 12, fontWeight: '600', color: colors.mist }}>{e.body ? `${day(e.dateISO)} · ${e.body}` : day(e.dateISO)}</Txt>
        <Tag label={BASIS_LABEL[e.basis]} tone={e.basis === 'confirmed' ? 'blue' : 'wash'} />
      </View>
      <Txt style={{ fontSize: 16, lineHeight: 24 }}>{e.text}</Txt>
      <Proof e={e} />
    </View>
  );
}

export function CatalogIssueScreen({ issue }: { issue: CatalogIssue }) {
  const { colors } = useApp();
  const groups = group(issue.timeline);
  const heating = issue.status !== 'resolved' && isHeatingUp(issue.signals);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DetailHeader right={<FollowToggle slug={issue.slug} />}>
        <Eyebrow>Issue</Eyebrow>
        <Txt style={{ fontSize: 18, fontWeight: '700', lineHeight: 21.6 }} numberOfLines={2}>{issue.title}</Txt>
      </DetailHeader>
      <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingVertical: 20, paddingBottom: 40, gap: 24 }}>
        <View style={{ gap: 10 }}>
          <SampleTag />
          <IssueTags issue={issue} />
          <Txt style={{ fontSize: 16, lineHeight: 24 }}>{issue.summary}</Txt>
          <Txt style={{ fontSize: 13, lineHeight: 19, color: colors.mist }}>
            {whyRanked(issue)}
            {heating ? ' · Heating up' : ''}
          </Txt>
        </View>

        <View style={{ flexDirection: 'row', gap: 18 }}>
          <Stat n={issue.signals.meetingsLast30d} label="meetings, 30 days" />
          <Stat n={issue.timeline.length} label="developments" />
          <Stat n={day(issue.firstSeenISO)} label="tracking since" size={16} />
        </View>

        {issue.signals.upcomingEvent ? (
          <Panel>
            <Eyebrow color="rgba(255,255,255,0.7)">Coming up</Eyebrow>
            <Txt style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>
              {issue.signals.upcomingEvent.what} · {day(issue.signals.upcomingEvent.dateISO)}
            </Txt>
          </Panel>
        ) : null}

        {groups.length === 0 ? (
          <Panel>
            <Txt style={{ fontSize: 18, fontWeight: '700', lineHeight: 22, color: '#fff' }}>Nothing new lately.</Txt>
            <Txt style={{ fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.9)' }}>
              We last heard this discussed in a recorded meeting on {day(issue.lastSeenISO)}. Follow it and new developments appear here.
            </Txt>
          </Panel>
        ) : (
          <View style={{ gap: 22 }}>
            <Eyebrow>What’s happened</Eyebrow>
            {groups.map((g, i) =>
              g.length > 1 ? (
                <View key={i} style={{ gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}>
                  <Txt style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Sources disagree. Here is each one.</Txt>
                  {g.map((e, j) => (
                    <Entry key={j} e={e} />
                  ))}
                </View>
              ) : (
                <Entry key={i} e={g[0]} />
              ),
            )}
          </View>
        )}

        <View style={{ gap: 6 }}>
          <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist }}>
            From Akakū’s recorded meetings{issue.sourceTypes.some(t => t !== 'meeting') ? ` and ${issue.sourceTypes.filter(t => t !== 'meeting').map(t => SOURCE_LABEL[t].toLowerCase()).join(', ')}` : ''}. Last updated {day(issue.lastSeenISO)}.
          </Txt>
          <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist }}>{issue.disclaimer}</Txt>
        </View>
      </ScrollView>
    </View>
  );
}
