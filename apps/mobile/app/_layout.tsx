import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SheetHost } from '../src/components/Sheets';
import { AppStateProvider, useApp } from '../src/state/AppState';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <Root />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { colors, isDark } = useApp();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="player/[num]" />
        <Stack.Screen name="meeting/[id]" />
        <Stack.Screen name="issue/[name]" />
        <Stack.Screen name="explainer/[id]" />
      </Stack>
      <SheetHost />
    </>
  );
}
