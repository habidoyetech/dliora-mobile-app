import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { Avatar } from '@/components/ui/avatar';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Brand, Font, OnInk, Radius, type ThemeColors } from '@/constants/theme';
import { useDashboard } from '@/hooks/use-dashboard';
import { useThemedStyles } from '@/hooks/use-theme';
import type { LevelSlug } from '@/types/api';

const LEVELS: { slug: LevelSlug; label: string; medal: string }[] = [
  { slug: 'bronze', label: 'Bronze', medal: '🥉' },
  { slug: 'silver', label: 'Silver', medal: '🥈' },
  { slug: 'gold', label: 'Gold', medal: '🥇' },
  { slug: 'platinum', label: 'Platinum', medal: '💎' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const theme = useThemedStyles((t) => t);
  const router = useRouter();
  const { user } = useSession();
  const { data, isLoading, isRefetching, refetch, isError } = useDashboard();

  const levelIndex = Math.max(
    0,
    LEVELS.findIndex((level) => level.slug === data?.current_level),
  );
  const displayName = data?.creator.greeting_name ?? user?.greeting_name ?? 'creator';
  const unread = data?.notifications.unread ?? 0;
  const lesson = data?.continue_lesson;

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centred]}>
        <StatusBar style="light" />
        <ActivityIndicator color={Brand.gold} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Brand.gold} />
        }>
        {/* ── ink hero ─────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.heroTop}>
            <Avatar uri={user?.avatar_url} name={displayName} size={46} onInk />
            <View style={styles.greetingBlock}>
              <Text style={styles.greetingSmall}>Good day,</Text>
              <Text style={styles.greetingName} numberOfLines={1}>
                {displayName}! 👋
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/for-you')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Notifications, ${unread} unread`}
              style={styles.bell}>
              <Ionicons name="notifications-outline" size={22} color={OnInk.text} />
              {unread > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.levelRow}>
            <Text style={styles.levelName}>{LEVELS[levelIndex]?.label ?? 'Bootcamp'}</Text>
            {!!data?.current_level_title && (
              <View style={styles.levelTag}>
                <Text style={styles.levelTagText} numberOfLines={1}>
                  {data.current_level_title}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressPct}>{Math.round(data?.overall_progress ?? 0)}% complete</Text>
            <Text style={styles.progressCount}>
              {data?.lessons_completed ?? 0} of {data?.lessons_total ?? 0} lessons
            </Text>
          </View>
          <ProgressBar value={data?.overall_progress ?? 0} onInk />

          <View style={styles.medals}>
            {LEVELS.map((level, i) => {
              const reached = i <= levelIndex;
              return (
                <View key={level.slug} style={styles.medal}>
                  <View style={[styles.medalDisc, reached ? styles.medalDiscOn : styles.medalDiscOff]}>
                    <Text style={[styles.medalGlyph, !reached && styles.medalGlyphOff]}>{level.medal}</Text>
                  </View>
                  <Text style={[styles.medalLabel, i === levelIndex && styles.medalLabelCurrent]}>
                    {level.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── light body ───────────────────────────────────────── */}
        <View style={[styles.body, { paddingBottom: insets.bottom + 28 }]}>
          {isError && (
            <Pressable onPress={() => refetch()} style={styles.notice} accessibilityRole="button">
              <Text style={styles.noticeText}>Couldn&apos;t load your dashboard. Tap to retry.</Text>
            </Pressable>
          )}

          {!!data?.restriction && (
            <View style={styles.notice} accessibilityRole="alert">
              <Text style={styles.noticeTitle}>Your account is restricted</Text>
              <Text style={styles.noticeText}>
                {data.restriction.reason ??
                  'Training and chat with your manager are closed for now. Reach out to D-LIORA support.'}
              </Text>
            </View>
          )}

          {!!lesson && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Continue learning</Text>
              <Pressable
                style={styles.lessonCard}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}>
                <View style={styles.lessonThumbWrap}>
                  {lesson.thumbnail_url ? (
                    <Image source={{ uri: lesson.thumbnail_url }} style={styles.lessonThumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.lessonThumb, styles.lessonThumbEmpty]} />
                  )}
                  <View style={styles.playBadge}>
                    <Ionicons name="play" size={13} color={Brand.ink} />
                  </View>
                </View>
                <View style={styles.lessonMeta}>
                  <Text style={styles.lessonEyebrow}>
                    LESSON {lesson.number ?? lesson.position ?? 1} OF {lesson.of_total ?? data?.lessons_total ?? 0}
                  </Text>
                  <Text style={styles.lessonTitle} numberOfLines={2}>
                    {lesson.title}
                  </Text>
                  <View style={styles.continueRow}>
                    <Text style={styles.continueText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={15} color={theme.link} />
                  </View>
                </View>
              </Pressable>
            </View>
          )}

          <View style={styles.tiles}>
            <View style={styles.tile}>
              <View style={[styles.tileIcon, styles.tileIconGreen]}>
                <Ionicons name="play" size={17} color="#17703C" />
              </View>
              <Text style={styles.tileValue}>
                {data?.lessons_completed ?? 0}/{data?.lessons_total ?? 0}
              </Text>
              <Text style={styles.tileLabel}>Lessons done</Text>
            </View>
            <View style={styles.tile}>
              <View style={[styles.tileIcon, styles.tileIconBlue]}>
                <Ionicons name="clipboard-outline" size={17} color="#1D4F91" />
              </View>
              <Text style={styles.tileValue}>{data?.assignments_pending_review ?? 0}</Text>
              <Text style={styles.tileLabel}>Under review</Text>
            </View>
          </View>

          <View style={styles.leaderCard}>
            <View style={styles.leaderCopy}>
              <Text style={styles.leaderTitle}>
                Top <Text style={styles.leaderTitleAccent}>Creators</Text>
              </Text>
              <Text style={styles.leaderTitle}>For The Week</Text>
              <View style={styles.leaderAction}>
                <PrimaryButton label="View Leaderboard" onPress={() => router.push('/leaderboard')} />
              </View>
            </View>
            <Text style={styles.leaderBadge}>🏅</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Your progress</Text>
              <Pressable onPress={() => router.push('/bootcamp')} hitSlop={8} accessibilityRole="button">
                <Text style={styles.cardLink}>View</Text>
              </Pressable>
            </View>
            <View style={styles.progressSplit}>
              <View style={styles.dial}>
                <Text style={styles.dialValue}>{Math.round(data?.overall_progress ?? 0)}%</Text>
                <Text style={styles.dialLabel}>Overall{'\n'}progress</Text>
              </View>
              <View style={styles.progressStats}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Current level</Text>
                  <Text style={styles.statValue}>
                    {levelIndex + 1}/4 · {LEVELS[levelIndex]?.label}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Assignments</Text>
                  <Text style={styles.statValue}>
                    {data?.assignments_completed ?? 0}/{data?.assignments_total ?? 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable style={styles.rewardCard} accessibilityRole="button" onPress={() => router.push('/rewards')}>
            <View>
              <Text style={styles.rewardLabel}>Rewards Earned</Text>
              <Text style={styles.rewardValue}>{data?.rewards.count ?? 0}</Text>
              <Text style={styles.rewardSub}>{data?.rewards.diamonds ?? 0} Bootcamp Diamonds</Text>
            </View>
            <Text style={styles.rewardTrophy}>🏆</Text>
          </Pressable>

          {!!data?.manager && (
            <View style={styles.managerCard}>
              <Avatar uri={data.manager.avatar_url} name={data.manager.display_name} size={44} />
              <View style={styles.managerCopy}>
                <Text style={styles.managerName}>{data.manager.display_name ?? 'Your account manager'}</Text>
                <Text style={styles.managerSub}>is here for you — send a message any time.</Text>
              </View>
              <Pressable onPress={() => router.push('/chat')} hitSlop={8} accessibilityRole="button">
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.link} />
              </Pressable>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Updates</Text>
              <Pressable onPress={() => router.push('/updates')} hitSlop={8} accessibilityRole="button">
                <Text style={styles.cardLink}>View all</Text>
              </Pressable>
            </View>

            {(data?.updates ?? []).length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No updates from the community yet.</Text>
              </View>
            ) : (
              (data?.updates ?? []).slice(0, 3).map((update) => (
                <View key={update.id} style={styles.updateCard}>
                  <Avatar name={update.author?.d_liora_id ?? update.author?.name} size={38} />
                  <View style={styles.updateBody}>
                    <Text style={styles.updateAuthor}>
                      {update.author?.d_liora_id ?? update.author?.name ?? 'A creator'}
                    </Text>
                    <Text style={styles.updateText} numberOfLines={3}>
                      {update.body}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: Brand.ink },
    centred: { alignItems: 'center', justifyContent: 'center' },
    scroll: { flexGrow: 1 },

    hero: { paddingHorizontal: 20, paddingBottom: 24, gap: 14, backgroundColor: Brand.ink },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    greetingBlock: { flex: 1 },
    greetingSmall: { fontFamily: Font.regular, fontSize: 14, color: OnInk.muted },
    greetingName: { fontFamily: Font.bold, fontSize: 20, color: OnInk.text },
    bell: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.inkRaised,
    },
    bellBadge: {
      position: 'absolute',
      top: 3,
      right: 3,
      minWidth: 19,
      height: 19,
      paddingHorizontal: 5,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#E8402A',
    },
    bellBadgeText: { fontFamily: Font.bold, fontSize: 11, color: Brand.white },

    levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
    levelName: { fontFamily: Font.bold, fontSize: 30, color: OnInk.text, letterSpacing: -0.6 },
    levelTag: {
      flexShrink: 1,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: Radius.pill,
      backgroundColor: Brand.inkRaised,
    },
    levelTagText: { fontFamily: Font.medium, fontSize: 13, color: OnInk.text },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    progressPct: { fontFamily: Font.semibold, fontSize: 14, color: Brand.gold },
    progressCount: { fontFamily: Font.regular, fontSize: 13, color: OnInk.muted },

    medals: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    medal: { alignItems: 'center', gap: 8, width: 72 },
    medalDisc: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    medalDiscOn: { backgroundColor: 'rgba(221,166,60,0.18)' },
    medalDiscOff: { backgroundColor: Brand.inkRaised },
    medalGlyph: { fontSize: 24 },
    medalGlyphOff: { opacity: 0.4 },
    medalLabel: { fontFamily: Font.regular, fontSize: 12.5, color: OnInk.muted },
    medalLabelCurrent: { fontFamily: Font.bold, color: OnInk.text },

    body: { flex: 1, paddingHorizontal: 20, paddingTop: 24, gap: 20, backgroundColor: t.background },
    section: { gap: 12 },
    sectionTitle: { fontFamily: Font.bold, fontSize: 19, color: t.text, letterSpacing: -0.3 },
    card: { padding: 18, gap: 18, borderRadius: Radius.field, backgroundColor: t.surface },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { fontFamily: Font.semibold, fontSize: 16, color: t.text },
    cardLink: { fontFamily: Font.semibold, fontSize: 14, color: t.link },

    notice: { padding: 14, gap: 4, borderRadius: Radius.field, backgroundColor: t.dangerSurface },
    noticeTitle: { fontFamily: Font.semibold, fontSize: 14, color: t.danger },
    noticeText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, color: t.danger },
    empty: { padding: 18, borderRadius: Radius.field, backgroundColor: t.surface },
    emptyText: { fontFamily: Font.regular, fontSize: 14, color: t.textMuted, textAlign: 'center' },

    lessonCard: {
      flexDirection: 'row',
      gap: 14,
      padding: 12,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    lessonThumbWrap: { width: 86, height: 86 },
    lessonThumb: { width: 86, height: 86, borderRadius: 10 },
    lessonThumbEmpty: { backgroundColor: t.surfaceRaised },
    playBadge: {
      position: 'absolute',
      top: 31,
      left: 31,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.white,
    },
    lessonMeta: { flex: 1, justifyContent: 'center', gap: 5 },
    lessonEyebrow: { fontFamily: Font.semibold, fontSize: 11.5, letterSpacing: 0.6, color: t.textMuted },
    lessonTitle: { fontFamily: Font.bold, fontSize: 16, lineHeight: 21, color: t.text },
    continueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    continueText: { fontFamily: Font.semibold, fontSize: 14, color: t.link },

    tiles: { flexDirection: 'row', gap: 14 },
    tile: { flex: 1, gap: 4, padding: 16, borderRadius: Radius.field, backgroundColor: t.surface },
    tileIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    tileIconGreen: { backgroundColor: '#DCF3E3' },
    tileIconBlue: { backgroundColor: '#DCE8FB' },
    tileValue: { fontFamily: Font.bold, fontSize: 22, color: t.text },
    tileLabel: { fontFamily: Font.regular, fontSize: 14, color: t.textMuted },

    leaderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 22,
      borderRadius: Radius.sheet,
      backgroundColor: '#17301C',
    },
    leaderCopy: { flex: 1, gap: 2 },
    leaderTitle: { fontFamily: Font.bold, fontSize: 24, color: Brand.white, letterSpacing: -0.4 },
    leaderTitleAccent: { fontFamily: Font.bold, fontStyle: 'italic', color: Brand.gold },
    leaderAction: { marginTop: 18, alignSelf: 'stretch' },
    leaderBadge: { fontSize: 44 },

    progressSplit: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    dial: {
      width: 122,
      height: 122,
      borderRadius: 61,
      borderWidth: 12,
      borderColor: Brand.gold,
      borderRightColor: t.surfaceRaised,
      borderBottomColor: t.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    dialValue: { fontFamily: Font.bold, fontSize: 21, color: t.text },
    dialLabel: { fontFamily: Font.regular, fontSize: 11, lineHeight: 14, color: t.textMuted, textAlign: 'center' },
    progressStats: { flex: 1, gap: 12 },
    statBox: { padding: 14, gap: 4, borderRadius: Radius.field, backgroundColor: t.surfaceRaised },
    statLabel: { fontFamily: Font.regular, fontSize: 13, color: t.textMuted, textAlign: 'center' },
    statValue: { fontFamily: Font.bold, fontSize: 15, color: t.text, textAlign: 'center' },

    rewardCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 22,
      borderRadius: Radius.field,
      backgroundColor: Brand.ink,
    },
    rewardLabel: { fontFamily: Font.medium, fontStyle: 'italic', fontSize: 15, color: OnInk.text },
    rewardValue: { fontFamily: Font.bold, fontSize: 26, color: OnInk.text, marginTop: 4 },
    rewardSub: { fontFamily: Font.regular, fontSize: 13, color: OnInk.muted, marginTop: 2 },
    rewardTrophy: { fontSize: 44 },

    managerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    managerCopy: { flex: 1 },
    managerName: { fontFamily: Font.semibold, fontSize: 15, color: t.text },
    managerSub: { fontFamily: Font.regular, fontSize: 13, lineHeight: 18, color: t.textMuted },

    updateCard: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: Radius.field, backgroundColor: t.surface },
    updateBody: { flex: 1, gap: 4 },
    updateAuthor: { fontFamily: Font.semibold, fontSize: 14, color: t.text },
    updateText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted },
  });
