import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import {
  useAnnouncements,
  useMarkAnnouncementsRead,
  useMarkNotificationsRead,
  useNotifications,
} from '@/hooks/use-community';
import { useThemedStyles, useTheme } from '@/hooks/use-theme';
import { htmlToText } from '@/lib/html';

type Tab = 'notifications' | 'announcements';

function when(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  assignment: 'clipboard-outline',
  lesson: 'play-circle-outline',
  chat: 'chatbubble-ellipses-outline',
  reward: 'diamond-outline',
  leaderboard: 'trophy-outline',
  general: 'notifications-outline',
};

export default function ForYouScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('notifications');

  const notifications = useNotifications();
  const announcements = useAnnouncements();
  const markNotifications = useMarkNotificationsRead();
  const markAnnouncements = useMarkAnnouncementsRead();

  const onNotifications = tab === 'notifications';
  const query = onNotifications ? notifications : announcements;
  const unread = onNotifications
    ? (notifications.data?.meta.unread ?? 0)
    : (announcements.data?.meta.unread ?? 0);

  const markRead = () => (onNotifications ? markNotifications.mutate() : markAnnouncements.mutate());
  const marking = onNotifications ? markNotifications.isPending : markAnnouncements.isPending;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="For you"
        action={unread > 0 ? { label: 'Mark all read', onPress: markRead, disabled: marking } : undefined}
      />

      <View style={styles.tabs}>
        {(['notifications', 'announcements'] as Tab[]).map((name) => {
          const active = tab === name;
          const count =
            name === 'notifications'
              ? (notifications.data?.meta.unread ?? 0)
              : (announcements.data?.meta.unread ?? 0);
          return (
            <Pressable
              key={name}
              onPress={() => setTab(name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {name === 'notifications' ? 'Notifications' : 'Announcements'}
              </Text>
              {count > 0 && (
                <View style={styles.tabCount}>
                  <Text style={styles.tabCountText}>{count > 9 ? '9+' : count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {query.isLoading ? (
        <View style={styles.centred}>
          <ActivityIndicator color={Brand.gold} />
        </View>
      ) : onNotifications ? (
        <FlatList
          data={notifications.data?.data ?? []}
          keyExtractor={(row) => row.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={notifications.isRefetching}
              onRefresh={notifications.refetch}
              tintColor={Brand.gold}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, !item.read_at && styles.rowUnread]}
              disabled={!item.url}
              accessibilityRole={item.url ? 'button' : undefined}
              onPress={() => item.url && router.push(item.url as never)}>
              <View style={styles.rowIcon}>
                <Ionicons
                  name={ICONS[item.category] ?? ICONS.general}
                  size={18}
                  color={item.read_at ? theme.textMuted : Brand.goldDeep}
                />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.title ?? 'Update'}</Text>
                {!!item.body && <Text style={styles.rowBody}>{item.body}</Text>}
                <Text style={styles.rowWhen}>{when(item.created_at)}</Text>
              </View>
              {!item.read_at && <View style={styles.dot} />}
            </Pressable>
          )}
          ListEmptyComponent={<Empty styles={styles} text="Nothing new. We'll let you know when there is." />}
        />
      ) : (
        <FlatList
          data={announcements.data?.data ?? []}
          keyExtractor={(row) => String(row.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={announcements.isRefetching}
              onRefresh={announcements.refetch}
              tintColor={Brand.gold}
            />
          }
          renderItem={({ item }) => (
            <View style={[styles.card, !item.is_read && styles.cardUnread]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardGlyph}>📣</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              <Text style={styles.cardBody}>{htmlToText(item.body)}</Text>
              {!!item.context.datetime && (
                <View style={styles.cardMetaRow}>
                  <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                  <Text style={styles.cardMeta}>
                    {new Date(item.context.datetime).toLocaleString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}
              <Text style={styles.cardAudience}>{item.audience_label}</Text>
            </View>
          )}
          ListEmptyComponent={<Empty styles={styles} text="No announcements right now." />}
        />
      )}
    </View>
  );
}

function Empty({ styles, text }: { styles: Styles; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    tabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: Radius.pill,
      backgroundColor: t.surfaceRaised,
    },
    tabActive: { backgroundColor: Brand.gold },
    tabLabel: { fontFamily: Font.medium, fontSize: 14, color: t.textMuted },
    tabLabelActive: { fontFamily: Font.semibold, color: Brand.ink },
    tabCount: {
      minWidth: 18,
      height: 18,
      paddingHorizontal: 5,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#E8402A',
    },
    tabCountText: { fontFamily: Font.bold, fontSize: 10.5, color: Brand.white },

    list: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },

    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 14,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    rowUnread: { backgroundColor: t.surface, borderLeftWidth: 3, borderLeftColor: Brand.gold },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceRaised,
    },
    rowCopy: { flex: 1, gap: 3 },
    rowTitle: { fontFamily: Font.semibold, fontSize: 15, color: t.text },
    rowBody: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, color: t.textMuted },
    rowWhen: { fontFamily: Font.regular, fontSize: 12, color: t.textFaint },
    dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: Brand.gold },

    card: { padding: 16, gap: 8, borderRadius: Radius.field, backgroundColor: t.surface },
    cardUnread: { borderLeftWidth: 3, borderLeftColor: Brand.gold },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardGlyph: { fontSize: 18 },
    cardTitle: { flex: 1, fontFamily: Font.bold, fontSize: 16, color: t.text },
    cardBody: { fontFamily: Font.regular, fontSize: 14.5, lineHeight: 22, color: t.text },
    cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardMeta: { fontFamily: Font.medium, fontSize: 13, color: t.textMuted },
    cardAudience: { fontFamily: Font.regular, fontSize: 12, color: t.textFaint },

    empty: { padding: 28, borderRadius: Radius.field, backgroundColor: t.surface },
    emptyText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, textAlign: 'center' },
  });
