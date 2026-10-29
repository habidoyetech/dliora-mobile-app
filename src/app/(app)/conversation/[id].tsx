import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView, KeyboardGestureArea } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import { Avatar } from '@/components/ui/avatar';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import {
  CHAT_MAX_BYTES,
  CHAT_MAX_FILES,
  useChatUpload,
  useMessages,
  useSendMessage,
  type PendingAttachment,
} from '@/hooks/use-chat';
import { useConversationChannel } from '@/hooks/use-realtime';
import { useThemedStyles, useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import type { ChatMessage } from '@/types/api';

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function ConversationScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const conversationId = Number(id);
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();

  const live = useConversationChannel(conversationId);
  const { data, isLoading } = useMessages(conversationId, live);
  const send = useSendMessage(conversationId);
  const upload = useChatUpload();

  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const closed = data?.meta.closed ?? false;
  const readUpTo = data?.meta.receipts?.read_up_to ?? null;
  const deliveredUpTo = data?.meta.receipts?.delivered_up_to ?? null;

  const attach = async () => {
    const room = CHAT_MAX_FILES - pending.length;
    if (room <= 0) {
      setError(`You can send up to ${CHAT_MAX_FILES} files at a time.`);
      return;
    }

    const picked = await File.pickFileAsync({ multipleFiles: true });
    if (picked.canceled) return;

    setError(null);
    for (const file of picked.result.slice(0, room)) {
      if (file.size > CHAT_MAX_BYTES) {
        setError(`“${file.name}” is over 20MB.`);
        continue;
      }
      try {
        const stored = await upload.mutateAsync({
          uri: file.uri,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
        });
        setPending((current) => [...current, stored]);
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : 'That file didn’t upload. Try again.');
        break;
      }
    }
  };

  const submit = async () => {
    const body = draft.trim();
    // The API takes a body or files — but not an empty message.
    if ((!body && pending.length === 0) || send.isPending) return;

    const sending = pending;
    setDraft('');
    setPending([]);
    setError(null);
    try {
      await send.mutateAsync({ body, uploaded: sending });
    } catch (cause) {
      setDraft(body);
      setPending(sending);
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'That message didn’t send. Check your connection and try again.',
      );
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={title ?? 'Chat'} />

      <KeyboardGestureArea interpolator="ios" style={styles.flex}>
        <KeyboardAvoidingView behavior="padding" style={styles.flex} keyboardVerticalOffset={0}>
          {isLoading ? (
            <View style={styles.centred}>
              <ActivityIndicator color={Brand.gold} />
            </View>
          ) : (
            <FlatList
              data={[...(data?.data ?? [])].reverse()}
              inverted
              keyExtractor={(message) => String(message.id)}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Bubble
                  message={item}
                  readUpTo={readUpTo}
                  deliveredUpTo={deliveredUpTo}
                  styles={styles}
                  theme={theme}
                />
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    No messages yet. Say hello — this is a good place to ask anything.
                  </Text>
                </View>
              }
            />
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          {closed ? (
            <View style={[styles.closed, { paddingBottom: insets.bottom + 14 }]}>
              <Text style={styles.closedText}>This chat is closed. You can still read it.</Text>
            </View>
          ) : (
            <View style={[styles.composerWrap, { paddingBottom: insets.bottom + 10 }]}>
              {pending.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tray}>
                  {pending.map((file) => (
                    <View key={file.path} style={styles.trayChip}>
                      <Ionicons name="document-outline" size={14} color={theme.textMuted} />
                      <Text style={styles.trayName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Pressable
                        onPress={() => setPending((current) => current.filter((f) => f.path !== file.path))}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${file.name}`}>
                        <Ionicons name="close" size={15} color={theme.textMuted} />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={styles.composer}>
              <Pressable
                onPress={attach}
                disabled={upload.isPending || send.isPending}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Attach a file"
                style={styles.attach}>
                {upload.isPending ? (
                  <ActivityIndicator color={theme.textMuted} size="small" />
                ) : (
                  <Ionicons name="add" size={23} color={theme.textMuted} />
                )}
              </Pressable>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder="Write a message…"
                placeholderTextColor={theme.textFaint}
                selectionColor={Brand.gold}
                multiline
                maxLength={5000}
                editable={!send.isPending}
                accessibilityLabel="Message"
              />
              <Pressable
                onPress={submit}
                disabled={(!draft.trim() && pending.length === 0) || send.isPending}
                accessibilityRole="button"
                accessibilityLabel="Send"
                style={[
                  styles.send,
                  (!draft.trim() && pending.length === 0) || send.isPending ? styles.sendOff : null,
                ]}>
                {send.isPending ? (
                  <ActivityIndicator color={Brand.ink} size="small" />
                ) : (
                  <Ionicons name="arrow-up" size={20} color={Brand.ink} />
                )}
              </Pressable>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </KeyboardGestureArea>
    </View>
  );
}

function Bubble({
  message,
  readUpTo,
  deliveredUpTo,
  styles,
  theme,
}: {
  message: ChatMessage;
  readUpTo: number | null;
  deliveredUpTo: number | null;
  styles: Styles;
  theme: ThemeColors;
}) {
  const mine = message.is_mine;
  const read = mine && readUpTo !== null && message.id <= readUpTo;
  const delivered = mine && deliveredUpTo !== null && message.id <= deliveredUpTo;

  if (message.deleted) {
    return (
      <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View style={[styles.bubble, styles.bubbleDeleted]}>
          <Text style={styles.deletedText}>This message was deleted</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      {!mine && (
        <Avatar uri={message.author?.avatar_url} name={message.author?.name} size={30} />
      )}
      <View style={styles.bubbleCol}>
        {!mine && !!message.author?.name && (
          <Text style={styles.author}>{message.author.name}</Text>
        )}
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          {!!message.body && (
            <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{message.body}</Text>
          )}

          {message.attachments.map((attachment) =>
            attachment.kind === 'image' && attachment.url ? (
              <Pressable
                key={attachment.id}
                onPress={() => attachment.url && Linking.openURL(attachment.url)}
                accessibilityRole="imagebutton"
                accessibilityLabel={attachment.name}>
                <Image source={{ uri: attachment.url }} style={styles.attachmentImage} contentFit="cover" />
              </Pressable>
            ) : (
              <Pressable
                key={attachment.id}
                onPress={() => {
                  const link = attachment.download_url ?? attachment.url;
                  if (link) Linking.openURL(link);
                }}
                accessibilityRole="button"
                style={[styles.attachment, mine ? styles.attachmentMine : styles.attachmentTheirs]}>
                <Ionicons
                  name={attachment.kind === 'video' ? 'videocam-outline' : 'document-outline'}
                  size={15}
                  color={mine ? Brand.ink : theme.textMuted}
                />
                <Text style={[styles.attachmentName, mine && styles.bubbleTextMine]} numberOfLines={1}>
                  {attachment.name}
                </Text>
              </Pressable>
            ),
          )}
        </View>

        <View style={[styles.meta, mine && styles.metaMine]}>
          <Text style={styles.metaText}>{clockTime(message.created_at)}</Text>
          {!!message.edited_at && (
            <Text style={styles.metaText}>{message.edited_by_team ? 'edited by team' : 'edited'}</Text>
          )}
          {mine && (
            <Ionicons
              name={read ? 'checkmark-done' : delivered ? 'checkmark-done-outline' : 'checkmark'}
              size={14}
              color={read ? theme.link : theme.textFaint}
            />
          )}
        </View>
      </View>
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    flex: { flex: 1 },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },

    bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '100%' },
    bubbleRowMine: { justifyContent: 'flex-end' },
    bubbleRowTheirs: { justifyContent: 'flex-start' },
    bubbleCol: { maxWidth: '82%', gap: 3 },
    author: { fontFamily: Font.semibold, fontSize: 12, color: t.textMuted, paddingLeft: 4 },
    bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 6 },
    bubbleMine: { backgroundColor: Brand.gold, borderBottomRightRadius: 6 },
    bubbleTheirs: { backgroundColor: t.surface, borderBottomLeftRadius: 6 },
    bubbleDeleted: { backgroundColor: t.surfaceRaised },
    bubbleText: { fontFamily: Font.regular, fontSize: 15, lineHeight: 22, color: t.text },
    bubbleTextMine: { color: Brand.ink },
    deletedText: { fontFamily: Font.regular, fontStyle: 'italic', fontSize: 14, color: t.textFaint },

    attachment: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
    },
    attachmentMine: { backgroundColor: 'rgba(12,13,14,0.10)' },
    attachmentTheirs: { backgroundColor: t.surfaceRaised },
    attachmentName: { flex: 1, fontFamily: Font.medium, fontSize: 13, color: t.textMuted },
    attachmentImage: { width: 196, height: 148, borderRadius: 12, backgroundColor: t.surfaceRaised },

    meta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4 },
    metaMine: { justifyContent: 'flex-end', paddingRight: 4 },
    metaText: { fontFamily: Font.regular, fontSize: 11, color: t.textFaint },

    empty: { padding: 24, borderRadius: Radius.field, backgroundColor: t.surface },
    emptyText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, textAlign: 'center' },
    error: { fontFamily: Font.medium, fontSize: 13, color: t.danger, paddingHorizontal: 20, paddingBottom: 6 },

    composerWrap: {
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
      backgroundColor: t.background,
    },
    composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16 },
    attach: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surface,
    },
    tray: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
    trayChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      maxWidth: 190,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: Radius.pill,
      backgroundColor: t.surfaceRaised,
    },
    trayName: { flex: 1, fontFamily: Font.medium, fontSize: 13, color: t.text },
    input: {
      flex: 1,
      maxHeight: 120,
      minHeight: 44,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      borderRadius: Radius.pill,
      fontFamily: Font.regular,
      fontSize: 15,
      color: t.text,
      backgroundColor: t.surface,
    },
    send: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.gold,
    },
    sendOff: { opacity: 0.45 },

    closed: {
      paddingHorizontal: 20,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
    },
    closedText: { fontFamily: Font.regular, fontSize: 13.5, color: t.textMuted, textAlign: 'center' },
  });
