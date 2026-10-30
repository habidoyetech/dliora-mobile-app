import { StyleSheet, Text, View } from 'react-native';

import { Font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StatusTone = 'pending' | 'idle' | 'done';

const LABELS: Record<StatusTone, string> = {
  pending: 'Under Review',
  idle: 'Not Submitted',
  done: 'Completed',
};

/** The assignment status chips — amber in review, grey untouched, green done. */
export function StatusPill({ tone, label }: { tone: StatusTone; label?: string }) {
  const t = useTheme();
  const palette = {
    pending: { bg: '#F7E7C4', fg: '#8A6412' },
    idle: { bg: t.surfaceRaised, fg: t.textMuted },
    done: { bg: '#DCF3E3', fg: '#17703C' },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: palette.fg }]}>{label ?? LABELS[tone]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill },
  label: { fontFamily: Font.semibold, fontSize: 12.5 },
});
