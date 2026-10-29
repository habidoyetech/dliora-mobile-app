import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/** Signed-in screens (creator / manager portals come next). */
export default function AppLayout() {
  const theme = useTheme();

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }} />;
}
