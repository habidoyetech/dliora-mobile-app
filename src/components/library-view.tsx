import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { useLibrary, useLibraryCategories, useTrending, type LibraryFilter } from '@/hooks/use-library';
import { useThemedStyles, useTheme } from '@/hooks/use-theme';
import type { LibraryResource, ResourceType } from '@/types/api';

const TYPES: { value: ResourceType | null; label: string }[] = [
  { value: null, label: 'Everything' },
  { value: 'video', label: 'Videos' },
  { value: 'document', label: 'Documents' },
  { value: 'text', label: 'Articles' },
];

/** "4 min", from the seconds the API reports. */
function runtime(seconds: number | null): string | null {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  return minutes < 1 ? '< 1 min' : `${minutes} min`;
}

/** "3.2k views" — the same shorthand the design uses. */
function views(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k views`;
  return `${count} view${count === 1 ? '' : 's'}`;
}

export function LibraryView({ bottomInset }: { bottomInset: number }) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>({ sort: 'newest' });
  const [sheet, setSheet] = useState<'sort' | 'filter' | null>(null);

  const library = useLibrary({ ...filter, q: search });
  const trending = useTrending();
  const categories = useLibraryCategories();

  const filtered = !!filter.category || !!filter.type;
  const total = library.data?.meta.total ?? 0;

  const open = (resource: LibraryResource) =>
    router.push({ pathname: '/library/[id]', params: { id: resource.id } });

  return (
    <>
      <FlatList
        data={library.data?.data ?? []}
        keyExtractor={(resource) => String(resource.id)}
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 28 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={library.isRefetching}
            onRefresh={() => {
              library.refetch();
              trending.refetch();
            }}
            tintColor={Brand.gold}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.searchRow}>
              <View style={styles.search}>
                <Ionicons name="search" size={18} color={theme.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search for videos"
                  placeholderTextColor={theme.textFaint}
                  selectionColor={Brand.gold}
                  returnKeyType="search"
                  autoCorrect={false}
                  accessibilityLabel="Search the library"
                />
                {!!search && (
                  <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={17} color={theme.textFaint} />
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => setSheet('sort')}
                accessibilityRole="button"
                accessibilityLabel="Sort"
                style={styles.iconButton}>
                <Ionicons name="swap-vertical" size={19} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() => setSheet('filter')}
                accessibilityRole="button"
                accessibilityLabel="Filter"
                style={[styles.iconButton, filtered && styles.iconButtonOn]}>
                <Ionicons name="filter" size={19} color={filtered ? Brand.ink : theme.text} />
              </Pressable>
            </View>

            {!!trending.data && !search && !filtered && (
              <Pressable style={styles.hero} accessibilityRole="button" onPress={() => open(trending.data!)}>
                {trending.data.thumbnail_url ? (
                  <Image source={{ uri: trending.data.thumbnail_url }} style={styles.heroImage} contentFit="cover" />
                ) : (
                  <View style={[styles.heroImage, styles.heroEmpty]} />
                )}
                <View style={styles.heroVeil} />
                <View style={styles.trendingTag}>
                  <Text style={styles.trendingText}>Trending</Text>
                </View>
                <View style={styles.heroPlay}>
                  <Ionicons name="play" size={24} color={Brand.ink} />
                </View>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {trending.data.title}
                  </Text>
                  <Text style={styles.heroMeta}>
                    {[runtime(trending.data.duration_seconds), views(trending.data.views_count)]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
              </Pressable>
            )}

            <View style={styles.listHead}>
              <Text style={styles.listTitle}>
                {filter.type ? (TYPES.find((t) => t.value === filter.type)?.label ?? 'Results') : 'Videos'}
              </Text>
              <Text style={styles.listCount}>
                {total} {total === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} accessibilityRole="button" onPress={() => open(item)}>
            <View style={styles.thumbWrap}>
              {item.thumbnail_url ? (
                <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]}>
                  <Ionicons
                    name={item.type === 'document' ? 'document-text' : item.type === 'text' ? 'book' : 'videocam'}
                    size={20}
                    color={theme.textFaint}
                  />
                </View>
              )}
              {item.type === 'video' && (
                <View style={styles.thumbPlay}>
                  <Ionicons name="play" size={13} color={Brand.ink} />
                </View>
              )}
              {!!item.progress?.percent && !item.progress.completed && (
                <View style={styles.thumbProgress}>
                  <View style={[styles.thumbProgressFill, { width: `${item.progress.percent}%` }]} />
                </View>
              )}
            </View>

            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.cardMeta}>
                {[runtime(item.duration_seconds) ?? item.format, views(item.views_count)]
                  .filter(Boolean)
                  .join('  •  ')}
              </Text>
              {item.progress?.completed && (
                <View style={styles.watched}>
                  <Ionicons name="checkmark-circle" size={13} color={theme.success} />
                  <Text style={styles.watchedText}>Watched</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          library.isLoading ? (
            <ActivityIndicator color={Brand.gold} style={styles.loading} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing found</Text>
              <Text style={styles.emptyText}>
                {search || filtered
                  ? 'Try a different search, or clear the filters.'
                  : 'The Training Library is still being filled. Check back soon.'}
              </Text>
            </View>
          )
        }
      />

      {sheet === 'sort' && (
        <OptionSheet
          title="Sort by"
          options={[
            { value: 'newest', label: 'Newest first' },
            { value: 'popular', label: 'Most watched' },
          ]}
          value={filter.sort ?? 'newest'}
          onPick={(value) => {
            setFilter((current) => ({ ...current, sort: value as 'newest' | 'popular' }));
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet === 'filter' && (
        <OptionSheet
          title="Show"
          options={[
            ...TYPES.map((type) => ({ value: `type:${type.value ?? ''}`, label: type.label })),
            ...(categories.data?.categories ?? []).map((category) => ({
              value: `category:${category.id}`,
              label: `${category.title} (${category.count})`,
            })),
          ]}
          value={filter.category ? `category:${filter.category}` : `type:${filter.type ?? ''}`}
          onPick={(value) => {
            const [kind, raw] = value.split(':');
            setFilter((current) =>
              kind === 'category'
                ? { ...current, category: Number(raw), type: null }
                : { ...current, type: (raw || null) as ResourceType | null, category: null },
            );
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}

function OptionSheet({
  title,
  options,
  value,
  onPick,
  onClose,
}: {
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onPick: (value: string) => void;
  onClose: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </Pressable>
          </View>

          <FlatList
            data={options}
            keyExtractor={(option) => option.value}
            style={styles.sheetList}
            renderItem={({ item }) => {
              const picked = item.value === value;
              return (
                <Pressable
                  onPress={() => onPick(item.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: picked }}
                  style={styles.sheetRow}>
                  <Text style={[styles.sheetLabel, picked && styles.sheetLabelPicked]}>{item.label}</Text>
                  {picked && <Ionicons name="checkmark" size={19} color={Brand.goldDeep} />}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    list: { paddingHorizontal: 20, paddingTop: 18, gap: 12 },
    header: { gap: 18, marginBottom: 6 },
    loading: { paddingVertical: 32 },

    searchRow: { flexDirection: 'row', gap: 10 },
    search: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 52,
      paddingHorizontal: 16,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    searchInput: { flex: 1, fontFamily: Font.regular, fontSize: 15, color: t.text },
    iconButton: {
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    iconButtonOn: { backgroundColor: Brand.gold },

    hero: { height: 196, borderRadius: Radius.field, overflow: 'hidden', backgroundColor: Brand.inkRaised },
    heroImage: { width: '100%', height: '100%' },
    heroEmpty: { backgroundColor: t.surfaceRaised },
    heroVeil: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(12,13,14,0.28)' },
    trendingTag: {
      position: 'absolute',
      top: 14,
      left: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.pill,
      backgroundColor: '#22C55E',
    },
    trendingText: { fontFamily: Font.semibold, fontSize: 12.5, color: Brand.white },
    heroPlay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 56,
      height: 56,
      marginTop: -28,
      marginLeft: -28,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.white,
    },
    heroCopy: { position: 'absolute', left: 16, right: 16, bottom: 14, gap: 3 },
    heroTitle: { fontFamily: Font.bold, fontSize: 19, color: Brand.white, letterSpacing: -0.3 },
    heroMeta: { fontFamily: Font.regular, fontSize: 13, color: 'rgba(255,255,255,0.82)' },

    listHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    listTitle: { fontFamily: Font.bold, fontSize: 19, color: t.text, letterSpacing: -0.3 },
    listCount: { fontFamily: Font.regular, fontSize: 14, color: t.textMuted },

    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 10,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    thumbWrap: { width: 96, height: 68 },
    thumb: { width: 96, height: 68, borderRadius: 10 },
    thumbEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: t.surfaceRaised },
    thumbPlay: {
      position: 'absolute',
      top: 22,
      left: 36,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.white,
    },
    thumbProgress: {
      position: 'absolute',
      left: 6,
      right: 6,
      bottom: 6,
      height: 3,
      borderRadius: 2,
      overflow: 'hidden',
      backgroundColor: 'rgba(255,255,255,0.4)',
    },
    thumbProgressFill: { height: '100%', backgroundColor: Brand.gold },

    cardCopy: { flex: 1, gap: 4 },
    cardTitle: { fontFamily: Font.semibold, fontSize: 15.5, lineHeight: 21, color: t.text },
    cardMeta: { fontFamily: Font.regular, fontSize: 13, color: t.textMuted },
    watched: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    watchedText: { fontFamily: Font.medium, fontSize: 12, color: t.success },

    empty: { padding: 26, gap: 6, borderRadius: Radius.field, backgroundColor: t.surface },
    emptyTitle: { fontFamily: Font.semibold, fontSize: 16, color: t.text, textAlign: 'center' },
    emptyText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, textAlign: 'center' },

    scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,13,14,0.55)' },
    sheet: {
      maxHeight: '70%',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 28,
      borderTopLeftRadius: Radius.sheet,
      borderTopRightRadius: Radius.sheet,
      backgroundColor: t.surface,
    },
    sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    sheetTitle: { fontFamily: Font.bold, fontSize: 19, color: t.text },
    sheetList: { flexGrow: 0 },
    sheetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    sheetLabel: { flex: 1, fontFamily: Font.regular, fontSize: 15.5, color: t.text },
    sheetLabelPicked: { fontFamily: Font.semibold, color: Brand.goldDeep },
  });
