import { Stack } from 'expo-router';

import { Brand } from '@/constants/theme';

/** The application flow: the form, then the hand-off into TikTok. */
export default function JoinAgencyLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Brand.ink } }} />;
}
