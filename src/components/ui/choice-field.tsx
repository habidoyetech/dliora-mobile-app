import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';

type Props<T extends string | boolean> = {
  label: string;
  options: { label: string; value: T }[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string | null;
};

/** Side-by-side choices — the "Have you gone LIVE before?" Yes / No pair. */
export function ChoiceField<T extends string | boolean>({
  label,
  options,
  value,
  onChange,
  error,
}: Props<T>) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row} accessibilityRole="radiogroup">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.option, active ? styles.optionActive : styles.optionIdle]}>
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: 8 },
    label: { fontFamily: Font.medium, fontSize: 14, color: t.text },
    row: { flexDirection: 'row', gap: 12 },
    option: {
      flex: 1,
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.pill,
      borderWidth: 1.5,
    },
    optionIdle: { borderColor: t.border, backgroundColor: 'transparent' },
    optionActive: { borderColor: Brand.gold, backgroundColor: Brand.gold },
    optionLabel: { fontFamily: Font.medium, fontSize: 16, color: t.text },
    optionLabelActive: { fontFamily: Font.semibold, color: Brand.ink },
    error: { fontFamily: Font.regular, fontSize: 13, color: t.danger },
  });
