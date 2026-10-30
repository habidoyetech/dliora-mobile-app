import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Font } from '@/constants/theme';

type Props = {
  uri?: string | null;
  /** Falls back to initials when there's no image. */
  name?: string | null;
  size?: number;
  /** Sits on the ink hero rather than a light surface. */
  onInk?: boolean;
};

function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/[\s-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

/** A creator's picture, or their initials while they have none. */
export function Avatar({ uri, name, size = 40, onInk }: Props) {
  const box = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[box, onInk ? styles.fillInk : styles.fillLight]}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[box, styles.centre, onInk ? styles.fillInk : styles.fillLight]}>
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }, onInk && styles.initialsInk]}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center', justifyContent: 'center' },
  fillInk: { backgroundColor: Brand.inkLine },
  fillLight: { backgroundColor: Brand.goldSoft },
  initials: { fontFamily: Font.semibold, color: Brand.goldDeep },
  initialsInk: { color: Brand.gold },
});
