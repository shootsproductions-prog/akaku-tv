import { useState } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { ICON } from '../../src/components/icons';
import { CastButton, YouTubeEmbed } from '../../src/components/media';
import { Txt } from '../../src/components/Txt';
import { Chip, Eyebrow, H2, OverlayLabel, Press, Thumb } from '../../src/components/ui';
import { FEED, FEED_FILTERS } from '../../src/data/videos';
import type { FeedFilter, FeedItem } from '../../src/data/types';
import { useApp } from '../../src/state/AppState';
import { BLUE, RED, GUTTER } from '../../src/theme';

export default function VideosScreen() {
  const { colors, user, openSubmit } = useApp();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FeedFilter['id']>('all');
  const feed = FEED.filter(v => filter === 'all' || v.cat === filter);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 16 }}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <Eyebrow>Community video</Eyebrow>
          <H2>Maui, by the people who live here.</H2>
        </View>
        <Press onPress={openSubmit} accessibilityRole="button" accessibilityLabel={user ? 'Submit a video' : 'Sign up to submit'} style={styles.submit}>
          <Icon d={ICON.plus} size={18} color="#fff" strokeWidth={2.2} />
          <Txt style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Submit</Txt>
        </Press>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 16, paddingHorizontal: GUTTER, paddingBottom: 4 }}>
        {FEED_FILTERS.map(f => (
          <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </ScrollView>

      {feed.map(v => (
        <FeedPost key={v.id} v={v} />
      ))}

      <View style={{ paddingHorizontal: GUTTER, paddingVertical: 20 }}>
        <Txt style={{ fontSize: 13, lineHeight: 19.5, color: colors.mist }}>
          Videos stream from Akakū's YouTube channel. Community submissions air on Channel 54 and here. Akakū doesn't edit for viewpoint — only for the{' '}
          <Txt style={{ fontSize: 13, color: BLUE, fontWeight: '600' }} onPress={() => Linking.openURL('https://www.akaku.org/policies-procedures/')}>
            community media policies
          </Txt>
          .
        </Txt>
      </View>
    </ScrollView>
  );
}

function FeedPost({ v }: { v: FeedItem }) {
  const { colors, liked, toggleLike } = useApp();
  const [playing, setPlaying] = useState(false);
  const isLiked = !!liked[v.id];
  const share = () => Share.share({ message: v.youtubeId ? `${v.title} https://youtu.be/${v.youtubeId}` : `${v.title} — on Akakū` }).catch(() => {});

  return (
    <View style={[styles.post, { borderBottomColor: colors.border }]}>
      <View style={styles.byline}>
        <View style={[styles.avatar, { backgroundColor: v.community ? colors.wash : BLUE }]}>
          <Txt style={{ fontSize: 13, fontWeight: '800', color: v.community ? colors.text : '#fff' }}>{v.av}</Txt>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt style={{ fontSize: 14, fontWeight: '700', lineHeight: 16.8 }}>{v.producer}</Txt>
          <Txt style={{ fontSize: 12, color: colors.mist }}>
            {v.pl} · {v.meta}
          </Txt>
        </View>
        {v.community ? (
          <View style={[styles.communityTag, { backgroundColor: colors.wash }]}>
            <Txt style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>Community</Txt>
          </View>
        ) : null}
      </View>

      <Pressable onPress={() => v.youtubeId && setPlaying(true)} accessibilityRole="button" accessibilityLabel={`Play ${v.title}`} style={{ marginHorizontal: -GUTTER }}>
        <Thumb uri={v.thumbnailUrl ?? (v.youtubeId ? `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg` : null)}>
          {playing && v.youtubeId ? (
            <YouTubeEmbed id={v.youtubeId} title={v.title} />
          ) : (
            <>
              <View style={styles.playDisc}>
                <Icon d={ICON.play} size={26} color={BLUE} filled />
              </View>
              <OverlayLabel style={{ right: 8, bottom: 8, paddingVertical: 2, paddingHorizontal: 6 }}>{v.dur}</OverlayLabel>
            </>
          )}
        </Thumb>
      </Pressable>

      <Txt style={{ fontSize: 16, fontWeight: '600', lineHeight: 20.8 }}>{v.title}</Txt>

      <View style={styles.actions}>
        <Pressable onPress={() => toggleLike(v.id)} accessibilityRole="button" accessibilityState={{ selected: isLiked }} accessibilityLabel="Like" style={styles.action}>
          <Icon d={ICON.heart} size={20} color={isLiked ? RED : colors.mist} fill={isLiked ? RED : undefined} />
          <Txt style={{ fontSize: 13, fontWeight: '600', color: isLiked ? RED : colors.mist }}>{(v.likes + (isLiked ? 1 : 0)).toLocaleString()}</Txt>
        </Pressable>
        <View style={styles.action} accessibilityLabel={`${v.comments} comments`}>
          <Icon d={ICON.comment} size={20} color={colors.mist} />
          <Txt style={{ fontSize: 13, fontWeight: '600', color: colors.mist }}>{v.comments}</Txt>
        </View>
        <Pressable onPress={share} accessibilityRole="button" style={styles.action}>
          <Icon d={ICON.share} size={20} color={colors.mist} />
          <Txt style={{ fontSize: 13, fontWeight: '600', color: colors.mist }}>Share</Txt>
        </Pressable>
        <View style={{ flex: 1 }} />
        <CastButton color={colors.mist} size={40} iconSize={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 12, paddingHorizontal: GUTTER, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  submit: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: BLUE, marginTop: 4 },
  post: { gap: 12, paddingVertical: 16, paddingHorizontal: GUTTER, borderBottomWidth: 4 },
  byline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  communityTag: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  playDisc: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: -8 },
  action: { height: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10 },
});
