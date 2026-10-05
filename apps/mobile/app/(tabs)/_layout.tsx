import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '../../src/components/TabBar';
import { useApp } from '../../src/state/AppState';

// Live · Meetings · Videos · Radio · Support — Videos sits in the centre.
export default function TabsLayout() {
  const { colors } = useApp();
  return (
    <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="meetings" />
      <Tabs.Screen name="videos" />
      <Tabs.Screen name="radio" />
      <Tabs.Screen name="support" />
    </Tabs>
  );
}
