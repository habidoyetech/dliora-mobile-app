import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { Avatar } from '@/components/ui/avatar';
import { Brand, Font, OnInk, Radius, type ThemeColors } from '@/constants/theme';
import { useDashboard } from '@/hooks/use-dashboard';
import { useProfile, useUpdateAvatar } from '@/hooks/use-profile';
import { useThemedStyles, useTheme } from '@/hooks/use-theme';

function memberSince(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const router = useRouter();
  const { signOut } = useSession();
  const { data: profile, isRefetching, refetch } = useProfile();
  const dashboard = useDashboard();
  const avatar = useUpdateAvatar();
  const [error, setError] = useState<string | null>(null);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('D-LIORA needs access to your photos to change your picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setError(null);
    try {
      await avatar.mutateAsync({
        uri: asset.uri,
        name: asset.fileName ?? asset.uri.split('/').pop() ?? 'avatar.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That picture couldn’t be saved.');
    }
  };

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You’ll need your password to get back in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Brand.gold} />}>
      <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
        <Pressable
          onPress={pickAvatar}
          disabled={avatar.isPending}
          accessibilityRole="button"
          accessibilityLabel="Change your profile picture"
          style={styles.avatarWrap}>
          <Avatar uri={profile?.avatar_url} name={profile?.greeting_name ?? profile?.name} size={92} onInk />
          <View style={styles.avatarBadge}>
            <Ionicons name={avatar.isPending ? 'hourglass-outline' : 'camera'} size={14} color={Brand.ink} />
          </View>
        </Pressable>

        <Text style={styles.name}>{profile?.name ?? profile?.greeting_name ?? 'Your profile'}</Text>
        {!!profile?.d_liora_id && <Text style={styles.dlioraId}>{profile.d_liora_id}</Text>}
        {!!profile?.tiktok_handle && <Text style={styles.handle}>{profile.tiktok_handle}</Text>}

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{dashboard.data?.points.points ?? 0}</Text>
            <Text style={styles.heroStatLabel}>Points</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{dashboard.data?.rewards.diamonds ?? 0}</Text>
            <Text style={styles.heroStatLabel}>Diamonds</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>
              {dashboard.data?.points.rank ? `#${dashboard.data.points.rank}` : '—'}
            </Text>
            <Text style={styles.heroStatLabel}>Rank</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.card}>
          <Field label="TikTok username" value={profile?.tiktok_username} />
          <Field label="Email" value={profile?.email} />
          <Field label="Region" value={profile?.region_name} />
          <Field label="Bootcamp level" value={profile?.bootcamp_level} capitalise />
          <Field label="Member since" value={memberSince(profile?.member_since)} last />
        </View>

        <View style={styles.menu}>
          <Row
            icon="person-outline"
            label="Edit profile"
            onPress={() => router.push('/edit-profile')}
            theme={theme}
            styles={styles}
          />
          <Row
            icon="lock-closed-outline"
            label="Change password"
            onPress={() => router.push('/change-password')}
            theme={theme}
            styles={styles}
          />
          <Row
            icon="trophy-outline"
            label="Rewards"
            onPress={() => router.push('/rewards')}
            theme={theme}
            styles={styles}
          />
          <Row
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/for-you')}
            theme={theme}
            styles={styles}
            last
          />
        </View>

        <Pressable onPress={confirmSignOut} accessibilityRole="button" style={styles.signOut}>
          <Ionicons name="log-out-outline" size={19} color={theme.danger} />
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  capitalise,
  last,
}: {
  label: string;
  value?: string | null;
  capitalise?: boolean;
  last?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.field, last && styles.fieldLast]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, capitalise && styles.fieldValueCapitalised]} numberOfLines={1}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

function Row({
  icon,
  label,
  onPress,
  theme,
  styles,
  danger,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  theme: ThemeColors;
  styles: Styles;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.row, last && styles.rowLast]}>
      <Ionicons name={icon} size={19} color={danger ? theme.danger : theme.text} />
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color={theme.textFaint} />
    </Pressable>
  );
}

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    scroll: { flexGrow: 1 },

    hero: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 28, backgroundColor: Brand.ink },
    avatarWrap: { marginBottom: 14 },
    avatarBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2.5,
      borderColor: Brand.ink,
      backgroundColor: Brand.gold,
    },
    name: { fontFamily: Font.bold, fontSize: 22, color: OnInk.text, letterSpacing: -0.3 },
    dlioraId: { fontFamily: Font.semibold, fontSize: 14, color: Brand.gold, marginTop: 4 },
    handle: { fontFamily: Font.regular, fontSize: 13.5, color: OnInk.muted, marginTop: 2 },

    heroStats: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      marginTop: 22,
      paddingVertical: 16,
      borderRadius: Radius.field,
      backgroundColor: Brand.inkRaised,
    },
    heroStat: { flex: 1, alignItems: 'center', gap: 3 },
    heroStatValue: { fontFamily: Font.bold, fontSize: 19, color: OnInk.text },
    heroStatLabel: { fontFamily: Font.regular, fontSize: 12.5, color: OnInk.muted },
    heroDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: Brand.inkLine },

    body: { flex: 1, paddingHorizontal: 20, paddingTop: 22, gap: 18, backgroundColor: t.background },
    card: { borderRadius: Radius.field, backgroundColor: t.surface, overflow: 'hidden' },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    fieldLast: { borderBottomWidth: 0 },
    fieldLabel: { fontFamily: Font.regular, fontSize: 14, color: t.textMuted },
    fieldValue: { flex: 1, fontFamily: Font.semibold, fontSize: 14.5, color: t.text, textAlign: 'right' },
    fieldValueCapitalised: { textTransform: 'capitalize' },

    menu: { borderRadius: Radius.field, backgroundColor: t.surface, overflow: 'hidden' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    rowLast: { borderBottomWidth: 0 },
    rowLabel: { flex: 1, fontFamily: Font.medium, fontSize: 15, color: t.text },
    rowLabelDanger: { color: t.danger },

    signOut: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 52,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: t.border,
    },
    signOutLabel: { fontFamily: Font.semibold, fontSize: 15, color: t.danger },
    error: { fontFamily: Font.medium, fontSize: 13.5, lineHeight: 20, color: t.danger },
  });
