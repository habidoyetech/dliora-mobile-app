import { Stack } from 'expo-router';

import { Brand } from '@/constants/theme';

/** Signed-in screens (creator / manager portals come next). */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Brand.page } }} />;
}
