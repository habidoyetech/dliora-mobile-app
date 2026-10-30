import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Brand, Font, OnInk, Radius } from '@/constants/theme';
import type { TrackSummary } from '@/types/api';

const BADGES: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '🏆',
};

/** Confetti: fixed positions so it reads the same every time, no randomness. */
const CONFETTI = [
  { left: '8%', top: '12%', colour: '#E8402A', rotate: '24deg' },
  { left: '22%', top: '34%', colour: '#DDA63C', rotate: '-14deg' },
  { left: '34%', top: '8%', colour: '#3B82F6', rotate: '48deg' },
  { left: '48%', top: '26%', colour: '#22C55E', rotate: '-32deg' },
  { left: '62%', top: '10%', colour: '#DDA63C', rotate: '12deg' },
  { left: '76%', top: '30%', colour: '#E8402A', rotate: '-48deg' },
  { left: '88%', top: '16%', colour: '#3B82F6', rotate: '36deg' },
  { left: '14%', top: '62%', colour: '#22C55E', rotate: '-20deg' },
  { left: '30%', top: '78%', colour: '#DDA63C', rotate: '52deg' },
  { left: '58%', top: '70%', colour: '#E8402A', rotate: '-8deg' },
  { left: '72%', top: '84%', colour: '#3B82F6', rotate: '28deg' },
  { left: '86%', top: '58%', colour: '#DDA63C', rotate: '-40deg' },
] as const;

type Props = {
  /** The newly reached tier, from `GET /bootcamp` → `celebrate`. */
  track: TrackSummary;
  onContinue: () => void;
  onDismiss: () => void;
};

/**
 * "Silver Level Unlocked!" — shown once, the first time a creator reaches a
 * new tier. Both buttons mark it seen on the server, so it never comes back.
 */
export function LevelCelebration({ track, onContinue, onDismiss }: Props) {
  const name = track.name ?? 'New level';
  const badge = BADGES[track.key] ?? '🎖';

  return (
    <Modal visible transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Dismiss" />

        <Animated.View entering={FadeInDown.duration(320)} style={styles.card}>
          <View style={styles.confetti} pointerEvents="none">
            {CONFETTI.map((piece, i) => (
              <Animated.View
                key={`${piece.left}-${piece.top}`}
                entering={FadeInUp.delay(120 + i * 45).duration(620)}
                style={[
                  styles.confettiPiece,
                  {
                    left: piece.left,
                    top: piece.top,
                    backgroundColor: piece.colour,
                    transform: [{ rotate: piece.rotate }],
                  },
                ]}
              />
            ))}
          </View>

          <Pressable
            onPress={onDismiss}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.close}>
            <Ionicons name="close" size={22} color={OnInk.text} />
          </Pressable>

          <Text style={styles.party}>🎉</Text>
          <Text style={styles.title} accessibilityRole="header">
            {name} Unlocked!
          </Text>
          <Text style={styles.body}>
            Your assignments were approved. New lessons and assignments are ready for you.
          </Text>

          <Animated.View entering={ZoomIn.delay(160).duration(420)} style={styles.disc}>
            <Text style={styles.badge}>{badge}</Text>
          </Animated.View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{name.toUpperCase()}</Text>
          </View>

          <Text style={styles.earned}>
            You&apos;ve earned a new <Text style={styles.earnedName}>{name}</Text> badge
          </Text>

          <View style={styles.action}>
            <PrimaryButton label={`Continue to ${name}`} onPress={onContinue} />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(12,13,14,0.62)',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 34,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    backgroundColor: '#1A1407',
    overflow: 'hidden',
  },
  confetti: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  confettiPiece: { position: 'absolute', width: 9, height: 14, borderRadius: 2, opacity: 0.75 },

  close: { position: 'absolute', top: 18, right: 20, padding: 4 },
  party: { fontSize: 34 },
  title: {
    fontFamily: Font.bold,
    fontSize: 26,
    color: Brand.gold,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginTop: 12,
  },
  body: {
    fontFamily: Font.regular,
    fontSize: 15,
    lineHeight: 23,
    color: OnInk.text,
    textAlign: 'center',
    marginTop: 10,
  },
  disc: {
    width: 136,
    height: 136,
    borderRadius: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  badge: { fontSize: 58 },
  tag: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  tagText: { fontFamily: Font.bold, fontSize: 12.5, letterSpacing: 0.8, color: OnInk.text },
  earned: { fontFamily: Font.regular, fontSize: 15, color: OnInk.text, textAlign: 'center', marginTop: 20 },
  earnedName: { fontFamily: Font.bold, color: Brand.gold },
  action: { alignSelf: 'stretch', marginTop: 22 },
});
