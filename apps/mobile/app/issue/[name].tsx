import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '../../src/components/Icon';
import { SourceRow } from '../../src/components/SourceRow';
import { ICON } from '../../src/components/icons';
import { Txt } from '../../src/components/Txt';
import { AIBadge, Button, Deadlines, DetailHeader, Eyebrow, Panel, ProofText, ReadAloudButton, Stat, Tag } from '../../src/components/ui';
import { EMPTY_ISSUE, ISSUES } from '../../src/data/countyWatch';
import { DEFAULT_DISCLAIMER, isIssueLabel } from '../../src/data/issues.ts';
import type { IssueLabel } from '../../src/data/types';
import type { IssueEntry } from '../../src/lib/recaps.ts';
import { useContent } from '../../src/state/Content';
import { openTarget } from '../../src/lib/navigate';
import { useApp } from '../../src/state/AppState';
import { BLUE, BLUE_SOFT, BLUE_TINT, GUTTER } from '../../src/theme';

export default function IssueScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  // The four tracked issues are built from published meetings. Other names are the demo issue pages.
  if (isIssueLabel(name)) return <LiveIssueScreen label={name} />;
  return <DemoIssueScreen name={name} />;
}

function FollowPill({ name }: { name: string }) {
  const { colors, isFollowing, toggleFollow } = useApp();
  const following = isFollowing(name);
  return (
    <Pressable
      onPress={() => toggleFollow(name)}
      accessibilityRole="switch"
      accessibilityState={{ checked: following }}
      style={[styles.follow, { borderColor: following ? BLUE : colors.border, backgroundColor: following ? BLUE : 'transparent' }]}
    >
      <Icon d={ICON.bell} size={13} color={following ? '#fff' : colors.text} strokeWidth={2.2} />
      <Txt style={{ fontSize: 12, fontWeight: '700', color: following ? '#fff' : colors.text }}>{following ? 'Following' : 'Follow'}</Txt>
    </Pressable>
  );
}

function LiveIssueScreen({ label }: { label: IssueLabel }) {
  const { colors } = useApp();
  const { issuesByLabel } = useContent();
  const entries = issuesByLabel[label] ?? [];
  const sourceCount = entries.reduce((n, e) => n + e.issue.sources.length, 0);
  const oldest = entries.length ? entries[entries.length - 1].recap.meeting.date.replace(/^[A-Za-z]{3},\s*/, '') : '—';
  const disclaimer = entries[0]?.recap.disclaimer ?? DEFAULT_DISCLAIMER;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DetailHeader right={<FollowPill name={label} />}>
        <Txt style={{ fontSize: 11, letterSpacing: 3.3, textTransform: 'uppercase', color: BLUE, fontWeight: '600' }}>Issue</Txt>
        <Txt style={{ fontSize: 18, fontWeight: '700', lineHeight: 21.6 }}>{label}</Txt>
      </DetailHeader>
      <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingVertical: 20, paddingBottom: 32, gap: 26 }}>
        <View style={{ flexDirection: 'row', gap: 18 }}>
          <Stat n={entries.length} label="developments" />
          <Stat n={sourceCount} label="sources" />
          <Stat n={oldest} label="tracking since" />
        </View>
        {entries.length === 0 ? (
          <Panel>
            <Txt style={{ fontSize: 18, fontWeight: '700', lineHeight: 22, color: '#fff' }}>Nothing on {label} yet.</Txt>
            <Txt style={{ fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.9)' }}>
              This page fills in when a recorded meeting discusses {label.toLowerCase()}. Follow it and you will see new developments here.
            </Txt>
          </Panel>
        ) : (
          entries.map(e => <LiveIssueEntry key={e.recap.videoId + e.issue.oneLine} entry={e} />)
        )}
        <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist }}>{disclaimer}</Txt>
      </ScrollView>
    </View>
  );
}

/** One meeting's development on an issue, with its own footnotes. */
function LiveIssueEntry({ entry }: { entry: IssueEntry }) {
  const { colors } = useApp();
  const { recap, issue } = entry;
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const goSrc = (key: string) => {
    const src = issue.sources.find(x => String(x.n) === key);
    if (!src) return;
    setActiveSrc(key);
    setTimeout(() => openTarget(src), 350);
  };
  return (
    <View style={{ gap: 14 }}>
      <Panel>
        <View style={styles.spread}>
          <Eyebrow color={BLUE_SOFT}>{recap.meeting.date} · {recap.meeting.body}</Eyebrow>
          <AIBadge color={BLUE_SOFT} />
        </View>
        <Txt style={{ fontSize: 20, fontWeight: '700', lineHeight: 24, letterSpacing: -0.2, color: '#fff' }}>{issue.oneLine}</Txt>
        {issue.why ? (
          <View style={styles.why}>
            <Txt style={{ fontSize: 11, letterSpacing: 1.65, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Why it matters to you</Txt>
            <Txt style={{ fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.9)' }}>{issue.why}</Txt>
          </View>
        ) : null}
        {issue.deadlines.length ? (
          <View style={styles.wrap}>
            <Deadlines items={issue.deadlines} onDark />
          </View>
        ) : null}
      </Panel>
      <View style={{ gap: 10 }}>
        <View style={styles.spread}>
          <Eyebrow>What happened</Eyebrow>
          <ReadAloudButton text={issue.brief} />
        </View>
        <ProofText text={issue.brief} active={activeSrc} onRef={goSrc} />
        <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist }}>Each number is a moment in the meeting video. Tap it to watch the proof.</Txt>
      </View>
      {issue.sources.map(src => (
        <SourceRow key={src.n} src={src} active={activeSrc === String(src.n)} />
      ))}
    </View>
  );
}

function DemoIssueScreen({ name }: { name: string }) {
  const { colors, isFollowing, toggleFollow, openSheet } = useApp();
  const data = ISSUES[name] ?? EMPTY_ISSUE;
  const following = isFollowing(name);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);

  // Tap a footnote: highlight its source, then follow it to the proof.
  const goSrc = (key: string) => {
    const src = data.sources.find(x => String(x.n) === key);
    if (!src) return;
    setActiveSrc(key);
    setTimeout(() => openTarget(src), 350);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DetailHeader>
        <Txt style={{ fontSize: 11, letterSpacing: 3.3, textTransform: 'uppercase', color: BLUE, fontWeight: '600' }}>Issue</Txt>
        <Txt style={{ fontSize: 18, fontWeight: '700', lineHeight: 21.6 }}>{name}</Txt>
      </DetailHeader>

      <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingVertical: 20, paddingBottom: 32, gap: 26 }}>
        <View style={{ flexDirection: 'row', gap: 18 }}>
          <Stat n={data.timeline.length} label="developments" />
          <Stat n={data.sources.length} label="sources" />
          <Stat n={data.since} label="tracking since" />
        </View>

        <Panel>
          <View style={styles.spread}>
            <Eyebrow color={BLUE_SOFT}>In one line</Eyebrow>
            <AIBadge color={BLUE_SOFT} />
          </View>
          <Txt style={{ fontSize: 20, fontWeight: '700', lineHeight: 24, letterSpacing: -0.2, color: '#fff' }}>{data.oneLine}</Txt>
          <View style={styles.why}>
            <Txt style={{ fontSize: 11, letterSpacing: 1.65, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Why it matters to you</Txt>
            <Txt style={{ fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.9)' }}>{data.why}</Txt>
          </View>
          {data.deadlines.length ? (
            <View style={styles.wrap}>
              <Deadlines items={data.deadlines} onDark />
            </View>
          ) : null}
        </Panel>

        <View style={{ gap: 10 }}>
          <View style={styles.spread}>
            <Eyebrow>The full picture</Eyebrow>
            <ReadAloudButton text={data.brief} />
          </View>
          <ProofText text={data.brief} active={activeSrc} onRef={goSrc} />
          <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist }}>
            Cross-referenced from Channel 53 recordings, County of Maui releases and Maui Recovers. Each number is a source below — nothing in this summary is unsourced.
          </Txt>
        </View>

        {data.timeline.length ? (
          <View style={{ gap: 10 }}>
            <Txt style={styles.h}>Timeline</Txt>
            <View>
              {data.timeline.map(ev => (
                <Pressable key={ev.mon + ev.day + ev.title} onPress={() => openTarget(ev)} style={[styles.tlRow, { borderBottomColor: colors.border }]}>
                  <View style={{ alignItems: 'center', minWidth: 40 }}>
                    <Txt style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: BLUE, fontWeight: '600' }}>{ev.mon}</Txt>
                    <Txt style={{ fontSize: 20, fontWeight: '700', lineHeight: 22 }}>{ev.day}</Txt>
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
                    <Tag label={ev.source} tone={ev.kind === 'tv' ? 'blue' : 'wash'} />
                    <Txt style={{ fontSize: 15, fontWeight: '600', lineHeight: 20.25 }}>{ev.title}</Txt>
                    <Txt style={{ fontSize: 13, lineHeight: 18.85, color: colors.mist }}>{ev.note}</Txt>
                    <Txt style={{ fontSize: 12, color: BLUE, fontWeight: '600' }}>{ev.proof}</Txt>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {data.sources.length ? (
          <View style={{ gap: 10 }}>
            <Txt style={styles.h}>Sources</Txt>
            {data.sources.map(src => (
              <SourceRow key={src.n} src={src} active={activeSrc === String(src.n)} />
            ))}
          </View>
        ) : null}

        <View style={styles.report}>
          <Txt style={{ fontSize: 16, fontWeight: '700', lineHeight: 19.2 }}>Weekly issue report</Txt>
          <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }}>
            Every Monday: what moved on this issue, who said it, where the proof is. Yours by email — and the same report goes to the Akakū newsroom and is published on akaku.org.
          </Txt>
          <View style={styles.wrap}>
            <Button label="Preview this week's →" onPress={() => openSheet('report', { issue: name })} />
            {/* Email delivery needs the account + mailing backend. */}
            <Button label="Email me weekly" variant="outline" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  h: { fontSize: 15, fontWeight: '700' },
  follow: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  why: { gap: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)', paddingTop: 12 },
  tlRow: { flexDirection: 'row', gap: 14, paddingVertical: 12, borderBottomWidth: 1 },
  report: { borderWidth: 1, borderColor: BLUE, backgroundColor: BLUE_TINT, borderRadius: 14, padding: 16, gap: 10 },
});
