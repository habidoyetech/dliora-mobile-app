import { StyleSheet, Text, View } from 'react-native';

import { Font, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';

/**
 * Mirrors `CreatorPassword::rules()` on the API — `Password::min(8)->numbers()
 * ->mixedCase()`. Keep the two in step; the server is the one that decides.
 */
export const passwordRules = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'An uppercase and a lowercase letter', test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: 'At least one number', test: (v: string) => /\d/.test(v) },
] as const;

export function isPasswordValid(value: string): boolean {
  return passwordRules.every((rule) => rule.test(value));
}

/** The live requirement list under the new-password field. */
export function PasswordChecklist({ value }: { value: string }) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.list} accessibilityRole="list">
      {passwordRules.map((rule) => {
        const met = rule.test(value);
        return (
          <View key={rule.label} style={styles.row}>
            <Text style={[styles.tick, met && styles.tickMet]}>{met ? '✓' : '•'}</Text>
            <Text
              style={[styles.label, met && styles.labelMet]}
              accessibilityLabel={`${rule.label}: ${met ? 'met' : 'not met yet'}`}>
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    list: { gap: 6 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tick: { width: 14, textAlign: 'center', fontFamily: Font.semibold, fontSize: 13, color: t.textFaint },
    tickMet: { color: t.success },
    label: { fontFamily: Font.regular, fontSize: 13, color: t.textMuted },
    labelMet: { color: t.text },
  });
