import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Font, OnInk, Radius, type ThemeColors } from '@/constants/theme';
import { useRewards } from '@/hooks/use-community';
import { useThemedStyles } from '@/hooks/use-theme';

function awardedOn(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const { data, isLoading, isRefetching, refetch } = useRewards();

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Rewards" />

      {isLoading ? (
        <View style={styles.centred}>
          <ActivityIndicator color={Brand.gold} />
        </View>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(award) => String(award.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Brand.gold} />
          }
          ListHeaderComponent={
            <View style={styles.total}>
              <View>
                <Text style={styles.totalLabel}>Bootcamp Diamonds</Text>
                <Text style={styles.totalValue}>{data?.meta.total_diamonds ?? 0}</Text>
                <Text style={styles.totalSub}>
                  {data?.meta.total ?? 0} reward{(data?.meta.total ?? 0) === 1 ? '' : 's'} earned
                </Text>
              </View>
              <Text style={styles.totalGlyph}>💎</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Text style={styles.cardGlyph}>{item.kind === 'tier' ? '🏆' : '💎'}</Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.reason ?? (item.kind === 'tier' ? 'Level completed' : 'Lesson completed')}
                </Text>
                <Text style={styles.cardMeta}>
                  {item.tier ? `${item.tier.name} · ` : ''}
                  {awardedOn(item.awarded_at)}
                </Text>
              </View>
              <Text style={styles.cardValue}>+{item.diamonds}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No rewards yet</Text>
              <Text style={styles.emptyText}>
                Finish lessons and levels in the Bootcamp to earn Diamonds. They&apos;ll all show up here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { paddingHorizontal: 20, paddingTop: 20, gap: 10 },

    total: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 22,
      marginBottom: 10,
      borderRadius: Radius.sheet,
      backgroundColor: Brand.ink,
    },
    totalLabel: { fontFamily: Font.medium, fontStyle: 'italic', fontSize: 15, color: OnInk.text },
    totalValue: { fontFamily: Font.bold, fontSize: 34, color: Brand.gold, marginTop: 4 },
    totalSub: { fontFamily: Font.regular, fontSize: 13, color: OnInk.muted, marginTop: 2 },
    totalGlyph: { fontSize: 48 },

    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 14,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.goldSoft,
    },
    cardGlyph: { fontSize: 20 },
    cardCopy: { flex: 1, gap: 2 },
    cardTitle: { fontFamily: Font.semibold, fontSize: 15, lineHeight: 20, color: t.text },
    cardMeta: { fontFamily: Font.regular, fontSize: 12.5, color: t.textMuted },
    cardValue: { fontFamily: Font.bold, fontSize: 16, color: t.link },

    empty: { padding: 24, gap: 6, borderRadius: Radius.field, backgroundColor: t.surface },
    emptyTitle: { fontFamily: Font.semibold, fontSize: 16, color: t.text, textAlign: 'center' },
    emptyText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, textAlign: 'center' },
  });
