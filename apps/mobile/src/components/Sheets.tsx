import Constants from 'expo-constants';
import { useState, type ReactNode } from 'react';
import { ISSUE_LABELS } from '../data/issues.ts';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CAST_DEVICES } from '../data/cast';
import { MAX_COMMENT, sendReport } from '../lib/feedback.ts';
import { EMPTY_ISSUE, ISSUES } from '../data/countyWatch';
import { plainText } from '../lib/segments';
import { useApp } from '../state/AppState';
import { BLUE, BLUE_TINT, BLUE_WASH, FONT, GREEN, RADIUS, SCRIM, GUTTER } from '../theme';
import { useCatalog } from '../state/Catalog';
import { Icon } from './Icon';
import { IssuePool, SampleTag } from './IssueBits';
import { CAST, ICON } from './icons';
import { Txt } from './Txt';
import { Button, Chip, Eyebrow, ProofText } from './ui';

/** Renders whichever bottom sheet is open. Mounted once at the root, above every screen. */
export function SheetHost() {
  const { sheet, closeSheet } = useApp();
  const body =
    sheet === 'cast' ? <CastSheet /> :
    sheet === 'report' ? <ReportSheet /> :
    sheet === 'follow' ? <FollowSheet /> :
    sheet === 'welcome' ? <WelcomeSheet /> :
    sheet === 'feedback' ? <FeedbackSheet /> : null;
  return (
    <Modal visible={!!sheet} transparent animationType="fade" onRequestClose={closeSheet} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM }]} onPress={closeSheet} accessibilityLabel="Close" />
        <View style={{ flex: 1 }} pointerEvents="box-none" />
        {body}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SheetFrame({ children, scroll, maxHeight = '88%' }: { children: ReactNode; scroll?: boolean; maxHeight?: `${number}%` }) {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  const pad = { paddingHorizontal: GUTTER, paddingBottom: Math.max(insets.bottom, 8) + 20 };
  return (
    <View style={[styles.sheet, { backgroundColor: colors.bg, maxHeight }]}>
      <View style={styles.grabberRow}>
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={[pad, { paddingTop: 8, gap: 16 }]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[pad, { gap: 14 }]}>{children}</View>
      )}
    </View>
  );
}

function SheetTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Txt style={{ fontSize: 22, fontWeight: '700', lineHeight: 25.3 }}>{title}</Txt>
      {children}
    </View>
  );
}

function CastSheet() {
  const { colors, castDevice, setCastDevice, closeSheet } = useApp();
  // iPhone lists AirPlay targets; Android lists Cast targets. Roku shows on both.
  const devices = CAST_DEVICES.filter(d => (Platform.OS === 'android' ? !d.kind.includes('AirPlay') : d.kind !== 'Chromecast'));
  return (
    <SheetFrame>
      <View style={{ gap: 4, marginBottom: -2 }}>
        <Txt style={{ fontSize: 18, fontWeight: '700' }}>Play on a TV</Txt>
        <Txt style={{ fontSize: 13, color: colors.mist }}>{castDevice ? `Connected to ${castDevice}. Tap again to disconnect.` : CAST.hint}</Txt>
      </View>
      <View>
        {devices.map(d => (
          <Pressable
            key={d.name}
            accessibilityRole="button"
            onPress={() => {
              setCastDevice(castDevice === d.name ? null : d.name);
              closeSheet();
            }}
            style={[styles.deviceRow, { borderBottomColor: colors.border }]}
          >
            <Icon d={ICON.tv} size={22} color={colors.text} strokeWidth={1.6} />
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 15, fontWeight: '600' }}>{d.name}</Txt>
              <Txt style={{ fontSize: 12, color: colors.mist }}>{d.kind}</Txt>
            </View>
            {castDevice === d.name ? <Txt style={{ fontSize: 12, fontWeight: '700', color: BLUE }}>Connected</Txt> : null}
          </Pressable>
        ))}
      </View>
    </SheetFrame>
  );
}

function ReportSheet() {
  const { colors, reportIssue, closeSheet } = useApp();
  const name = reportIssue ?? '';
  const data = ISSUES[name] ?? EMPTY_ISSUE;
  const share = () => {
    Share.share({
      title: `${name} — Akakū issue report`,
      message: `${name} · Issue report, week of Oct 5, 2026\n\n${plainText(data.brief)}\n\nWhat to watch next: ${data.next}\n\nSources:\n${data.sources.map(s => `${s.n}. ${s.title} — ${s.where}${s.href ? `\n   ${s.href}` : ''}`).join('\n')}`,
    }).catch(() => {});
  };
  return (
    <SheetFrame scroll>
      <View style={{ gap: 4 }}>
        <Eyebrow>Issue report · week of Oct 5, 2026</Eyebrow>
        <Txt style={{ fontSize: 22, fontWeight: '700', lineHeight: 25.3 }}>{name}</Txt>
        <Txt style={{ fontSize: 13, color: colors.mist }}>Prepared by Akakū Meeting Watch · {data.sources.length} sources · 1 min read</Txt>
      </View>
      <ProofText text={data.brief} size={15} lineHeight={24} />
      <View style={[styles.reportBlock, { borderTopColor: colors.border }]}>
        <Txt style={[styles.reportLabel, { color: colors.mist }]}>What to watch next</Txt>
        <Txt style={{ fontSize: 14, lineHeight: 21 }}>{data.next}</Txt>
      </View>
      <View style={[styles.reportBlock, { borderTopColor: colors.border }]}>
        <Txt style={[styles.reportLabel, { color: colors.mist }]}>Sources</Txt>
        {data.sources.map(src => (
          <Txt key={src.n} style={{ fontSize: 13, lineHeight: 19.5, color: colors.mist }}>
            <Txt style={{ fontSize: 13, fontWeight: '700' }}>{src.n}.</Txt> {src.title} — {src.where}
          </Txt>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button label="Share" onPress={share} height={48} flex />
        {/* PDF export lands with the real weekly-report generator. */}
        <Button label="Save PDF" onPress={closeSheet} variant="quiet" height={48} flex />
      </View>
    </SheetFrame>
  );
}

function FollowSheet() {
  const { colors, toggleFollow, isFollowing, closeSheet } = useApp();
  const { catalog } = useCatalog();
  if (catalog) {
    return (
      <SheetFrame scroll>
        <SheetTitle eyebrow="Follow an issue" title="What should we watch for?">
          <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }}>
            Pick the issues you care about. They are ranked by how much our recorded meetings have talked about them lately.
          </Txt>
          <SampleTag />
        </SheetTitle>
        <IssuePool />
        <Button label="Done" onPress={closeSheet} height={50} bg={BLUE} />
      </SheetFrame>
    );
  }
  return (
    <SheetFrame>
      <SheetTitle eyebrow="Follow an issue" title="What should we watch for?">
        <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }}>
          Pick the issues you care about. Akakū Intelligence watches our recorded meetings for them and adds each new development to the issue page.
        </Txt>
      </SheetTitle>
      <View style={{ gap: 10 }}>
        {ISSUE_LABELS.map(label => {
          const on = isFollowing(label);
          return (
            <Pressable
              key={label}
              onPress={() => toggleFollow(label)}
              accessibilityRole="switch"
              accessibilityState={{ checked: on }}
              style={[styles.input, { borderColor: on ? BLUE : colors.border, backgroundColor: on ? BLUE : colors.bg, justifyContent: 'center' }]}
            >
              <Txt style={{ fontSize: 16, fontWeight: '600', color: on ? '#fff' : colors.text }}>
                {on ? '✓ ' : ''}
                {label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <Button label="Done" onPress={closeSheet} height={50} bg={BLUE} />
    </SheetFrame>
  );
}

/** Shown once, the first time the app opens with a catalog: we have already started tracking for you. */
function WelcomeSheet() {
  const { colors, closeSheet } = useApp();
  const { followed } = useCatalog();
  const n = followed.length;
  return (
    <SheetFrame scroll>
      <SheetTitle eyebrow="Welcome" title="We’re already keeping track.">
        <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }}>
          {n === 1 ? 'We’ve started you on 1 issue' : `We’ve started you on ${n} issues`}, so you’ll see what’s new the moment you open County Watch. Add or remove anything below. You can change it any time.
        </Txt>
        <SampleTag />
      </SheetTitle>
      <IssuePool />
      <Button label="Show me what’s new" onPress={closeSheet} height={50} bg={BLUE} />
    </SheetFrame>
  );
}

/** "Report an error": see what you are reporting, add a comment if you like, send. */
function FeedbackSheet() {
  const { colors, feedbackCtx, closeSheet } = useApp();
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  if (!feedbackCtx) return null;
  const send = async () => {
    setState('sending');
    const meta = { platform: Platform.OS, version: String(Constants.expoConfig?.version ?? '') };
    const r = await sendReport(feedbackCtx, comment, meta);
    if (r.result === 'mail') {
      Linking.openURL(r.url).catch(() => undefined);
      setState('sent');
    } else setState(r.result);
  };
  return (
    <SheetFrame scroll>
      <SheetTitle eyebrow="Report an error" title={state === 'sent' ? 'Thank you.' : 'Something look wrong?'}>
        <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }}>
          {state === 'sent' ? 'We’ll look into it and fix it if it’s wrong.' : 'Tell us what you saw and we’ll look into it.'}
        </Txt>
      </SheetTitle>
      <View style={[styles.airRow, { backgroundColor: colors.surface }]}>
        <Txt style={{ flex: 1, fontSize: 14, lineHeight: 21 }} numberOfLines={4}>{feedbackCtx.label}</Txt>
      </View>
      {state === 'sent' ? (
        <Button label="Done" onPress={closeSheet} height={50} bg={BLUE} />
      ) : (
        <>
          <TextInput
            value={comment}
            onChangeText={t => setComment(t.slice(0, MAX_COMMENT))}
            placeholder="What’s wrong? (optional)"
            placeholderTextColor={colors.mist}
            multiline
            accessibilityLabel="What’s wrong? (optional)"
            style={[styles.input, { height: 110, paddingTop: 12, textAlignVertical: 'top', borderColor: colors.border, color: colors.text }]}
          />
          {state === 'failed' ? <Txt style={{ fontSize: 13, color: colors.mist }}>That didn’t send. Check your connection and try again.</Txt> : null}
          <Button label={state === 'sending' ? 'Sending…' : 'Send'} onPress={state === 'sending' ? () => {} : send} height={50} bg={BLUE} />
        </>
      )}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    shadowColor: '#0e1218',
    shadowOpacity: 0.16,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  grabberRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  grabber: { width: 40, height: 4, borderRadius: 2 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 56, paddingHorizontal: 4, borderBottomWidth: 1 },
  filePick: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderWidth: 1, borderStyle: 'dashed', borderRadius: RADIUS.card },
  fileIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: BLUE_WASH, alignItems: 'center', justifyContent: 'center' },
  input: { height: 48, borderWidth: 1, borderRadius: RADIUS.control, paddingHorizontal: 14, fontSize: 16, fontFamily: FONT },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  airRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: 12 },
  toggle: { width: 44, height: 26, borderRadius: 999, marginTop: 2 },
  knob: { position: 'absolute', top: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  reportBlock: { gap: 6, borderTopWidth: 1, paddingTop: 12 },
  reportLabel: { fontSize: 12, letterSpacing: 1.44, textTransform: 'uppercase', fontWeight: '600' },
});
