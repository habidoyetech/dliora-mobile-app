import type { ErrorBoundaryProps } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Brand, Font, OnInk } from '@/constants/theme';

/**
 * Last line of defence: without this, a render error is a white screen in a
 * release build. Shown by Expo Router when a route below it throws.
 */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>
        That screen could not load. Try again — if it keeps happening, let the D-Liora team know.
      </Text>

      {/* The message is for us, not for creators. */}
      {__DEV__ && (
        <ScrollView style={styles.devBox} contentContainerStyle={styles.devBoxContent}>
          <Text style={styles.devText}>{error.message}</Text>
          {!!error.stack && <Text style={styles.devStack}>{error.stack}</Text>}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <PrimaryButton label="Try again" onPress={retry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 28,
    backgroundColor: Brand.ink,
  },
  title: { fontFamily: Font.bold, fontSize: 26, color: OnInk.text, textAlign: 'center' },
  body: { fontFamily: Font.regular, fontSize: 15, lineHeight: 23, color: OnInk.muted, textAlign: 'center' },
  devBox: {
    maxHeight: 220,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.inkLine,
    backgroundColor: Brand.inkRaised,
  },
  devBoxContent: { padding: 14, gap: 8 },
  devText: { fontFamily: Font.medium, fontSize: 13, lineHeight: 19, color: '#FF7A7A' },
  devStack: { fontFamily: Font.regular, fontSize: 11, lineHeight: 16, color: OnInk.muted },
  actions: { marginTop: 20 },
});
