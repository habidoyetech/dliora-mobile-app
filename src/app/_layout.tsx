import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useSession } from '@/auth/session';
import { BrandSplash, holdNativeSplash } from '@/components/brand-splash';
import { Brand } from '@/constants/theme';

// Keep the native splash up until the branded one takes over.
holdNativeSplash();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <SessionProvider>
          <StatusBar style="light" />
          {(fontsLoaded || fontError) && <RootNavigator />}
          <SplashGate fontsReady={fontsLoaded || !!fontError} />
        </SessionProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

/** Signed out → sign-in; signed in → the app. Switching sessions flips the guards. */
function RootNavigator() {
  const { token } = useSession();

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: Brand.ink } }}>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

function SplashGate({ fontsReady }: { fontsReady: boolean }) {
  const { isLoading } = useSession();
  return <BrandSplash ready={fontsReady && !isLoading} />;
}
