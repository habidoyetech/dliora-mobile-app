import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Font, OnInk, Radius, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Sits on the ink header rather than a light surface. */
  onInk?: boolean;
};

/** The gold pill switch — Journey / Library on the Bootcamp header. */
export function Segmented<T extends string>({ options, value, onChange, onInk }: Props<T>) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.track, onInk ? styles.trackInk : styles.trackLight]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}>
            <Text
              style={[
                styles.label,
                onInk && styles.labelOnInk,
                active && styles.labelActive,
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    track: { flexDirection: 'row', padding: 5, borderRadius: Radius.pill },
    trackInk: { backgroundColor: Brand.inkRaised },
    trackLight: { backgroundColor: t.surfaceRaised },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 11,
      borderRadius: Radius.pill,
    },
    segmentActive: { backgroundColor: Brand.gold },
    label: { fontFamily: Font.medium, fontSize: 15, color: t.textMuted },
    labelOnInk: { color: OnInk.muted },
    labelActive: { fontFamily: Font.bold, color: Brand.ink },
  });
