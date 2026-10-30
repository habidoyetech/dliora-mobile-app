import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Pdf from 'react-native-pdf';

import { useSession } from '@/auth/session';
import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { API_URL } from '@/lib/config';
import { useThemedStyles } from '@/hooks/use-theme';

type Props = {
  /** API path that streams the PDF, fetched with the signed-in user's token. */
  path: string;
  name?: string | null;
  /** Only set when the admin allows downloading. */
  downloadUrl?: string | null;
  /** Fires once the last page has been reached — the gate on "Mark as complete". */
  onReachedEnd?: () => void;
};

/**
 * The in-app PDF reader. The API streams the file behind the bearer token, and
 * no native PDF view can send a header, so the file is fetched to the cache
 * first and rendered from there — the same trick the web portal pulls with an
 * arraybuffer and pdf.js.
 */
export function PdfReader(props: Props) {
  // A new document starts the reader afresh, so there's no stale state to
  // clear — the same trick the web portal uses with a `key` on the reader.
  return <Reader key={props.path} {...props} />;
}

function Reader({ path, name, downloadUrl, onReachedEnd }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { token } = useSession();

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportedEnd = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // One file per source path, so re-opening the same document reuses it.
      const target = new File(Paths.cache, `pdf-${path.replace(/\W+/g, '-')}.pdf`);

      try {
        const file = await File.downloadFileAsync(`${API_URL}${path}`, target, {
          idempotent: true,
          headers: {
            Accept: 'application/pdf',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!cancelled) setLocalUri(file.uri);
      } catch {
        // A non-2xx status rejects here too, so one message covers both.
        if (!cancelled) setError('This PDF couldn’t be opened. Check your connection and try again.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path, token]);

  if (error) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="document-outline" size={28} color={Brand.gold} />
        <Text style={styles.placeholderText}>{error}</Text>
        {!!downloadUrl && (
          <Pressable onPress={() => Linking.openURL(downloadUrl)} accessibilityRole="button">
            <Text style={styles.placeholderAction}>Open it in your browser instead</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (!localUri) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator color={Brand.gold} />
        <Text style={styles.placeholderText}>Opening {name ?? 'the document'}…</Text>
      </View>
    );
  }

  return (
    <View style={styles.reader}>
      <Pdf
        source={{ uri: localUri }}
        style={styles.pdf}
        trustAllCerts={false}
        onPageChanged={(page: number, pageCount: number) => {
          if (!reportedEnd.current && page >= pageCount) {
            reportedEnd.current = true;
            onReachedEnd?.();
          }
        }}
        onLoadComplete={(pageCount: number) => {
          // A one-page document is read as soon as it opens.
          if (pageCount <= 1 && !reportedEnd.current) {
            reportedEnd.current = true;
            onReachedEnd?.();
          }
        }}
        onError={() => setError('This PDF couldn’t be displayed.')}
      />
    </View>
  );
}

const makeStyles = (t: ThemeColors) =>
  StyleSheet.create({
    reader: { height: 460, borderRadius: Radius.field, overflow: 'hidden', backgroundColor: t.surfaceRaised },
    pdf: { flex: 1, width: '100%', backgroundColor: t.surfaceRaised },
    placeholder: {
      height: 220,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 24,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    placeholderText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, textAlign: 'center' },
    placeholderAction: { fontFamily: Font.semibold, fontSize: 14, color: t.link },
  });
