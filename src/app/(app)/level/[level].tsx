import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/ui/progress-bar';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusPill, type StatusTone } from '@/components/ui/status-pill';
import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { useLevel } from '@/hooks/use-bootcamp';
import { useThemedStyles, useTheme } from '@/hooks/use-theme';
import type { Assignment, Lesson } from '@/types/api';

/** The chip on an assignment card, from its submission status. */
function toneFor(assignment: Assignment): { tone: StatusTone; label: string } {
  switch (assignment.submission_status) {
    case 'approved':
      return { tone: 'done', label: 'Completed' };
    case 'pending':
    case 'under_review':
      return { tone: 'pending', label: 'Under review' };
    case 'changes_required':
      return { tone: 'pending', label: 'Resubmit' };
    case 'rejected':
      return { tone: 'pending', label: 'Rejected' };
    default:
      return { tone: 'idle', label: 'Not submitted' };
  }
}

export default function LevelScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useLevel(level);

  return (
    <View style={styles.screen}>
      <ScreenHeader title={data?.name ?? 'Level'} />

      {isLoading ? (
        <View style={styles.centred}>
          <ActivityIndicator color={Brand.gold} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Brand.gold} />
          }>
          <View style={styles.hero}>
            {data?.image_url ? (
              <Image source={{ uri: data.image_url }} style={styles.heroImage} contentFit="cover" />
            ) : (
              <View style={[styles.heroImage, styles.heroBadgeWrap]}>
                <Text style={styles.heroBadge}>{data?.badge ?? '🎖'}</Text>
              </View>
            )}
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{data?.title ?? data?.name}</Text>
              {!!data?.description && <Text style={styles.heroText}>{data.description}</Text>}
              <ProgressBar value={data?.progress ?? 0} height={6} />
              <Text style={styles.heroStats}>
                {data?.progress ?? 0}% · {data?.lessons_completed ?? 0}/{data?.lessons_total ?? 0} lessons
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lessons</Text>
            {(data?.lessons ?? []).map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} styles={styles} theme={theme} />
            ))}
            {(data?.lessons ?? []).length === 0 && (
              <Text style={styles.emptyText}>No lessons in this level yet.</Text>
            )}
          </View>

          {(data?.assignments ?? []).length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Assignments</Text>
                <Text style={styles.sectionCount}>
                  {data?.assignments_summary.completed ?? 0}/{data?.assignments_summary.total ?? 0} done
                </Text>
              </View>
              {(data?.assignments ?? []).map((assignment) => {
                const pill = toneFor(assignment);
                return (
                  <Pressable
                    key={assignment.id}
                    disabled={assignment.locked}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: assignment.locked }}
                    onPress={() =>
                      router.push({ pathname: '/assignment/[id]', params: { id: assignment.id } })
                    }
                    style={[styles.row, assignment.locked && styles.rowLocked]}>
                    <View style={styles.rowIcon}>
                      <Ionicons
                        name={assignment.locked ? 'lock-closed' : 'clipboard-outline'}
                        size={17}
                        color={assignment.locked ? theme.textFaint : theme.link}
                      />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle} numberOfLines={2}>
                        {assignment.short_title}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {assignment.kind_label}
                        {assignment.number && assignment.of_total
                          ? ` · ${assignment.number} of ${assignment.of_total}`
                          : ''}
                      </Text>
                      {!!assignment.locked_reason && assignment.locked && (
                        <Text style={styles.rowLockedText}>{assignment.locked_reason}</Text>
                      )}
                    </View>
                    <StatusPill tone={pill.tone} label={pill.label} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function LessonRow({ lesson, styles, theme }: { lesson: Lesson; styles: Styles; theme: ThemeColors }) {
  const router = useRouter();
  const done = lesson.status === 'completed';

  return (
    <Pressable
      disabled={lesson.locked}
      accessibilityRole="button"
      accessibilityState={{ disabled: lesson.locked }}
      onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}
      style={[styles.row, lesson.locked && styles.rowLocked]}>
      <View style={styles.rowIcon}>
        <Ionicons
          name={
            lesson.locked
              ? 'lock-closed'
              : done
                ? 'checkmark-circle'
                : lesson.type === 'pdf'
                  ? 'document-text-outline'
                  : lesson.type === 'text'
                    ? 'book-outline'
                    : 'play'
          }
          size={17}
          color={lesson.locked ? theme.textFaint : done ? theme.success : theme.link}
        />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {lesson.title}
        </Text>
        <Text style={styles.rowMeta}>
          {lesson.number && lesson.of_total ? `Lesson ${lesson.number} of ${lesson.of_total}` : 'Lesson'}
          {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ''}
        </Text>
      </View>
      {!lesson.locked && <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />}
    </Pressable>
  );
}

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 22 },

    hero: { gap: 14, padding: 16, borderRadius: Radius.sheet, backgroundColor: t.surface },
    heroImage: { width: '100%', height: 150, borderRadius: Radius.field },
    heroBadgeWrap: { alignItems: 'center', justifyContent: 'center', backgroundColor: t.surfaceRaised },
    heroBadge: { fontSize: 52 },
    heroCopy: { gap: 8 },
    heroTitle: { fontFamily: Font.bold, fontSize: 20, color: t.text, letterSpacing: -0.3 },
    heroText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted },
    heroStats: { fontFamily: Font.medium, fontSize: 13, color: t.textMuted },

    section: { gap: 10 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontFamily: Font.bold, fontSize: 19, color: t.text, letterSpacing: -0.3 },
    sectionCount: { fontFamily: Font.medium, fontSize: 13, color: t.textMuted },
    emptyText: { fontFamily: Font.regular, fontSize: 14, color: t.textMuted },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    rowLocked: { opacity: 0.6 },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceRaised,
    },
    rowCopy: { flex: 1, gap: 3 },
    rowTitle: { fontFamily: Font.semibold, fontSize: 15, lineHeight: 20, color: t.text },
    rowMeta: { fontFamily: Font.regular, fontSize: 12.5, color: t.textMuted },
    rowLockedText: { fontFamily: Font.regular, fontSize: 12.5, color: t.textFaint },
  });
