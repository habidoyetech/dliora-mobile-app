import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, type ThemeColors } from '@/constants/theme';
import { useThemedStyles, useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  /** Sits on the right of the title — a "Clear all" or "Mark read" action. */
  action?: { label: string; onPress: () => void; disabled?: boolean };
};

/** Back arrow, title, optional text action. Used by the stacked screens. */
export function ScreenHeader({ title, action }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.text} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {action ? (
        <Pressable onPress={action.onPress} disabled={action.disabled} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.action, action.disabled && styles.actionOff]}>{action.label}</Text>
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
      backgroundColor: t.background,
    },
    back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    title: { flex: 1, fontFamily: Font.bold, fontSize: 18, color: t.text, letterSpacing: -0.2 },
    action: { fontFamily: Font.semibold, fontSize: 14, color: t.link, paddingHorizontal: 6 },
    actionOff: { color: t.textFaint },
  });
