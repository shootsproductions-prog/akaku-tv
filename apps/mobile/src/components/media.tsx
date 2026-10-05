import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useApp } from '../state/AppState';
import { BLUE } from '../theme';
import { CAST } from './icons';
import { IconButton } from './ui';

/** Inline YouTube player (privacy-enhanced embed), as on akaku.org. */
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  return (
    <WebView
      style={StyleSheet.absoluteFill}
      source={{ uri: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1` }}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo
      accessibilityLabel={title}
    />
  );
}

/** Live HLS from Castus. AirPlay is native on iOS via allowsExternalPlayback. */
export function LiveVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => {
    p.allowsExternalPlayback = true;
    p.play();
  });
  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="contain" allowsPictureInPicture />
    </View>
  );
}

/** AirPlay (iOS) / Cast (Android) button — opens the device sheet; blue while connected. */
export function CastButton({ color, size = 44, iconSize = 22, border }: { color: string; size?: number; iconSize?: number; border?: string }) {
  const { castDevice, openSheet } = useApp();
  return <IconButton d={CAST.icon} label={CAST.label} color={castDevice ? BLUE : color} size={size} iconSize={iconSize} border={border} onPress={() => openSheet('cast')} />;
}
