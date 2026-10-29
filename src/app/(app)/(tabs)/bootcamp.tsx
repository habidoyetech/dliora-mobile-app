import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LevelCelebration } from '@/components/level-celebration';
import { LibraryView } from '@/components/library-view';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Segmented } from '@/components/ui/segmented';
import { Brand, Font, OnInk, Radius, type ThemeColors } from '@/constants/theme';
import { useBootcamp } from '@/hooks/use-bootcamp';
import { useCelebrationSeen } from '@/hooks/use-library';
import { useThemedStyles, useTheme } from '@/hooks/use-theme';
import type { TrackRow } from '@/types/api';

type Tab = 'journey' | 'library';

export default function BootcampScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('journey');

  const { data } = useBootcamp();
  const celebrationSeen = useCelebrationSeen();
  /** Dismissed in this session, while the server round-trip settles. */
  const [dismissed, setDismissed] = useState<number | null>(null);

  const celebrate = data?.celebrate && data.celebrate.id !== dismissed ? data.celebrate : null;

  const closeCelebration = (andOpen: boolean) => {
    if (!celebrate) return;
    setDismissed(celebrate.id);
    celebrationSeen.mutate(celebrate.id);
    if (andOpen) router.push({ pathname: '/level/[level]', params: { level: celebrate.key } });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.head, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headTitle}>Bootcamp</Text>
        <Text style={styles.headSub}>Level up as a creator.</Text>
        <View style={styles.headSwitch}>
          <Segmented
            onInk
            value={tab}
            onChange={setTab}
            options={[
              { value: 'journey', label: 'Journey' },
              { value: 'library', label: 'Library' },
            ]}
          />
        </View>
      </View>

      {tab === 'journey' ? <Journey /> : <LibraryView bottomInset={insets.bottom} />}

      {!!celebrate && (
        <LevelCelebration
          track={celebrate}
          onContinue={() => closeCelebration(true)}
          onDismiss={() => closeCelebration(false)}
        />
      )}
    </View>
  );
}

function Journey() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useBootcamp();

  const lesson = data?.continue_lesson;

  if (isLoading) {
    return (
      <View style={[styles.flex, styles.centred]}>
        <ActivityIndicator color={Brand.gold} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Brand.gold} />}>
      <Text style={styles.eyebrow}>CURRENT LEVEL</Text>

      <View style={styles.summary}>
        <View style={styles.summaryTop}>
          <Text style={styles.summaryLevel}>{data?.current_level_title ?? 'Getting started'}</Text>
          <Text style={styles.summaryPct}>{Math.round(data?.overall_progress ?? 0)}%</Text>
        </View>
        <ProgressBar value={data?.overall_progress ?? 0} onInk />
        <View style={styles.summaryStats}>
          <Text style={styles.summaryStat}>
            {data?.lessons_completed ?? 0}/{data?.lessons_total ?? 0} lessons
          </Text>
          <Text style={styles.summaryStat}>
            {data?.assignments_completed ?? 0}/{data?.assignments_total ?? 0} assignments
          </Text>
        </View>
      </View>

      {!!data?.finished && (
        <View style={styles.finished}>
          <Text style={styles.finishedGlyph}>🎉</Text>
          <Text style={styles.finishedTitle}>You&apos;ve finished the Bootcamp</Text>
          <Text style={styles.finishedText}>
            Every level is complete. Rewatch any lesson any time — your badges are yours to keep.
          </Text>
        </View>
      )}

      {!!lesson && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pick up where you left off</Text>
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
              {!!lesson.duration_minutes && (
                <Text style={styles.lessonDuration}>{lesson.duration_minutes} min</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Levels</Text>
        {(data?.levels ?? []).map((level) => (
          <LevelCard key={level.id} level={level} styles={styles} theme={theme} />
        ))}
      </View>
    </ScrollView>
  );
}

function LevelCard({
  level,
  styles,
  theme,
}: {
  level: TrackRow;
  styles: Styles;
  theme: ThemeColors;
}) {
  const router = useRouter();
  const locked = !level.unlocked;

  return (
    <Pressable
      disabled={locked}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      accessibilityLabel={`${level.title}${locked ? ', locked' : `, ${level.progress}% complete`}`}
      onPress={() => router.push({ pathname: '/level/[level]', params: { level: level.key } })}
      style={[styles.levelCard, locked && styles.levelCardLocked]}>
      <View style={styles.levelBadgeWrap}>
        <Text style={[styles.levelBadge, locked && styles.levelBadgeLocked]}>{level.badge ?? '🎖'}</Text>
      </View>

      <View style={styles.levelCopy}>
        <View style={styles.levelHeadRow}>
          <Text style={[styles.levelName, locked && styles.levelNameLocked]} numberOfLines={1}>
            {level.name}
          </Text>
          {level.status === 'completed' ? (
            <Ionicons name="checkmark-circle" size={18} color={theme.success} />
          ) : locked ? (
            <Ionicons name="lock-closed" size={15} color={theme.textFaint} />
          ) : null}
        </View>
        {!!level.caption && (
          <Text style={styles.levelCaption} numberOfLines={1}>
            {level.caption}
          </Text>
        )}
        {locked ? (
          <Text style={styles.levelLockedText}>Finish the level before this one to open it.</Text>
        ) : (
          <>
            <ProgressBar value={level.progress} height={6} />
            <Text style={styles.levelStats}>
              {level.lessons_completed}/{level.lessons_total} lessons ·{' '}
              {level.assignments_completed}/{level.assignments_total} assignments
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    flex: { flex: 1 },
    centred: { alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 22 },

    head: { paddingHorizontal: 20, paddingBottom: 20, backgroundColor: Brand.ink },
    headTitle: { fontFamily: Font.bold, fontSize: 28, color: OnInk.text, letterSpacing: -0.5 },
    headSub: { fontFamily: Font.regular, fontSize: 15, color: OnInk.muted, marginTop: 4 },
    headSwitch: { marginTop: 18 },

    eyebrow: { fontFamily: Font.semibold, fontSize: 12, letterSpacing: 1, color: t.textMuted },
    heading: { fontFamily: Font.bold, fontSize: 27, color: t.text, letterSpacing: -0.5, marginTop: 4 },

    summary: { padding: 20, gap: 12, borderRadius: Radius.sheet, backgroundColor: Brand.ink },
    summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    summaryLevel: { flex: 1, fontFamily: Font.semibold, fontSize: 17, color: OnInk.text },
    summaryPct: { fontFamily: Font.bold, fontSize: 20, color: Brand.gold },
    summaryStats: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryStat: { fontFamily: Font.regular, fontSize: 13, color: OnInk.muted },

    finished: { padding: 20, gap: 6, borderRadius: Radius.field, backgroundColor: Brand.goldSoft },
    finishedGlyph: { fontSize: 28 },
    finishedTitle: { fontFamily: Font.bold, fontSize: 17, color: Brand.goldDeep },
    finishedText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: Brand.goldDeep },

    section: { gap: 12 },
    sectionTitle: { fontFamily: Font.bold, fontSize: 19, color: t.text, letterSpacing: -0.3 },

    lessonCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 12,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    lessonThumbWrap: { width: 78, height: 78 },
    lessonThumb: { width: 78, height: 78, borderRadius: 10 },
    lessonThumbEmpty: { backgroundColor: t.surfaceRaised },
    playBadge: {
      position: 'absolute',
      top: 27,
      left: 27,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.white,
    },
    lessonMeta: { flex: 1, gap: 4 },
    lessonEyebrow: { fontFamily: Font.semibold, fontSize: 11, letterSpacing: 0.6, color: t.textMuted },
    lessonTitle: { fontFamily: Font.bold, fontSize: 15.5, lineHeight: 20, color: t.text },
    lessonDuration: { fontFamily: Font.regular, fontSize: 12.5, color: t.textMuted },

    levelCard: {
      flexDirection: 'row',
      gap: 14,
      padding: 16,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    levelCardLocked: { opacity: 0.6 },
    levelBadgeWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceRaised,
    },
    levelBadge: { fontSize: 24 },
    levelBadgeLocked: { opacity: 0.45 },
    levelCopy: { flex: 1, gap: 7 },
    levelHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    levelName: { flex: 1, fontFamily: Font.bold, fontSize: 16, color: t.text },
    levelNameLocked: { color: t.textMuted },
    levelCaption: { fontFamily: Font.regular, fontSize: 13, color: t.textMuted, marginTop: -4 },
    levelStats: { fontFamily: Font.regular, fontSize: 12.5, color: t.textMuted },
    levelLockedText: { fontFamily: Font.regular, fontSize: 13, lineHeight: 19, color: t.textFaint },
  });
