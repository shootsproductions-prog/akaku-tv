import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { fetchRadioSchedule, radioNowNext, RADIO_STREAM_URL, type RadioShow } from '../data/radio.ts';

type RadioState = {
  /** False until Akakū provides the stream address. */
  available: boolean;
  playing: boolean;
  loading: boolean;
  failed: boolean;
  toggle: () => void;
  now: RadioShow | null;
  upcoming: RadioShow[];
};

const Ctx = createContext<RadioState>({ available: false, playing: false, loading: false, failed: false, toggle: () => {}, now: null, upcoming: [] });

/** One KAKU 88.5 player for the whole app, so it keeps playing across tabs and with the screen off. */
export function RadioProvider({ children }: { children: ReactNode }) {
  const player = useRef<AudioPlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [shows, setShows] = useState<RadioShow[]>([]);
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    const load = () => fetchRadioSchedule().then(s => alive && s && setShows(s));
    load();
    const poll = setInterval(load, 5 * 60 * 1000);
    const tick = setInterval(() => setClock(Date.now()), 30 * 1000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(tick);
      player.current?.remove();
    };
  }, []);

  const toggle = useCallback(async () => {
    if (!RADIO_STREAM_URL) return;
    try {
      if (!player.current) {
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' });
        const p = createAudioPlayer(RADIO_STREAM_URL);
        p.addListener('playbackStatusUpdate', s => {
          setPlaying(s.playing);
          setLoading(s.isBuffering && !s.playing);
        });
        player.current = p;
        p.setActiveForLockScreen(true, { title: 'KAKU 88.5 FM', artist: 'Akakū · The Voice of Maui' });
        setFailed(false);
        p.play();
        return;
      }
      const p = player.current;
      if (p.playing) {
        p.pause();
      } else {
        // A live stream must rejoin the live edge, not resume where it was paused.
        setFailed(false);
        p.replace(RADIO_STREAM_URL);
        p.play();
      }
    } catch {
      setFailed(true);
      setPlaying(false);
      setLoading(false);
    }
  }, []);

  const value = useMemo<RadioState>(() => {
    const { now, upcoming } = radioNowNext(shows, clock);
    return { available: !!RADIO_STREAM_URL, playing, loading, failed, toggle, now, upcoming };
  }, [shows, clock, playing, loading, failed, toggle]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useRadio = () => useContext(Ctx);
