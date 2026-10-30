import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PdfReader } from '@/components/pdf-reader';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { useLibraryProgress, useLibraryResource } from '@/hooks/use-library';
import { useThemedStyles, useTheme } from '@/hooks/use-theme';
import { htmlToText } from '@/lib/html';
import type { LibraryResource } from '@/types/api';

function runtime(seconds: number | null): string | null {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  return minutes < 1 ? '< 1 min' : `${minutes} min`;
}

function views(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k views`;
  return `${count} view${count === 1 ? '' : 's'}`;
}

export default function LibraryResourceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const router = useRouter();

  const { data: resource, isLoading } = useLibraryResource(id);
  const progress = useLibraryProgress(id);

  if (isLoading || !resource) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Library" />
        <View style={styles.centred}>
          <ActivityIndicator color={Brand.gold} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Library" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}>
        {resource.type === 'video' &&
          (resource.playlist_url ? (
            <ResourceVideo
              uri={resource.playlist_url}
              startAt={resource.progress?.percent ?? 0}
              onProgress={(percent) => progress.mutate(percent)}
              styles={styles}
            />
          ) : (
            <View style={styles.preparing}>
              <Ionicons name="hourglass-outline" size={24} color={Brand.gold} />
              <Text style={styles.preparingText}>
                This video is still being prepared. Check back in a few minutes.
              </Text>
            </View>
          ))}

        {resource.is_pdf && (
          <PdfReader
            path={`/training/library/${resource.id}/pdf`}
            name={resource.file_name}
            downloadUrl={resource.download_url}
          />
        )}

        <View style={styles.header}>
          <Text style={styles.meta}>
            {[runtime(resource.duration_seconds) ?? resource.format, views(resource.views_count)]
              .filter(Boolean)
              .join('  •  ')}
          </Text>
          <Text style={styles.title}>{resource.title}</Text>
          {!!resource.category && <Text style={styles.category}>{resource.category.title}</Text>}
        </View>

        {!!resource.description && <Text style={styles.description}>{resource.description}</Text>}

        {resource.type === 'text' && !!resource.body && (
          <Text style={styles.body}>{htmlToText(resource.body)}</Text>
        )}

        {resource.type === 'document' && !resource.is_pdf && (
          <View style={styles.fileCard}>
            <Ionicons name="document-text-outline" size={22} color={theme.link} />
            <View style={styles.fileCopy}>
              <Text style={styles.fileName} numberOfLines={2}>
                {resource.file_name ?? resource.title}
              </Text>
              {!!resource.file_size && (
                <Text style={styles.fileMeta}>{Math.round(resource.file_size / 1024)} KB</Text>
              )}
            </View>
          </View>
        )}

        {resource.allow_download && !!resource.download_url && (
          <Pressable
            onPress={() => Linking.openURL(resource.download_url!)}
            accessibilityRole="button"
            style={styles.download}>
            <Ionicons name="download-outline" size={18} color={theme.link} />
            <Text style={styles.downloadLabel}>Download</Text>
          </Pressable>
        )}

        {resource.related.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>More videos</Text>
            {resource.related.map((related) => (
              <RelatedCard
                key={related.id}
                resource={related}
                styles={styles}
                theme={theme}
                onPress={() => router.replace({ pathname: '/library/[id]', params: { id: related.id } })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function RelatedCard({
  resource,
  styles,
  theme,
  onPress,
}: {
  resource: LibraryResource;
  styles: Styles;
  theme: ThemeColors;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.relatedCard} accessibilityRole="button" onPress={onPress}>
      <View style={styles.relatedThumbWrap}>
        {resource.thumbnail_url ? (
          <Image source={{ uri: resource.thumbnail_url }} style={styles.relatedThumb} contentFit="cover" />
        ) : (
          <View style={[styles.relatedThumb, styles.relatedThumbEmpty]}>
            <Ionicons name="videocam" size={18} color={theme.textFaint} />
          </View>
        )}
        {resource.type === 'video' && (
          <View style={styles.relatedPlay}>
            <Ionicons name="play" size={12} color={Brand.ink} />
          </View>
        )}
      </View>
      <View style={styles.relatedCopy}>
        <Text style={styles.relatedTitle} numberOfLines={2}>
          {resource.title}
        </Text>
        <Text style={styles.relatedMeta}>
          {[runtime(resource.duration_seconds) ?? resource.format, views(resource.views_count)]
            .filter(Boolean)
            .join('  •  ')}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Library videos report how far through them you are, unlike Bootcamp lessons
 * which only record started / completed. Progress is sent every 5% rather than
 * on every tick — the server only needs the shape of it, not every second.
 */
function ResourceVideo({
  uri,
  startAt,
  onProgress,
  styles,
}: {
  uri: string;
  startAt: number;
  onProgress: (percent: number) => void;
  styles: Styles;
}) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.timeUpdateEventInterval = 1;
    // Pick up where they left off. The player knows its duration here, and
    // seeking in the setup callback keeps it out of render.
    const total = instance.duration;
    if (startAt > 0 && startAt < 95 && total > 0) {
      instance.currentTime = (startAt / 100) * total;
    }
  });

  const { status, error } = useEvent(player, 'statusChange', { status: player.status }) ?? {
    status: player.status,
    error: undefined,
  };
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  }) ?? { currentTime: 0 };

  const lastSent = useRef(0);

  useEffect(() => {
    const total = player.duration;
    if (!total || total <= 0) return;

    const percent = Math.min(100, Math.round((currentTime / total) * 100));
    if (percent >= lastSent.current + 5 || (percent >= 98 && lastSent.current < 98)) {
      lastSent.current = percent;
      onProgress(percent);
    }
  }, [currentTime, player.duration, onProgress]);

  if (error) {
    return (
      <View style={styles.preparing}>
        <Text style={styles.preparingText}>This video couldn&apos;t be played right now.</Text>
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
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },

    videoWrap: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: Radius.field,
      overflow: 'hidden',
      backgroundColor: Brand.ink,
    },
    video: { width: '100%', height: '100%' },
    videoLoading: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    preparing: {
      width: '100%',
      aspectRatio: 16 / 9,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 28,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    preparingText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, textAlign: 'center' },

    header: { gap: 5 },
    meta: { fontFamily: Font.regular, fontSize: 13.5, color: t.textMuted },
    title: { fontFamily: Font.bold, fontSize: 22, lineHeight: 29, color: t.text, letterSpacing: -0.4 },
    category: { fontFamily: Font.medium, fontSize: 13, color: t.link },
    description: { fontFamily: Font.regular, fontSize: 15, lineHeight: 23, color: t.textMuted },
    body: { fontFamily: Font.regular, fontSize: 15.5, lineHeight: 25, color: t.text },

    fileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    fileCopy: { flex: 1, gap: 2 },
    fileName: { fontFamily: Font.semibold, fontSize: 15, color: t.text },
    fileMeta: { fontFamily: Font.regular, fontSize: 12.5, color: t.textMuted },

    download: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 50,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: t.border,
    },
    downloadLabel: { fontFamily: Font.semibold, fontSize: 15, color: t.link },

    section: { gap: 10, marginTop: 4 },
    sectionTitle: { fontFamily: Font.bold, fontSize: 18, color: t.text, letterSpacing: -0.3 },
    relatedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 10,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    relatedThumbWrap: { width: 92, height: 64 },
    relatedThumb: { width: 92, height: 64, borderRadius: 10 },
    relatedThumbEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: t.surfaceRaised },
    relatedPlay: {
      position: 'absolute',
      top: 22,
      left: 34,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.white,
    },
    relatedCopy: { flex: 1, gap: 3 },
    relatedTitle: { fontFamily: Font.semibold, fontSize: 15, lineHeight: 20, color: t.text },
    relatedMeta: { fontFamily: Font.regular, fontSize: 12.5, color: t.textMuted },
  });
