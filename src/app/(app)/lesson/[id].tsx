import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PdfReader } from '@/components/pdf-reader';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { useLesson, useLessonProgress } from '@/hooks/use-bootcamp';
import { useThemedStyles, useTheme } from '@/hooks/use-theme';
import { htmlToText } from '@/lib/html';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const router = useRouter();

  const { data: lesson, isLoading, isError, error } = useLesson(id);
  const progress = useLessonProgress(id);

  const done = lesson?.status === 'completed';
  /**
   * Opening an untouched lesson starts it — the same rule as the web portal,
   * which only fires on `not_started`. The ref keeps a refetch from resending.
   */
  const started = useRef<string | null>(null);
  /** PDF lessons: completing waits until the last page has been reached. */
  const [readToEnd, setReadToEnd] = useState(false);
  const mustReadToEnd = lesson?.type === 'pdf' && !!lesson.pdf && !readToEnd;

  const markComplete = useCallback(() => {
    if (!lesson || done || lesson.locked) return;
    progress.mutate('completed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id, done]);

  const shouldStart = !!lesson && lesson.status === 'not_started' && !lesson.locked;

  useEffect(() => {
    if (!shouldStart || started.current === String(lesson.id)) return;
    started.current = String(lesson.id);
    progress.mutate('in_progress');
    // `progress` is a stable mutation object; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStart, lesson?.id]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Lesson" />
        <View style={styles.centred}>
          <ActivityIndicator color={Brand.gold} />
        </View>
      </View>
    );
  }

  if (isError || !lesson) {
    const locked = error instanceof Error && 'status' in error && (error as { status?: number }).status === 403;
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Lesson" />
        <View style={styles.centred}>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>{locked ? 'Not open yet' : 'Couldn’t load this lesson'}</Text>
            <Text style={styles.noticeText}>
              {locked
                ? 'Complete the previous lesson first, then come back to this one.'
                : 'Check your connection and try again.'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title={lesson.level_title ?? 'Lesson'} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}>
        {lesson.type === 'video' ? (
          <LessonVideo
            uri={lesson.hls_url ?? lesson.video_url}
            poster={lesson.thumbnail_url}
            onEnded={markComplete}
            styles={styles}
          />
        ) : lesson.thumbnail_url ? (
          <Image source={{ uri: lesson.thumbnail_url }} style={styles.cover} contentFit="cover" />
        ) : null}

        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            {lesson.number && lesson.of_total ? `LESSON ${lesson.number} OF ${lesson.of_total}` : 'LESSON'}
            {lesson.duration_minutes ? ` · ${lesson.duration_minutes} MIN` : ''}
          </Text>
          <Text style={styles.title}>{lesson.title}</Text>
          {done && (
            <View style={styles.doneRow}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={styles.doneText}>Completed</Text>
            </View>
          )}
        </View>

        {!!lesson.summary && <Text style={styles.summary}>{lesson.summary}</Text>}

        {lesson.type === 'text' && !!lesson.body && <Text style={styles.body}>{htmlToText(lesson.body)}</Text>}

        {lesson.type === 'pdf' &&
          (lesson.pdf ? (
            <View style={styles.pdfBlock}>
              <PdfReader
                path={lesson.pdf.path}
                name={lesson.pdf.name}
                downloadUrl={lesson.pdf.download_url}
                onReachedEnd={() => setReadToEnd(true)}
              />
              {lesson.pdf.allow_download && !!lesson.pdf.download_url && (
                <Pressable
                  onPress={() => Linking.openURL(lesson.pdf!.download_url!)}
                  hitSlop={8}
                  accessibilityRole="button"
                  style={styles.pdfDownload}>
                  <Ionicons name="download-outline" size={17} color={theme.link} />
                  <Text style={styles.pdfAction}>Download {lesson.pdf.name ?? 'document'}</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Text style={styles.summary}>This lesson&apos;s PDF isn&apos;t available yet.</Text>
          ))}

        {done ? (
          <PrimaryButton
            label={lesson.next_lesson_id ? 'Next lesson' : 'Back to Bootcamp'}
            onPress={() =>
              lesson.next_lesson_id
                ? router.replace({ pathname: '/lesson/[id]', params: { id: lesson.next_lesson_id } })
                : router.back()
            }
          />
        ) : (
          <View style={styles.completeBlock}>
            <PrimaryButton
              label="Mark as complete"
              loading={progress.isPending}
              disabled={mustReadToEnd}
              onPress={markComplete}
            />
            {mustReadToEnd && (
              <Text style={styles.completeHint}>Read to the last page to complete this lesson.</Text>
            )}
          </View>
        )}

        {lesson.assignments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assignment{lesson.assignments.length > 1 ? 's' : ''}</Text>
            {lesson.assignments.map((assignment) => (
              <Pressable
                key={assignment.id}
                disabled={assignment.locked}
                accessibilityRole="button"
                accessibilityState={{ disabled: assignment.locked }}
                onPress={() => router.push({ pathname: '/assignment/[id]', params: { id: assignment.id } })}
                style={[styles.row, assignment.locked && styles.rowLocked]}>
                <Ionicons
                  name={assignment.locked ? 'lock-closed' : 'clipboard-outline'}
                  size={18}
                  color={assignment.locked ? theme.textFaint : theme.link}
                />
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {assignment.short_title}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {assignment.locked
                      ? (assignment.locked_reason ?? 'Opens when this lesson is complete')
                      : assignment.submission_status_label}
                  </Text>
                </View>
                {!assignment.locked && (
                  <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
                )}
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.nav}>
          <Pressable
            disabled={!lesson.prev_lesson_id}
            accessibilityRole="button"
            onPress={() =>
              router.replace({ pathname: '/lesson/[id]', params: { id: lesson.prev_lesson_id! } })
            }
            style={[styles.navButton, !lesson.prev_lesson_id && styles.navButtonOff]}>
            <Ionicons name="chevron-back" size={17} color={theme.text} />
            <Text style={styles.navLabel}>Previous</Text>
          </Pressable>
          <Pressable
            disabled={!lesson.next_lesson_id}
            accessibilityRole="button"
            onPress={() =>
              router.replace({ pathname: '/lesson/[id]', params: { id: lesson.next_lesson_id! } })
            }
            style={[styles.navButton, !lesson.next_lesson_id && styles.navButtonOff]}>
            <Text style={styles.navLabel}>Next</Text>
            <Ionicons name="chevron-forward" size={17} color={theme.text} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * The lesson video. The API hands us a relative HLS playlist it signs itself,
 * so an `.m3u8` plays natively here — AVPlayer on iOS, ExoPlayer on Android —
 * with no hls.js shim like the web portal needs.
 */
function LessonVideo({
  uri,
  poster,
  onEnded,
  styles,
}: {
  uri: string | null;
  poster: string | null;
  onEnded: () => void;
  styles: Styles;
}) {
  const player = useVideoPlayer(uri ?? null, (instance) => {
    instance.timeUpdateEventInterval = 1;
  });

  const { status, error } = useEvent(player, 'statusChange', { status: player.status }) ?? {
    status: player.status,
    error: undefined,
  };
  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: 0, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 }) ?? { currentTime: 0 };

  const reported = useRef(false);
  const failed = !!error;

  // Counted as watched at 95% — people rarely sit through the last seconds.
  useEffect(() => {
    const total = player.duration;
    if (reported.current || !total || total <= 0) return;
    if (currentTime / total >= 0.95) {
      reported.current = true;
      onEnded();
    }
  }, [currentTime, player.duration, onEnded]);

  if (!uri || failed) {
    return (
      <View style={styles.videoFallback}>
        {poster ? (
          <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : null}
        <View style={styles.videoFallbackVeil}>
          <Text style={styles.videoFallbackText}>
            {uri ? 'This video couldn’t be played right now.' : 'This lesson has no video yet.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.videoWrap}>
      <VideoView
        style={styles.video}
        player={player}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
        nativeControls
        contentFit="contain"
      />
      {status === 'loading' && (
        <View style={styles.videoLoading} pointerEvents="none">
          <ActivityIndicator color={Brand.gold} />
        </View>
      )}
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 18 },

    videoWrap: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.field, overflow: 'hidden', backgroundColor: Brand.ink },
    video: { width: '100%', height: '100%' },
    videoLoading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
    videoFallback: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: Radius.field,
      overflow: 'hidden',
      backgroundColor: Brand.inkRaised,
    },
    videoFallbackVeil: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: 'rgba(12,13,14,0.6)',
    },
    videoFallbackText: { fontFamily: Font.medium, fontSize: 14, color: Brand.white, textAlign: 'center' },
    cover: { width: '100%', height: 170, borderRadius: Radius.field },

    header: { gap: 6 },
    eyebrow: { fontFamily: Font.semibold, fontSize: 11.5, letterSpacing: 0.7, color: t.textMuted },
    title: { fontFamily: Font.bold, fontSize: 23, lineHeight: 30, color: t.text, letterSpacing: -0.4 },
    doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    doneText: { fontFamily: Font.semibold, fontSize: 13.5, color: t.success },

    summary: { fontFamily: Font.regular, fontSize: 15, lineHeight: 23, color: t.textMuted },
    body: { fontFamily: Font.regular, fontSize: 15.5, lineHeight: 25, color: t.text },

    notice: { padding: 20, gap: 6, borderRadius: Radius.field, backgroundColor: t.surface },
    noticeTitle: { fontFamily: Font.semibold, fontSize: 16, color: t.text, textAlign: 'center' },
    noticeText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, textAlign: 'center' },

    pdfBlock: { gap: 12 },
    pdfDownload: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
    pdfAction: { fontFamily: Font.semibold, fontSize: 14, color: t.link },

    section: { gap: 10 },
    sectionTitle: { fontFamily: Font.bold, fontSize: 18, color: t.text, letterSpacing: -0.3 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    rowLocked: { opacity: 0.6 },
    rowCopy: { flex: 1, gap: 3 },
    rowTitle: { fontFamily: Font.semibold, fontSize: 15, lineHeight: 20, color: t.text },
    rowMeta: { fontFamily: Font.regular, fontSize: 12.5, color: t.textMuted },

    completeBlock: { gap: 8 },
    completeHint: { fontFamily: Font.regular, fontSize: 12.5, color: t.textMuted, textAlign: 'center' },

    nav: { flexDirection: 'row', gap: 12, marginTop: 4 },
    navButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 48,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: t.border,
    },
    navButtonOff: { opacity: 0.4 },
    navLabel: { fontFamily: Font.semibold, fontSize: 14.5, color: t.text },
  });
