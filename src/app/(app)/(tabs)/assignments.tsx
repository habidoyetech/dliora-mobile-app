import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusPill, type StatusTone } from '@/components/ui/status-pill';
import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { useAssignments, type AssignmentFilter } from '@/hooks/use-assignments';
import { useThemedStyles, useTheme } from '@/hooks/use-theme';
import type { Assignment } from '@/types/api';

const FILTERS: { label: string; status: AssignmentFilter['status'] }[] = [
  { label: 'All', status: undefined },
  { label: 'To do', status: 'not_submitted' },
  { label: 'In review', status: 'under_review' },
  { label: 'Resubmit', status: 'changes_required' },
  { label: 'Done', status: 'approved' },
];

export function pillFor(assignment: Assignment): { tone: StatusTone; label: string } {
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

export default function AssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const router = useRouter();
  const [status, setStatus] = useState<AssignmentFilter['status']>(undefined);
  const { data, isLoading, isRefetching, refetch } = useAssignments({ status });

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.heading}>Assignments</Text>
        <Text style={styles.subheading}>Hand in your work and level up.</Text>
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(filter) => filter.label}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filterStrip}
        renderItem={({ item }) => {
          const active = item.status === status;
          return (
            <Pressable
              onPress={() => setStatus(item.status)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        }}
      />

      {isLoading ? (
        <View style={styles.centred}>
          <ActivityIndicator color={Brand.gold} />
        </View>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(assignment) => String(assignment.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Brand.gold} />
          }
          renderItem={({ item }) => {
            const pill = pillFor(item);
            return (
              <Pressable
                disabled={item.locked}
                accessibilityRole="button"
                accessibilityState={{ disabled: item.locked }}
                onPress={() => router.push({ pathname: '/assignment/[id]', params: { id: item.id } })}
                style={[styles.card, item.locked && styles.cardLocked]}>
                <View style={styles.cardTop}>
                  <View style={styles.cardIcon}>
                    <Ionicons
                      name={item.locked ? 'lock-closed' : 'clipboard-outline'}
                      size={17}
                      color={item.locked ? theme.textFaint : theme.link}
                    />
                  </View>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardLevel}>{item.level_title ?? 'Bootcamp'}</Text>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.short_title}
                    </Text>
                  </View>
                  <StatusPill tone={pill.tone} label={pill.label} />
                </View>

                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMeta}>{item.kind_label}</Text>
                  {!!item.questions_count && (
                    <Text style={styles.cardMeta}>
                      {item.questions_count} question{item.questions_count === 1 ? '' : 's'}
                    </Text>
                  )}
                  {item.needs_files && <Text style={styles.cardMeta}>Needs a file</Text>}
                </View>

                {item.locked && !!item.locked_reason && (
                  <Text style={styles.cardLockedText}>{item.locked_reason}</Text>
                )}
                {!!item.review_notes && (
                  <View style={styles.review}>
                    <Text style={styles.reviewLabel}>Reviewer asked for changes</Text>
                    <Text style={styles.reviewText}>{item.review_notes}</Text>
                  </View>
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing here</Text>
              <Text style={styles.emptyText}>
                {status
                  ? 'No assignments match this filter right now.'
                  : 'Assignments open as you work through the Bootcamp lessons.'}
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

    header: { paddingHorizontal: 20, paddingBottom: 4 },
    heading: { fontFamily: Font.bold, fontSize: 27, color: t.text, letterSpacing: -0.5 },
    subheading: { fontFamily: Font.regular, fontSize: 14.5, color: t.textMuted, marginTop: 4 },

    filterStrip: { flexGrow: 0 },
    filters: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
    chip: {
      paddingHorizontal: 15,
      paddingVertical: 9,
      borderRadius: Radius.pill,
      backgroundColor: t.surfaceRaised,
    },
    chipActive: { backgroundColor: Brand.gold },
    chipLabel: { fontFamily: Font.medium, fontSize: 13.5, color: t.textMuted },
    chipLabelActive: { fontFamily: Font.semibold, color: Brand.ink },

    list: { paddingHorizontal: 20, gap: 12 },
    card: { padding: 16, gap: 10, borderRadius: Radius.field, backgroundColor: t.surface },
    cardLocked: { opacity: 0.6 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    cardIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceRaised,
    },
    cardCopy: { flex: 1, gap: 2 },
    cardLevel: { fontFamily: Font.semibold, fontSize: 11.5, letterSpacing: 0.5, color: t.textMuted },
    cardTitle: { fontFamily: Font.semibold, fontSize: 15.5, lineHeight: 21, color: t.text },
    cardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    cardMeta: { fontFamily: Font.regular, fontSize: 12.5, color: t.textMuted },
    cardLockedText: { fontFamily: Font.regular, fontSize: 12.5, color: t.textFaint },

    review: { padding: 12, gap: 3, borderRadius: 10, backgroundColor: '#F7E7C4' },
    reviewLabel: { fontFamily: Font.semibold, fontSize: 12.5, color: '#8A6412' },
    reviewText: { fontFamily: Font.regular, fontSize: 13.5, lineHeight: 20, color: '#8A6412' },

    empty: { padding: 24, gap: 6, borderRadius: Radius.field, backgroundColor: t.surface },
    emptyTitle: { fontFamily: Font.semibold, fontSize: 16, color: t.text, textAlign: 'center' },
    emptyText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, textAlign: 'center' },
  });
