import { Pressable, StyleSheet, View } from 'react-native';

import type { Source } from '../data/types';
import { openTarget } from '../lib/navigate';
import { useApp } from '../state/AppState';
import { BLUE, BLUE_TINT } from '../theme';
import { Txt } from './Txt';

/** Numbered source row; highlighted while its footnote is being followed. */
export function SourceRow({ src, active }: { src: Source; active: boolean }) {
  const { colors } = useApp();
  return (
    <Pressable onPress={() => openTarget(src)} accessibilityRole="link" style={[styles.source, { borderColor: active ? BLUE : colors.border, backgroundColor: active ? BLUE_TINT : 'transparent' }]}>
      <View style={styles.srcNum}>
        <Txt style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{src.n}</Txt>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt style={{ fontSize: 14, fontWeight: '600', lineHeight: 18.9 }}>{src.title}</Txt>
        <Txt style={{ fontSize: 12, color: colors.mist }}>{src.where}</Txt>
        {src.cta ? <Txt style={{ fontSize: 12, color: BLUE, fontWeight: '600' }}>{src.cta}</Txt> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  source: { flexDirection: 'row', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  srcNum: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
});
