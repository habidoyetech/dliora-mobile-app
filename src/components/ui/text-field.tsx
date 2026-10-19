import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Brand, Font, Radius } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  /** shown under the field in red */
  error?: string | null;
  /** adds a Show / Hide toggle and hides the text */
  password?: boolean;
};

/** Labelled input with a gold focus ring, matching the web portal's fields. */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, password, style, onFocus, onBlur, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused, !!error && styles.fieldError]}>
        <TextInput
          ref={ref}
          placeholderTextColor={Brand.textFaint}
          selectionColor={Brand.gold}
          cursorColor={Brand.gold}
          secureTextEntry={password && hidden}
          style={[styles.input, style]}
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

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontFamily: Font.medium, fontSize: 14, color: Brand.text },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: Radius.field,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: Brand.field,
  },
  fieldFocused: { borderColor: Brand.gold, backgroundColor: Brand.white },
  fieldError: { borderColor: Brand.danger },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: Font.regular,
    fontSize: 16,
    color: Brand.text,
  },
  toggle: { fontFamily: Font.semibold, fontSize: 13, color: Brand.gold },
  error: { fontFamily: Font.regular, fontSize: 13, color: Brand.danger },
});
