import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusPill } from '@/components/ui/status-pill';
import { TextField } from '@/components/ui/text-field';
import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { usePostUpdate, useUpdates } from '@/hooks/use-community';
import { useThemedStyles } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';

const MAX_BODY = 1000;

function postedAt(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function UpdatesScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const { compose } = useLocalSearchParams<{ compose?: string }>();
  const { data, isLoading, isRefetching, refetch } = useUpdates();

  const [composing, setComposing] = useState(compose === '1');

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Updates" action={{ label: 'Post', onPress: () => setComposing(true) }} />

      {isLoading ? (
        <View style={styles.centred}>
          <ActivityIndicator color={Brand.gold} />
        </View>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(update) => String(update.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Brand.gold} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Avatar name={item.author?.d_liora_id ?? item.author?.name} size={38} />
                <View style={styles.cardWho}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.is_mine ? 'You' : (item.author?.d_liora_id ?? item.author?.name ?? 'A creator')}
                  </Text>
                  <Text style={styles.cardWhen}>{postedAt(item.published_at ?? item.created_at)}</Text>
                </View>
                {item.is_mine && item.status === 'pending' && <StatusPill tone="pending" label="In review" />}
              </View>
              <Text style={styles.cardBody}>{item.body}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyText}>
                Share a win, a question or something you learned. Posts are reviewed before everyone sees them.
              </Text>
              <View style={styles.emptyAction}>
                <PrimaryButton label="Post an update" onPress={() => setComposing(true)} />
              </View>
            </View>
          }
        />
      )}

      {composing && <ComposeSheet onClose={() => setComposing(false)} />}
    </View>
  );
}

function ComposeSheet({ onClose }: { onClose: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const post = usePostUpdate();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed) {
      setError('Write something first.');
      return;
    }
    setError(null);
    try {
      await post.mutateAsync(trimmed);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? (cause.errors.body?.[0] ?? cause.message)
          : 'Your update didn’t go through. Check your connection and try again.',
      );
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <KeyboardAvoidingView behavior="padding" style={styles.sheetWrap}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Post an update</Text>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={Brand.inkLine} />
              </Pressable>
            </View>

            <TextField
              label="What would you like to share?"
              multiline
              value={body}
              onChangeText={setBody}
              maxLength={MAX_BODY}
              error={error}
              placeholder="A win, a question, something you learned…"
              editable={!post.isPending}
            />
            <Text style={styles.counter}>
              {body.length}/{MAX_BODY}
            </Text>
            <Text style={styles.sheetNote}>An admin reviews posts before everyone sees them.</Text>

            <PrimaryButton label="Post update" onPress={submit} loading={post.isPending} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },

    card: { padding: 16, gap: 12, borderRadius: Radius.field, backgroundColor: t.surface },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardWho: { flex: 1 },
    cardName: { fontFamily: Font.semibold, fontSize: 15, color: t.text },
    cardWhen: { fontFamily: Font.regular, fontSize: 12.5, color: t.textMuted },
    cardBody: { fontFamily: Font.regular, fontSize: 15, lineHeight: 23, color: t.text },

    empty: { padding: 24, gap: 8, borderRadius: Radius.field, backgroundColor: t.surface },
    emptyTitle: { fontFamily: Font.semibold, fontSize: 16, color: t.text, textAlign: 'center' },
    emptyText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, textAlign: 'center' },
    emptyAction: { marginTop: 10 },

    scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,13,14,0.55)' },
    sheetWrap: { width: '100%' },
    sheet: {
      gap: 14,
      paddingHorizontal: 20,
      paddingTop: 20,
      borderTopLeftRadius: Radius.sheet,
      borderTopRightRadius: Radius.sheet,
      backgroundColor: t.surface,
    },
    sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sheetTitle: { fontFamily: Font.bold, fontSize: 19, color: t.text },
    counter: { fontFamily: Font.regular, fontSize: 12, color: t.textFaint, textAlign: 'right', marginTop: -8 },
    sheetNote: { fontFamily: Font.regular, fontSize: 13, lineHeight: 19, color: t.textMuted },
  });
