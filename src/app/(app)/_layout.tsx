import { Stack } from 'expo-router';

import { useRealtimeLifecycle } from '@/hooks/use-realtime';
import { useTheme } from '@/hooks/use-theme';

/** Signed-in screens (creator / manager portals come next). */
export default function AppLayout() {
  const theme = useTheme();

  // The chat socket follows the app in and out of the background.
  useRealtimeLifecycle();

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }} />;
}
