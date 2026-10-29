import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Font, OnInk, Radius, type ThemeColors } from '@/constants/theme';
import { useLeaderboard } from '@/hooks/use-community';
import { useThemedStyles } from '@/hooks/use-theme';
import type { LeaderboardEntry } from '@/types/api';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const { data, isLoading, isRefetching, refetch } = useLeaderboard();

  const entries = data?.entries ?? [];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Leaderboard" />

      {isLoading ? (
        <View style={styles.centred}>
          <ActivityIndicator color={Brand.gold} />
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(entry) => String(entry.creator?.id ?? entry.rank)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Brand.gold} />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.banner}>
                <Text style={styles.bannerTitle}>
                  Top <Text style={styles.bannerAccent}>Creators</Text>
                </Text>
                <Text style={styles.bannerTitle}>For The Week</Text>
                {!!data?.region && <Text style={styles.bannerRegion}>{data.region.name}</Text>}
              </View>

              {podium.length > 0 && (
                <View style={styles.podium}>
                  {podium.map((entry, i) => (
                    <View key={entry.creator?.id ?? i} style={[styles.podiumSlot, i === 0 && styles.podiumFirst]}>
                      <Text style={styles.podiumMedal}>{MEDALS[i]}</Text>
                      <Avatar
                        uri={entry.creator?.avatar_url}
                        name={entry.creator?.d_liora_id ?? entry.creator?.name}
                        size={i === 0 ? 64 : 52}
                      />
                      <Text style={styles.podiumName} numberOfLines={1}>
                        {entry.creator?.d_liora_id ?? entry.creator?.name ?? '—'}
                      </Text>
                      <Text style={styles.podiumPoints}>{entry.points.toLocaleString()} pts</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => <Row entry={item} styles={styles} />}
          ListEmptyComponent={
            podium.length > 0 ? null : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No board yet</Text>
                <Text style={styles.emptyText}>
                  Your region&apos;s leaderboard hasn&apos;t been published. Keep earning points — it&apos;ll
                  show up here.
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

function Row({ entry, styles }: { entry: LeaderboardEntry; styles: Styles }) {
  const trend =
    entry.trend === 'up'
      ? { icon: 'arrow-up' as const, colour: '#17703C' }
      : entry.trend === 'down'
        ? { icon: 'arrow-down' as const, colour: '#C0392B' }
        : null;

  return (
    <View style={[styles.row, entry.is_you && styles.rowYou]}>
      <Text style={styles.rank}>{entry.rank ?? '—'}</Text>
      <Avatar
        uri={entry.creator?.avatar_url}
        name={entry.creator?.d_liora_id ?? entry.creator?.name}
        size={40}
      />
      <View style={styles.rowCopy}>
        <Text style={styles.rowName} numberOfLines={1}>
          {entry.creator?.d_liora_id ?? entry.creator?.name ?? '—'}
          {entry.is_you ? '  (you)' : ''}
        </Text>
        {!!entry.creator?.bootcamp_level && (
          <Text style={styles.rowLevel}>{entry.creator.bootcamp_level}</Text>
        )}
      </View>
      {trend && <Ionicons name={trend.icon} size={15} color={trend.colour} />}
      <Text style={styles.rowPoints}>{entry.points.toLocaleString()}</Text>
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { paddingHorizontal: 20, paddingTop: 20, gap: 10 },
    listHeader: { gap: 20, marginBottom: 10 },

    banner: { padding: 22, borderRadius: Radius.sheet, backgroundColor: '#17301C' },
    bannerTitle: { fontFamily: Font.bold, fontSize: 24, color: Brand.white, letterSpacing: -0.4 },
    bannerAccent: { fontFamily: Font.bold, fontStyle: 'italic', color: Brand.gold },
    bannerRegion: { fontFamily: Font.regular, fontSize: 14, color: OnInk.muted, marginTop: 8 },

    podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    podiumSlot: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    podiumFirst: { paddingVertical: 24, backgroundColor: Brand.goldSoft },
    podiumMedal: { fontSize: 22 },
    podiumName: { fontFamily: Font.semibold, fontSize: 13, color: t.text, textAlign: 'center' },
    podiumPoints: { fontFamily: Font.regular, fontSize: 12, color: t.textMuted },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    rowYou: { borderWidth: 1.5, borderColor: Brand.gold },
    rank: { width: 22, fontFamily: Font.bold, fontSize: 15, color: t.textMuted, textAlign: 'center' },
    rowCopy: { flex: 1 },
    rowName: { fontFamily: Font.semibold, fontSize: 15, color: t.text },
    rowLevel: { fontFamily: Font.regular, fontSize: 12.5, color: t.textMuted, textTransform: 'capitalize' },
    rowPoints: { fontFamily: Font.bold, fontSize: 15, color: t.text },

    empty: { padding: 24, gap: 6, borderRadius: Radius.field, backgroundColor: t.surface },
    emptyTitle: { fontFamily: Font.semibold, fontSize: 16, color: t.text, textAlign: 'center' },
    emptyText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, textAlign: 'center' },
  });
