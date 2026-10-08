import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { ICON } from '../../src/components/icons';
import { Txt } from '../../src/components/Txt';
import { AIBadge, Card, Chip, Deadlines, Eyebrow, Panel, Press, SectionHeader, Tag } from '../../src/components/ui';
import { CAL_DAYS, CALENDAR, EXPLAINERS, FOLLOWUPS, FU_COLORS, WEEKLY } from '../../src/data/countyWatch';
import { ISSUE_BLURBS, ISSUE_LABELS } from '../../src/data/issues.ts';
import { HITS } from '../../src/data/meetings';
import { useContent } from '../../src/state/Content';
import type { FollowUpStatus } from '../../src/data/types';
import { openExplainer, openIssue, openMeeting, openTarget } from '../../src/lib/navigate';
import { useApp } from '../../src/state/AppState';
import { BLUE, BLUE_SOFT, BLUE_WASH, FONT, GUTTER } from '../../src/theme';

const STATUSES: FollowUpStatus[] = ['Done', 'In progress', 'Scheduled', 'Overdue'];

/** Pick the explainer that best answers a free-text question. */
const explainerFor = (q: string) =>
  /permit/i.test(q) ? 'permits' : /water|meter/i.test(q) ? 'meters' : /fire|fema|recover/i.test(q) ? 'firemoney' : 'cost';

export default function MeetingsScreen() {
  const { colors } = useApp();
  const { source } = useContent();
  const demo = source === 'demo';
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const hits = q ? HITS.filter(h => (h.quote + h.meeting).toLowerCase().includes(q) || 'lahaina water'.includes(q)) : [];

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <View style={{ paddingTop: 12, paddingHorizontal: GUTTER, gap: 6 }}>
        <Eyebrow>County Watch</Eyebrow>
        <Txt style={{ fontSize: 28, fontWeight: '700', lineHeight: 29.4, letterSpacing: -0.42 }}>
          Maui County, <Txt style={{ fontSize: 28, lineHeight: 29.4, color: BLUE }}>trackable.</Txt>
        </Txt>
        {demo ? (
          <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist, marginTop: 4 }}>
            County meetings from Channel 53, written up in plain English. Every line links to the moment in the video, so you can check it yourself.
          </Txt>
        ) : null}
      </View>
      {demo ? null : <HowItWorks />}

      {demo ? (
      <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.bg }]}>
        <Icon d={ICON.search} size={18} color={colors.mist} strokeWidth={1.5} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Ask anything: “Kula water meters”, “fair parking”, “grants”"
          placeholderTextColor={colors.mist}
          returnKeyType="search"
          accessibilityLabel="Search meetings"
          style={[styles.searchInput, { color: colors.text }]}
        />
        {/* Voice search arrives with on-device speech recognition. */}
        <View style={styles.mic} accessibilityLabel="Voice search">
          <Icon d={ICON.mic} size={18} color={BLUE} strokeWidth={1.5} />
        </View>
      </View>
      ) : null}

      {q ? (
        <View style={{ marginTop: 14, marginHorizontal: GUTTER, gap: 10 }}>
          <Press onPress={() => openExplainer(explainerFor(query))} style={[styles.explain, { backgroundColor: colors.panel }]}>
            <View style={styles.sparkCircle}>
              <Icon d={ICON.spark} size={20} color={BLUE_SOFT} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Explain “{query.trim()}” — the whole story</Txt>
              <Txt style={{ fontSize: 12, lineHeight: 16.8, color: 'rgba(255,255,255,0.7)' }}>Every time it came up since 2012, who decided what, and why it is the way it is.</Txt>
            </View>
          </Press>
          <Txt style={{ fontSize: 13, color: colors.mist }}>
            {hits.length} moments across {new Set(hits.map(h => h.mid)).size} meetings
          </Txt>
          {hits.map(h => (
            <Card key={h.mid + h.time} onPress={() => openMeeting(h.mid, h.time)} style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 6 }}>
              <View style={styles.spread}>
                <Txt style={{ fontSize: 13, color: colors.mist, flexShrink: 1 }}>{h.meeting}</Txt>
                <Txt style={{ fontSize: 13, fontWeight: '600', color: BLUE, fontVariant: ['tabular-nums'] }}>▶ {h.time}</Txt>
              </View>
              <Txt style={{ fontSize: 15, lineHeight: 22.5 }}>“{h.quote}”</Txt>
              <Txt style={{ fontSize: 13, color: colors.mist }}>{h.speaker}</Txt>
            </Card>
          ))}
        </View>
      ) : (
        <CountyWatchHome demo={demo} />
      )}
    </ScrollView>
  );
}

const HOW_KEY = 'akaku.countywatch.howItWorks.v1';
const STEPS = [
  ['We watch the meetings', 'Council, committees and commissions that Akakū records.'],
  ['We write it in plain English', 'Every line has a timestamp. Tap it and you are at that moment in the video, so you can check us.'],
  ['You follow what matters', 'Pick the issues you care about and see what is new on them.'],
] as const;

/** Short explainer: open until dismissed, then a one-line link to bring it back. */
function HowItWorks() {
  const { colors } = useApp();
  const [open, setOpen] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem(HOW_KEY).then(v => v === 'closed' && setOpen(false)).catch(() => {});
  }, []);
  const set = (next: boolean) => {
    setOpen(next);
    AsyncStorage.setItem(HOW_KEY, next ? 'open' : 'closed').catch(() => {});
  };
  if (!open) {
    return (
      <Press onPress={() => set(true)} accessibilityRole="button" style={{ marginHorizontal: GUTTER, marginTop: 10, paddingVertical: 8 }}>
        <Txt style={{ fontSize: 14, fontWeight: '600', color: BLUE }}>How County Watch works →</Txt>
      </Press>
    );
  }
  return (
    <View style={[styles.how, { borderColor: colors.border, backgroundColor: colors.bg }]}>
      <Txt style={{ fontSize: 13, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mist }}>How it works</Txt>
      {STEPS.map(([title, body], i) => (
        <View key={title} style={styles.step}>
          <View style={styles.stepNum}>
            <Txt style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>{i + 1}</Txt>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt style={{ fontSize: 16, fontWeight: '700', lineHeight: 20 }}>{title}</Txt>
            <Txt style={{ fontSize: 14, lineHeight: 20, color: colors.mist }}>{body}</Txt>
          </View>
        </View>
      ))}
      <Txt style={{ fontSize: 13, lineHeight: 19, color: colors.mist }}>
        Written by Akakū Intelligence, an AI. AI can make mistakes, so check the proof. More sources, like the County’s own releases, are coming.
      </Txt>
      <Press onPress={() => set(false)} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 6 }}>
        <Txt style={{ fontSize: 15, fontWeight: '700', color: BLUE }}>Got it</Txt>
      </Press>
    </View>
  );
}

/** `demo` is true until a real recap is published; the sections marked demo-only hold illustrative content. */
function CountyWatchHome({ demo }: { demo: boolean }) {
  const { colors } = useApp();
  const { meetings, issuesByLabel } = useContent();
  return (
    <>
      {demo ? <NewTermCounter /> : null}
      {demo ? <WeeklyBrief /> : null}

      {/* Big questions (demo-only) */}
      {demo ? (
      <View style={{ marginTop: 28, gap: 12 }}>
        <SectionHeader title="The big questions" aside="Answered from 14 years of meetings" inset />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: GUTTER, paddingBottom: 4 }}>
          {EXPLAINERS.map(e => (
            <Press key={e.id} onPress={() => openExplainer(e.id)} style={[styles.bigQ, { backgroundColor: colors.panel }]}>
              <Txt style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: BLUE_SOFT, fontWeight: '700' }}>{e.tag}</Txt>
              <Txt style={{ fontSize: 19, fontWeight: '700', lineHeight: 22.8, letterSpacing: -0.19, color: '#fff' }}>{e.q}</Txt>
              <View style={{ flex: 1 }} />
              <Txt style={{ fontSize: 12, lineHeight: 16.8, color: 'rgba(255,255,255,0.65)' }}>{e.basis}</Txt>
              <Txt style={{ fontSize: 13, fontWeight: '700', color: BLUE_SOFT }}>Read the explainer →</Txt>
            </Press>
          ))}
        </ScrollView>
        <Txt style={{ fontSize: 13, lineHeight: 19.5, color: colors.mist, marginHorizontal: GUTTER }}>
          Not opinions. Each explainer is built only from what was said on the record in Council and commission meetings since 2012, with the clip for every claim.
        </Txt>
      </View>
      ) : null}

      {/* Topics */}
      <View style={styles.section}>
        <SectionHeader title="Issues we track" aside="From our recorded meetings" />
        <View style={styles.grid}>
          {ISSUE_LABELS.map(label => {
            const n = issuesByLabel[label].length;
            return (
              <Press key={label} onPress={() => openIssue(label)} style={[styles.topic, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                <Txt style={{ fontSize: 15, fontWeight: '700', lineHeight: 18 }}>{label}</Txt>
                <Txt style={{ fontSize: 12, lineHeight: 16.8, color: colors.mist }}>{ISSUE_BLURBS[label]}</Txt>
                <View style={{ flex: 1 }} />
                <Txt style={{ fontSize: 12, fontWeight: '700', color: BLUE }}>{n ? `${n} ${n === 1 ? 'development' : 'developments'}` : 'Nothing yet'}</Txt>
              </Press>
            );
          })}
        </View>
      </View>

      <FollowedIssues />
      {demo ? <HearingsCalendar /> : null}
      {demo ? <FollowUps /> : null}

      {/* Recent meetings */}
      <View style={styles.section}>
        <Txt style={{ fontSize: 17, fontWeight: '700' }}>Recent meetings</Txt>
        {meetings.map(m => (
          <Card key={m.id} onPress={() => openMeeting(m.id)} style={{ padding: 16, flexDirection: 'row', gap: 14 }}>
            <View style={{ alignItems: 'center', minWidth: 44 }}>
              <Txt style={{ fontSize: 11, letterSpacing: 1.65, textTransform: 'uppercase', color: BLUE, fontWeight: '600' }}>{m.mon}</Txt>
              <Txt style={{ fontSize: 24, fontWeight: '700', lineHeight: 26.4 }}>{m.day}</Txt>
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Txt style={{ fontSize: 16, fontWeight: '700', lineHeight: 20 }}>{m.body}</Txt>
              <Txt style={{ fontSize: 14, lineHeight: 20.3, color: colors.mist }}>{m.summary}</Txt>
              <View style={[styles.wrap, { gap: 6, marginTop: 2 }]}>
                <MeetingChip label={m.dur} />
                <MeetingChip label="90-sec recap" blue />
                {m.voteCount > 0 ? <MeetingChip label={`${m.voteCount} ${m.voteCount === 1 ? 'vote' : 'votes'}`} /> : null}
              </View>
            </View>
          </Card>
        ))}
      </View>
    </>
  );
}

function MeetingChip({ label, blue }: { label: string; blue?: boolean }) {
  const { colors } = useApp();
  return (
    <View style={{ backgroundColor: blue ? BLUE_WASH : colors.wash, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 }}>
      <Txt style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.88, textTransform: 'uppercase', color: blue ? BLUE : colors.text }}>{label}</Txt>
    </View>
  );
}

function NewTermCounter() {
  const { colors } = useApp();
  return (
    <View style={[styles.counter, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={{ alignItems: 'center', minWidth: 52 }}>
        <Txt style={{ fontSize: 26, fontWeight: '800', lineHeight: 26, letterSpacing: -0.52, color: BLUE }}>89</Txt>
        <Txt style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.mist, marginTop: 2 }}>days</Txt>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt style={{ fontSize: 15, fontWeight: '700', lineHeight: 18 }}>New Mayor and Council sworn in Jan 2, 2027</Txt>
        <Txt style={{ fontSize: 13, lineHeight: 18.2, color: colors.mist }}>Every issue below starts a fresh record on Day 1 — promises, votes and follow-through, from zero.</Txt>
      </View>
    </View>
  );
}

function WeeklyBrief() {
  const { colors } = useApp();
  return (
    <View style={[styles.weekly, { borderColor: colors.border }]}>
      <View style={{ backgroundColor: colors.panel, paddingVertical: 16, paddingHorizontal: 18, gap: 6 }}>
        <View style={styles.spread}>
          <Eyebrow color={BLUE_SOFT}>This week in Maui County</Eyebrow>
          <AIBadge color={BLUE_SOFT} />
        </View>
        <Txt style={{ fontSize: 21, fontWeight: '700', lineHeight: 24.15, letterSpacing: -0.21, color: '#fff' }}>{WEEKLY.headline}</Txt>
      </View>
      {WEEKLY.items.map(w => (
        <Pressable key={w.title} onPress={() => openIssue(w.issue)} style={({ pressed }) => [styles.weeklyRow, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.surface }]}>
          <Tag label={w.tag} tone={w.kind === 'tv' ? 'blue' : 'wash'} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt style={{ fontSize: 15, fontWeight: '600', lineHeight: 20.25 }}>{w.title}</Txt>
            <Txt style={{ fontSize: 13, lineHeight: 18.85, color: colors.mist }}>{w.why}</Txt>
            <Txt style={{ fontSize: 12, color: BLUE, fontWeight: '600' }}>{w.proof}</Txt>
          </View>
        </Pressable>
      ))}
      <View style={[styles.wrap, { paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' }]}>
        <Txt style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mist, fontWeight: '600', marginRight: 4 }}>Deadlines</Txt>
        <Deadlines items={WEEKLY.deadlines} />
      </View>
    </View>
  );
}

function FollowedIssues() {
  const { colors, issues, openSheet } = useApp();
  return (
    <View style={styles.section}>
      <SectionHeader title="Issues you follow" aside="Alerts when they come up" />
      <View style={styles.wrap}>
        {issues.map(is => (
          <Press key={is.name} onPress={() => openIssue(is.name)} style={[styles.issuePill, { backgroundColor: is.on ? BLUE : colors.wash }]}>
            <Icon d={ICON.bell} size={14} color={is.on ? '#fff' : colors.text} strokeWidth={2} />
            <Txt style={{ fontSize: 13, fontWeight: '600', letterSpacing: 0.26, color: is.on ? '#fff' : colors.text }}>{is.name}</Txt>
            {is.on && is.count > 0 ? (
              <View style={styles.newBadge}>
                <Txt style={{ fontSize: 11, color: BLUE }}>{is.count} new</Txt>
              </View>
            ) : null}
          </Press>
        ))}
        <Pressable onPress={() => openSheet('follow')} accessibilityRole="button" style={[styles.issuePill, styles.addIssue, { borderColor: colors.mist }]}>
          <Txt style={{ fontSize: 13, fontWeight: '600', color: colors.mist }}>+ Follow an issue</Txt>
        </Pressable>
      </View>
    </View>
  );
}

function HearingsCalendar() {
  const { colors, reminders, toggleReminder } = useApp();
  const [day, setDay] = useState(9);
  const upcoming = CALENDAR.filter(c => c.day >= day);
  const reminderCount = Object.values(reminders).filter(Boolean).length;
  return (
    <View style={{ marginTop: 28, gap: 12 }}>
      <SectionHeader title="Hearings & meetings" aside={`${upcoming.length} coming up · ${reminderCount} reminders`} inset />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: GUTTER, paddingBottom: 4 }}>
        {CAL_DAYS.map(d => {
          const has = CALENDAR.some(c => c.day === d.key);
          const sel = day === d.key;
          const fg = sel ? '#fff' : has ? colors.text : colors.mist;
          return (
            <Pressable
              key={d.key}
              onPress={() => setDay(d.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`${d.dow} October ${d.num}${has ? ', has meetings' : ''}`}
              style={[styles.day, { borderColor: sel ? BLUE : colors.border, backgroundColor: sel ? BLUE : 'transparent' }]}
            >
              <Txt style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.75, color: fg }}>{d.dow}</Txt>
              <Txt style={{ fontSize: 18, fontWeight: '700', lineHeight: 18, color: fg }}>{d.num}</Txt>
              <View style={[styles.dot, { backgroundColor: has ? (sel ? '#fff' : BLUE) : 'transparent' }]} />
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={{ paddingHorizontal: GUTTER }}>
        {upcoming.slice(0, 4).map(ev => {
          const on = !!reminders[ev.id];
          return (
            <View key={ev.id} style={[styles.calRow, { borderBottomColor: colors.border }]}>
              <View style={{ minWidth: 64 }}>
                <Txt style={{ fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{ev.time}</Txt>
                <Txt style={{ fontSize: 11, color: colors.mist }}>{ev.day === day ? 'Selected day' : `Oct ${ev.day}`}</Txt>
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
                <Tag label={ev.kind} tone={ev.kind === 'Community' ? 'wash' : 'blue'} height={20} />
                <Txt style={{ fontSize: 15, fontWeight: '700', lineHeight: 19.5 }}>{ev.body}</Txt>
                <Txt style={{ fontSize: 13, lineHeight: 18.85, color: colors.mist }}>{ev.what}</Txt>
                {ev.match ? <Txt style={{ fontSize: 12, color: BLUE, fontWeight: '600' }}>Matches what you follow · {ev.match}</Txt> : null}
                <Txt style={{ fontSize: 12, color: colors.mist }}>{ev.where}</Txt>
              </View>
              <Pressable
                onPress={() => toggleReminder(ev.id)}
                accessibilityRole="switch"
                accessibilityState={{ checked: on }}
                accessibilityLabel="Remind me"
                style={[styles.bellBtn, { borderColor: on ? BLUE : colors.border, backgroundColor: on ? BLUE : 'transparent' }]}
              >
                <Icon d={ICON.bell} size={18} color={on ? '#fff' : colors.mist} strokeWidth={2} />
              </Pressable>
            </View>
          );
        })}
      </View>
      <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist, marginHorizontal: GUTTER }}>
        Council and committee agendas, boards and commissions, and County community meetings — pulled from the County calendar and agenda postings the hour they go up. Reminders arrive 24 h before and when the gavel drops.
      </Txt>
    </View>
  );
}

function FollowUps() {
  const { colors } = useApp();
  const [filter, setFilter] = useState<'All' | FollowUpStatus>('All');
  const count = (k: FollowUpStatus) => FOLLOWUPS.filter(f => f.status === k).length;
  const list = FOLLOWUPS.filter(f => filter === 'All' || f.status === filter);
  return (
    <View style={styles.section}>
      <SectionHeader title="Follow-ups" aside={<AIBadge />} />
      <Panel style={{ paddingVertical: 16 }}>
        <Txt style={{ fontSize: 13, lineHeight: 18.85, color: 'rgba(255,255,255,0.7)' }}>Things officials said they would do, on the record — and whether they did.</Txt>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {STATUSES.map(k => (
            <View key={k} style={{ flex: 1, gap: 2 }}>
              <Txt style={{ fontSize: 24, fontWeight: '800', lineHeight: 24, color: FU_COLORS[k] }}>{count(k)}</Txt>
              <Txt style={{ fontSize: 9, letterSpacing: 1.08, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>{k}</Txt>
            </View>
          ))}
        </View>
        <View style={styles.progress}>
          {STATUSES.map(k => (
            <View key={k} style={{ flex: count(k), backgroundColor: FU_COLORS[k] }} />
          ))}
        </View>
      </Panel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ gap: 8, paddingHorizontal: GUTTER }}>
        {(['All', 'Overdue', 'In progress', 'Done'] as const).map(k => (
          <Chip key={k} label={k} selected={filter === k} onPress={() => setFilter(k)} height={34} fontSize={12} />
        ))}
      </ScrollView>
      <View>
        {list.map(f => {
          const c = FU_COLORS[f.status];
          return (
            <Pressable key={f.id} onPress={() => openTarget(f)} style={[styles.fuRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.fuRing, { backgroundColor: c + '33' }]}>
                <View style={[styles.fuDot, { backgroundColor: c }]} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
                <View style={[styles.spread, { alignItems: 'baseline' }]}>
                  <Txt style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: c }}>{f.status}</Txt>
                  <Txt style={{ fontSize: 11, color: colors.mist }}>{f.due}</Txt>
                </View>
                <Txt style={{ fontSize: 15, fontWeight: '600', lineHeight: 20.25 }}>“{f.promise}”</Txt>
                <Txt style={{ fontSize: 13, lineHeight: 18.85, color: colors.mist }}>
                  {f.who} · {f.said}
                </Txt>
                <Txt style={{ fontSize: 13, lineHeight: 18.85 }}>{f.update}</Txt>
                <Txt style={{ fontSize: 12, color: BLUE, fontWeight: '600' }}>{f.proof}</Txt>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist }}>
        A commitment is logged when an official says “we will” on the record. It closes when the record shows it happened. Officials can respond; responses appear here, verbatim.
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  how: { marginTop: 16, marginHorizontal: GUTTER, borderWidth: 1, borderRadius: 14, padding: 16, gap: 14 },
  step: { flexDirection: 'row', gap: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  section: { marginTop: 28, marginHorizontal: GUTTER, gap: 12 },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  search: { marginTop: 16, marginHorizontal: GUTTER, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, height: 48 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, fontFamily: FONT, paddingVertical: 0 },
  mic: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  explain: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14 },
  sparkCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(77,163,240,0.2)', alignItems: 'center', justifyContent: 'center' },
  counter: { marginTop: 20, marginHorizontal: GUTTER, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  weekly: { marginTop: 24, marginHorizontal: GUTTER, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  weeklyRow: { flexDirection: 'row', gap: 14, paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1 },
  bigQ: { width: 250, minHeight: 168, padding: 18, borderRadius: 14, gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  topic: { flexGrow: 1, flexBasis: '45%', minHeight: 88, padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  issuePill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 14, borderRadius: 999 },
  addIssue: { borderWidth: 1, borderStyle: 'dashed', backgroundColor: 'transparent' },
  newBadge: { backgroundColor: '#fff', borderRadius: 999, paddingVertical: 1, paddingHorizontal: 7 },
  day: { width: 52, height: 68, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  calRow: { flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: 1 },
  bellBtn: { alignSelf: 'flex-start', width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.12)' },
  fuRow: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  fuRing: { marginTop: 1, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  fuDot: { width: 10, height: 10, borderRadius: 5 },
});
