import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModalSheet } from '@/components/ui/modal-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Font, Radius, type ThemeColors } from '@/constants/theme';
import { useProfile, useProfileOptions, useUpdateProfile, type ProfileUpdate } from '@/hooks/use-profile';
import { useThemedStyles } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  const { data: profile } = useProfile();
  const options = useProfileOptions();
  const update = useUpdateProfile();

  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [middleName, setMiddleName] = useState(profile?.middle_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [tiktok, setTiktok] = useState(profile?.tiktok_username ?? '');
  const [region, setRegion] = useState(profile?.region ?? '');
  const [niche, setNiche] = useState<string | null>(profile?.niche ?? null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  /** Only what actually changed is sent, so a blank optional field isn't wiped. */
  const changes = (): ProfileUpdate => {
    const next: ProfileUpdate = {};
    if (firstName.trim() !== (profile?.first_name ?? '')) next.first_name = firstName.trim();
    if (middleName.trim() !== (profile?.middle_name ?? '')) next.middle_name = middleName.trim() || null;
    if (lastName.trim() !== (profile?.last_name ?? '')) next.last_name = lastName.trim() || null;
    if (tiktok.trim() !== (profile?.tiktok_username ?? '')) next.tiktok_username = tiktok.trim();
    if (region.trim() !== (profile?.region ?? '')) next.region = region.trim() || null;
    if ((niche ?? '') !== (profile?.niche ?? '')) next.niche = niche;
    return next;
  };

  const save = async () => {
    setErrors({});
    setMessage(null);

    const payload = changes();
    if (Object.keys(payload).length === 0) {
      router.back();
      return;
    }
    if (!firstName.trim()) {
      setErrors({ first_name: 'Your first name is needed.' });
      return;
    }

    try {
      await update.mutateAsync(payload);
      setSaved(true);
    } catch (cause) {
      if (cause instanceof ApiError) {
        setErrors(
          Object.fromEntries(Object.entries(cause.errors).map(([key, messages]) => [key, messages[0]])),
        );
        setMessage(Object.keys(cause.errors).length === 0 ? cause.message : null);
      } else {
        setMessage('Your changes didn’t save. Check your connection and try again.');
      }
    }
  };

  const changingHandle = tiktok.trim() !== (profile?.tiktok_username ?? '') && !!tiktok.trim();

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Edit profile" />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        bottomOffset={24}>
        <TextField
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          error={errors.first_name}
          autoCapitalize="words"
          textContentType="givenName"
        />
        <TextField
          label="Middle name (optional)"
          value={middleName}
          onChangeText={setMiddleName}
          error={errors.middle_name}
          autoCapitalize="words"
        />
        <TextField
          label="Last name (optional)"
          value={lastName}
          onChangeText={setLastName}
          error={errors.last_name}
          autoCapitalize="words"
          textContentType="familyName"
        />
        <TextField
          label="TikTok username"
          value={tiktok}
          onChangeText={setTiktok}
          error={errors.tiktok_username}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="yourname"
        />
        {changingHandle && (
          <Text style={styles.warning}>
            You sign in with your TikTok username — change it here and you&apos;ll use the new one next time.
          </Text>
        )}
        <TextField
          label="Region"
          value={region}
          onChangeText={setRegion}
          error={errors.region}
          autoCapitalize="words"
          placeholder="United Kingdom"
        />
        <SelectField
          label="Your niche"
          placeholder="Choose a niche"
          options={options.data?.niches ?? []}
          value={niche}
          onChange={setNiche}
          loading={options.isLoading}
          error={errors.niche}
        />

        <View style={styles.readOnly}>
          <Text style={styles.readOnlyLabel}>Email</Text>
          <Text style={styles.readOnlyValue}>{profile?.email ?? '—'}</Text>
          <Text style={styles.readOnlyNote}>
            Your email and D-LIORA ID are fixed. Ask your manager if either needs changing.
          </Text>
        </View>

        {!!message && <Text style={styles.error}>{message}</Text>}

        <PrimaryButton label="Save changes" loading={update.isPending} onPress={save} />
      </KeyboardAwareScrollView>

      <ModalSheet
        visible={saved}
        title="Saved"
        body="Your profile is up to date."
        actionLabel="Done"
        onAction={() => {
          setSaved(false);
          router.back();
        }}
      />
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
    warning: { fontFamily: Font.regular, fontSize: 13, lineHeight: 19, color: t.textMuted, marginTop: -8 },
    readOnly: { padding: 16, gap: 4, borderRadius: Radius.field, backgroundColor: t.surface },
    readOnlyLabel: { fontFamily: Font.regular, fontSize: 13, color: t.textMuted },
    readOnlyValue: { fontFamily: Font.semibold, fontSize: 15, color: t.text },
    readOnlyNote: { fontFamily: Font.regular, fontSize: 12.5, lineHeight: 18, color: t.textFaint, marginTop: 4 },
    error: { fontFamily: Font.medium, fontSize: 13.5, lineHeight: 20, color: t.danger },
  });
