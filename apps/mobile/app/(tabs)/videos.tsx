import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { ICON } from '../../src/components/icons';
import { CastButton, YouTubeEmbed } from '../../src/components/media';
import { Txt } from '../../src/components/Txt';
import { Eyebrow, H2, OverlayLabel, Press, Thumb } from '../../src/components/ui';
import { durationLabel, fetchAllVideos, timeAgo, VIDEO_SOURCES, type VideoPost } from '../../src/data/youtubeFeed';
import { useApp } from '../../src/state/AppState';
import { BLUE, GUTTER } from '../../src/theme';

const PAGE = 15;

export default function VideosScreen() {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  // undefined = loading, null = could not load.
  const [videos, setVideos] = useState<VideoPost[] | null | undefined>(undefined);
  const [shown, setShown] = useState(PAGE);
  useEffect(() => {
    let alive = true;
    fetchAllVideos().then(v => alive && setVideos(v));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 16 }}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <Eyebrow>Videos</Eyebrow>
          <H2>Maui, by the people who live here.</H2>
        </View>
      </View>

      {videos === undefined ? (
        <View style={{ paddingVertical: 48 }}>
          <ActivityIndicator color={colors.mist} />
        </View>
      ) : videos === null || videos.length === 0 ? (
        <View style={{ paddingHorizontal: GUTTER, paddingVertical: 32, gap: 12 }}>
          <Txt style={{ fontSize: 16, lineHeight: 24 }}>Couldn’t load the videos right now.</Txt>
          <Press
            onPress={() => Linking.openURL(`https://www.youtube.com/playlist?list=${VIDEO_SOURCES[0].playlistId}`)}
            accessibilityRole="link"
            style={{ alignSelf: 'flex-start', paddingVertical: 8 }}
          >
            <Txt style={{ fontSize: 15, fontWeight: '700', color: BLUE }}>Watch on YouTube →</Txt>
          </Press>
        </View>
      ) : (
        <>
          {videos.slice(0, shown).map(v => (
            <Post key={v.id} v={v} />
          ))}
          {shown < videos.length ? (
            <Press onPress={() => setShown(n => n + PAGE)} accessibilityRole="button" style={{ alignSelf: 'center', paddingVertical: 16, paddingHorizontal: 24 }}>
              <Txt style={{ fontSize: 15, fontWeight: '700', color: BLUE }}>Show more videos</Txt>
            </Press>
          ) : null}
        </>
      )}

      <View style={{ paddingHorizontal: GUTTER, paddingVertical: 20 }}>
        <Txt style={{ fontSize: 13, lineHeight: 19.5, color: colors.mist }}>
          Videos play from Akakū’s YouTube channel. Likes and comments are on YouTube. Akakū doesn’t edit for viewpoint — only for the{' '}
          <Txt style={{ fontSize: 13, color: BLUE, fontWeight: '600' }} onPress={() => Linking.openURL('https://www.akaku.org/policies-procedures/')}>
            community media policies
          </Txt>
          .
        </Txt>
      </View>
    </ScrollView>
  );
}

function Post({ v }: { v: VideoPost }) {
  const { colors } = useApp();
  const [playing, setPlaying] = useState(false);
  const url = `https://youtu.be/${v.id}`;
  const share = () => Share.share({ message: `${v.title} ${url}` }).catch(() => {});

  return (
    <View style={[styles.post, { borderBottomColor: colors.border }]}>
      <Pressable onPress={() => setPlaying(true)} accessibilityRole="button" accessibilityLabel={`Play ${v.title}`} style={{ marginHorizontal: -GUTTER }}>
        <Thumb uri={v.thumbnailUrl}>
          {playing ? (
            <YouTubeEmbed id={v.id} title={v.title} />
          ) : (
            <>
              <View style={styles.playDisc}>
                <Icon d={ICON.play} size={26} color={BLUE} filled />
              </View>
              {v.durationSeconds ? <OverlayLabel style={{ right: 8, bottom: 8, paddingVertical: 2, paddingHorizontal: 6 }}>{durationLabel(v.durationSeconds)}</OverlayLabel> : null}
            </>
          )}
        </Thumb>
      </Pressable>

      <View style={{ gap: 2 }}>
        <Txt style={{ fontSize: 17, fontWeight: '700', lineHeight: 22 }}>{v.title}</Txt>
        <Txt style={{ fontSize: 13, color: colors.mist }}>{[v.author, timeAgo(v.publishedISO)].filter(Boolean).join(' · ')}</Txt>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={share} accessibilityRole="button" style={styles.action}>
          <Icon d={ICON.share} size={20} color={colors.mist} />
          <Txt style={{ fontSize: 13, fontWeight: '600', color: colors.mist }}>Share</Txt>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(url)} accessibilityRole="link" accessibilityLabel="Open in YouTube" style={styles.action}>
          <Txt style={{ fontSize: 13, fontWeight: '600', color: BLUE }}>Open in YouTube</Txt>
        </Pressable>
        <View style={{ flex: 1 }} />
        <CastButton color={colors.mist} size={40} iconSize={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 12, paddingHorizontal: GUTTER, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  post: { gap: 12, paddingVertical: 16, paddingHorizontal: GUTTER, borderBottomWidth: 4 },
  playDisc: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: -8 },
  action: { height: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10 },
});
