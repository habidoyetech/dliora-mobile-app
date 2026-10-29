import { StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';

type Props = {
  /** 0–100. */
  value: number;
  /** Dark track for the ink hero, light track on a surface. */
  onInk?: boolean;
  height?: number;
};

export function ProgressBar({ value, onInk, height = 8 }: Props) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={[styles.track, { height, borderRadius: height / 2 }, onInk ? styles.trackInk : styles.trackLight]}>
      <View style={[styles.fill, { width: `${pct}%`, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  trackInk: { backgroundColor: 'rgba(255,255,255,0.14)' },
  trackLight: { backgroundColor: '#E8E8E9' },
  fill: { height: '100%', backgroundColor: Brand.gold },
});
