import { useState, type ReactNode } from 'react';
import { ISSUE_LABELS } from '../data/issues.ts';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CAST_DEVICES } from '../data/cast';
import { EMPTY_ISSUE, ISSUES } from '../data/countyWatch';
import { SUB_KINDS } from '../data/videos';
import { plainText } from '../lib/segments';
import { useApp } from '../state/AppState';
import { BLUE, BLUE_TINT, BLUE_WASH, FONT, GREEN, RADIUS, SCRIM } from '../theme';
import { Icon } from './Icon';
import { CAST, ICON } from './icons';
import { Txt } from './Txt';
import { Button, Chip, Eyebrow, ProofText } from './ui';

/** Renders whichever bottom sheet is open. Mounted once at the root, above every screen. */
export function SheetHost() {
  const { sheet, closeSheet } = useApp();
  const body =
    sheet === 'cast' ? <CastSheet /> :
    sheet === 'signup' ? <SignupSheet /> :
    sheet === 'submit' ? <SubmitSheet /> :
    sheet === 'report' ? <ReportSheet /> :
    sheet === 'follow' ? <FollowSheet /> : null;
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
  const pad = { paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 8) + 20 };
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

function SignupSheet() {
  const { colors, signIn } = useApp();
  return (
    <SheetFrame>
      <SheetTitle eyebrow="Join Akakū" title="Watching is free. Publishing needs a name.">
        <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }}>
          Anyone can watch. To submit video, comment or follow issues with alerts, create a free Akakū account — your work airs under your real name, the way community media always has.
        </Txt>
      </SheetTitle>
      <Button label="Continue with Apple" onPress={signIn} height={50} bg={colors.text} />
      <Button label="Continue with Google" onPress={signIn} variant="quiet" height={50} />
      <Button label="Use email" onPress={signIn} variant="outline" height={50} />
      <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist, textAlign: 'center' }}>Already a member or producer? The same login works at akaku.org.</Txt>
    </SheetFrame>
  );
}

function SubmitSheet() {
  const { colors, user, closeSheet } = useApp();
  const [file, setFile] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState(SUB_KINDS[0]);
  const [air, setAir] = useState(true);
  const [sent, setSent] = useState(false);

  const send = () => {
    if (sent) return closeSheet();
    if (file) setSent(true);
  };

  return (
    <SheetFrame scroll maxHeight="90%">
      <SheetTitle eyebrow="Submit a video" title="Your story, on the air.">
        <Txt style={{ fontSize: 12, color: colors.mist }}>
          Publishing as <Txt style={{ fontSize: 12, fontWeight: '700' }}>{user ?? 'Guest'}</Txt>
        </Txt>
        <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.mist }}>
          Public comment, protest footage, a hula recital, a town hall your neighbors missed. It runs on Channel 54, the app and YouTube — your name on it, unedited.
        </Txt>
      </SheetTitle>

      {/* Demo: production opens the camera roll / files picker and uploads direct to Mux. */}
      <Pressable
        onPress={() => setFile(true)}
        accessibilityRole="button"
        style={[styles.filePick, { borderColor: file ? BLUE : colors.mist, backgroundColor: file ? BLUE_TINT : 'transparent' }]}
      >
        <View style={styles.fileIcon}>
          <Icon d={ICON.camera} size={22} color={BLUE} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt style={{ fontSize: 15, fontWeight: '700' }}>{file ? 'IMG_4821.mov · 2 min 14 s' : 'Choose a video'}</Txt>
          <Txt style={{ fontSize: 12, color: colors.mist }}>{file ? 'Ready to upload · 412 MB' : 'From your camera roll or files · up to 2 hours'}</Txt>
        </View>
      </Pressable>

      <View style={{ gap: 8 }}>
        <Txt style={{ fontSize: 13, color: colors.mist }}>Title</Txt>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What is this, and where?"
          placeholderTextColor={colors.mist}
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.bg }]}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Txt style={{ fontSize: 13, color: colors.mist }}>Kind of video</Txt>
        <View style={styles.wrap}>
          {SUB_KINDS.map(k => (
            <Chip key={k} label={k} selected={kind === k} onPress={() => setKind(k)} height={40} />
          ))}
        </View>
      </View>

      <View style={[styles.airRow, { backgroundColor: colors.surface }]}>
        <Pressable
          onPress={() => setAir(a => !a)}
          accessibilityRole="switch"
          accessibilityState={{ checked: air }}
          accessibilityLabel="Also air on Channel 54"
          style={[styles.toggle, { backgroundColor: air ? BLUE : colors.border }]}
        >
          <View style={[styles.knob, { left: air ? 21 : 3 }]} />
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt style={{ fontSize: 14, fontWeight: '600' }}>Also air on Channel 54</Txt>
          <Txt style={{ fontSize: 12, lineHeight: 17.4, color: colors.mist }}>Scheduled into the next community block. You'll get the air date by text.</Txt>
        </View>
      </View>

      <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.mist }}>
        By submitting you confirm this is your work (or you have permission) and agree to Akakū's community media policies. Akakū does not review for viewpoint.
      </Txt>
      <Button label={sent ? "Submitted — we'll text you the air date" : 'Submit to Akakū →'} onPress={send} height={52} fontSize={17} bg={sent ? GREEN : file ? BLUE : colors.mist} />
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
