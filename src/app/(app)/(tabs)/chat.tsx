import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { useChatContacts, useConversations, useStartConversation } from '@/hooks/use-chat';
import { useUserChannel } from '@/hooks/use-realtime';
import { useThemedStyles, useTheme } from '@/hooks/use-theme';

function when(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useConversations();
  const [picking, setPicking] = useState(false);

  // New direct chats someone opens with you show up without a refresh.
  useUserChannel();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerCopy}>
          <Text style={styles.heading}>Chat</Text>
          <Text style={styles.subheading}>Your manager, the D-LIORA team and the community.</Text>
        </View>
        <Pressable
          onPress={() => setPicking(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Start a new chat"
          style={styles.newButton}>
          <Ionicons name="add" size={22} color={Brand.ink} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centred}>
          <ActivityIndicator color={Brand.gold} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(conversation) => String(conversation.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Brand.gold} />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/conversation/[id]',
                  params: { id: item.id, title: item.title },
                })
              }
              style={styles.row}>
              {item.type === 'group' ? (
                <View style={styles.groupAvatar}>
                  <Ionicons name="people" size={20} color={Brand.goldDeep} />
                </View>
              ) : (
                <Avatar uri={item.counterpart?.avatar_url ?? item.avatar_url} name={item.title} size={46} />
              )}

              <View style={styles.rowCopy}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowWhen}>{when(item.last_message_at)}</Text>
                </View>
                <View style={styles.rowBottom}>
                  <Text style={[styles.rowPreview, item.unread_count > 0 && styles.rowPreviewUnread]} numberOfLines={1}>
                    {item.last_message?.body ?? 'No messages yet'}
                  </Text>
                  {item.unread_count > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.unread_count > 9 ? '9+' : item.unread_count}
                      </Text>
                    </View>
                  )}
                </View>
                {item.muted && <Text style={styles.rowNote}>You can read this group but not post.</Text>}
                {item.closed && <Text style={styles.rowNote}>This chat is closed.</Text>}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No chats yet</Text>
              <Text style={styles.emptyText}>
                Start one with your account manager or the D-LIORA team — they&apos;re here to help.
              </Text>
              <Pressable
                onPress={() => setPicking(true)}
                accessibilityRole="button"
                style={styles.emptyAction}>
                <Text style={styles.emptyActionLabel}>Start a chat</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {picking && <ContactPicker onClose={() => setPicking(false)} />}
    </View>
  );
}

function ContactPicker({ onClose }: { onClose: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const contacts = useChatContacts();
  const start = useStartConversation();
  const [error, setError] = useState<string | null>(null);

  const open = async (target: { recipientId: number } | { adminTeam: true }) => {
    setError(null);
    try {
      const conversation = await start.mutateAsync(target);
      onClose();
      router.push({
        pathname: '/conversation/[id]',
        params: { id: conversation.id, title: conversation.title },
      });
    } catch {
      setError('That chat couldn’t be opened. Try again in a moment.');
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>Start a chat</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => open({ adminTeam: true })}
            disabled={start.isPending}
            accessibilityRole="button"
            style={styles.contactRow}>
            <View style={styles.teamAvatar}>
              <Ionicons name="shield-checkmark" size={19} color={Brand.ink} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.contactName}>D-LIORA Admin</Text>
              <Text style={styles.contactMeta}>Questions, payouts, account help</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
          </Pressable>

          {contacts.isLoading ? (
            <ActivityIndicator color={Brand.gold} style={styles.sheetLoading} />
          ) : (
            <FlatList
              data={contacts.data ?? []}
              keyExtractor={(contact) => String(contact.id)}
              style={styles.sheetList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => open({ recipientId: item.id })}
                  disabled={start.isPending}
                  accessibilityRole="button"
                  style={styles.contactRow}>
                  <Avatar uri={item.avatar_url} name={item.name} size={42} />
                  <View style={styles.rowCopy}>
                    <Text style={styles.contactName} numberOfLines={1}>
                      {item.name ?? item.d_liora_id ?? 'Creator'}
                    </Text>
                    <Text style={styles.contactMeta}>
                      {item.is_my_manager ? 'Your account manager' : (item.d_liora_id ?? item.role)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.sheetEmpty}>
                  Nobody else to message yet. The D-LIORA team is always reachable above.
                </Text>
              }
            />
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
    headerCopy: { flex: 1 },
    heading: { fontFamily: Font.bold, fontSize: 27, color: t.text, letterSpacing: -0.5 },
    subheading: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, color: t.textMuted, marginTop: 4 },
    newButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.gold,
    },

    list: { paddingHorizontal: 20, gap: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
    groupAvatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.goldSoft,
    },
    rowCopy: { flex: 1, gap: 3 },
    rowTop: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
    rowTitle: { flex: 1, fontFamily: Font.semibold, fontSize: 15.5, color: t.text },
    rowWhen: { fontFamily: Font.regular, fontSize: 12, color: t.textFaint },
    rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rowPreview: { flex: 1, fontFamily: Font.regular, fontSize: 13.5, color: t.textMuted },
    rowPreviewUnread: { fontFamily: Font.medium, color: t.text },
    rowNote: { fontFamily: Font.regular, fontSize: 12, color: t.textFaint },
    badge: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.gold,
    },
    badgeText: { fontFamily: Font.bold, fontSize: 11, color: Brand.ink },

    empty: { padding: 24, gap: 8, borderRadius: Radius.field, backgroundColor: t.surface, marginTop: 8 },
    emptyTitle: { fontFamily: Font.semibold, fontSize: 16, color: t.text, textAlign: 'center' },
    emptyText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, textAlign: 'center' },
    emptyAction: { alignSelf: 'center', marginTop: 8, paddingVertical: 10, paddingHorizontal: 20, borderRadius: Radius.pill, backgroundColor: Brand.gold },
    emptyActionLabel: { fontFamily: Font.semibold, fontSize: 14.5, color: Brand.ink },

    scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,13,14,0.55)' },
    sheet: {
      maxHeight: '78%',
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 20,
      borderTopLeftRadius: Radius.sheet,
      borderTopRightRadius: Radius.sheet,
      backgroundColor: t.surface,
    },
    sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sheetTitle: { fontFamily: Font.bold, fontSize: 19, color: t.text },
    sheetList: { flexGrow: 0 },
    sheetLoading: { paddingVertical: 24 },
    sheetEmpty: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, paddingVertical: 16 },

    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    teamAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.gold,
    },
    contactName: { fontFamily: Font.semibold, fontSize: 15, color: t.text },
    contactMeta: { fontFamily: Font.regular, fontSize: 12.5, color: t.textMuted, textTransform: 'capitalize' },
    error: { fontFamily: Font.medium, fontSize: 13.5, color: t.danger, paddingTop: 8 },
  });
