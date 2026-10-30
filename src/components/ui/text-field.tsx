import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';

type Props = TextInputProps & {
  label: string;
  /** shown under the field in red */
  error?: string | null;
  /** adds a Show / Hide toggle and hides the text */
  password?: boolean;
  /** grows into a text area — for longer free-text answers */
  multiline?: boolean;
};

/** Labelled input with a gold focus ring, matching the web portal's fields. */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, password, multiline, style, onFocus, onBlur, ...props },
  ref,
) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}>
        <TextInput
          ref={ref}
          placeholderTextColor={theme.textFaint}
          selectionColor={Brand.gold}
          cursorColor={Brand.gold}
          secureTextEntry={password && hidden}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {password && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            <Text style={styles.toggle}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: 8 },
    label: { fontFamily: Font.medium, fontSize: 14, color: t.text },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 54,
      paddingHorizontal: 16,
      borderRadius: Radius.field,
      borderWidth: 1.5,
      borderColor: 'transparent',
      backgroundColor: t.surfaceRaised,
    },
    fieldMultiline: { alignItems: 'stretch', minHeight: 128, paddingVertical: 4 },
    fieldFocused: { borderColor: Brand.gold, backgroundColor: t.surface },
    fieldError: { borderColor: t.danger },
    input: {
      flex: 1,
      paddingVertical: 14,
      fontFamily: Font.regular,
      fontSize: 16,
      color: t.text,
    },
    inputMultiline: { minHeight: 112, lineHeight: 22 },
    toggle: { fontFamily: Font.semibold, fontSize: 13, color: t.link },
    error: { fontFamily: Font.regular, fontSize: 13, color: t.danger },
  });
