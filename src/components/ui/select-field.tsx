import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';

export type SelectOption = { label: string; value: string };

type Props = {
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string | null;
  /** Shown in place of the list while options are still loading. */
  loading?: boolean;
  disabled?: boolean;
};

/**
 * A field that opens its options in a sheet. Deliberately not a native picker:
 * the iOS wheel and the Android dialog look nothing alike, and this form is
 * long enough that consistency matters more than platform convention.
 */
export function SelectField({
  label,
  placeholder,
  options,
  value,
  onChange,
  error,
  loading,
  disabled,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);
  const unavailable = disabled || loading;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => !unavailable && setOpen(true)}
        disabled={unavailable}
        accessibilityRole="button"
        accessibilityState={{ expanded: open, disabled: !!unavailable }}
        accessibilityLabel={`${label}. ${selected ? selected.label : placeholder}`}
        style={[styles.field, !!error && styles.fieldError, unavailable && styles.fieldDisabled]}>
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {loading ? 'Loading…' : (selected?.label ?? placeholder)}
        </Text>
        <View style={styles.chevron} />
      </Pressable>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Animated.View entering={FadeIn.duration(160)} style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel="Close" />

          <Animated.View
            entering={FadeInDown.duration(240)}
            style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>{label}</Text>

            <ScrollView bounces={false} contentContainerStyle={styles.list}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.option, active && styles.optionActive]}>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{option.label}</Text>
                    {active && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: 8 },
    label: { fontFamily: Font.medium, fontSize: 14, color: t.text },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      minHeight: 54,
      paddingHorizontal: 16,
      borderRadius: Radius.field,
      borderWidth: 1.5,
      borderColor: 'transparent',
      backgroundColor: t.surfaceRaised,
    },
    fieldError: { borderColor: t.danger },
    fieldDisabled: { opacity: 0.6 },
    value: { flex: 1, fontFamily: Font.regular, fontSize: 16, color: t.text },
    placeholder: { color: t.textFaint },
    chevron: {
      width: 9,
      height: 9,
      marginTop: -4,
      borderRightWidth: 1.8,
      borderBottomWidth: 1.8,
      borderColor: t.textMuted,
      transform: [{ rotate: '45deg' }],
    },
    error: { fontFamily: Font.regular, fontSize: 13, color: t.danger },

    scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,13,14,0.55)' },
    sheet: {
      maxHeight: '70%',
      paddingTop: 10,
      paddingHorizontal: 20,
      borderTopLeftRadius: Radius.sheet,
      borderTopRightRadius: Radius.sheet,
      backgroundColor: t.surface,
    },
    grabber: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      marginBottom: 16,
      backgroundColor: t.border,
    },
    sheetTitle: { fontFamily: Font.semibold, fontSize: 17, color: t.text, marginBottom: 8 },
    list: { paddingBottom: 8 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 52,
      paddingHorizontal: 16,
      borderRadius: Radius.field,
    },
    optionActive: { backgroundColor: t.surfaceRaised },
    optionLabel: { fontFamily: Font.regular, fontSize: 16, color: t.text },
    optionLabelActive: { fontFamily: Font.semibold },
    check: { fontFamily: Font.semibold, fontSize: 15, color: Brand.gold },
  });
