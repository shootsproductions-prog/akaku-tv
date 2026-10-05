import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';

import { plainText } from './segments';

/** Read-aloud toggle for recaps and explainers. Stops when the screen goes away. */
export function useReadAloud(text: string) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => void Speech.stop(), []);
  const toggle = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(plainText(text), {
      language: 'en-US',
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };
  return { speaking, toggle };
}
