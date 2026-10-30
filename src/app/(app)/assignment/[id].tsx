import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModalSheet } from '@/components/ui/modal-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusPill } from '@/components/ui/status-pill';
import { TextField } from '@/components/ui/text-field';
import { Brand, Font, Radius, type ThemeColors } from '@/constants/theme';
import { useAssignment, useAssignmentUpload, useSubmitAssignment } from '@/hooks/use-assignments';
import { useThemedStyles, useTheme } from '@/hooks/use-theme';
import { htmlToText } from '@/lib/html';
import { ApiError } from '@/lib/api';
import type { AnswerDraft, AssignmentQuestion } from '@/types/api';

const MAX_FILES = 10;
/** config/training.php → uploads.max_mb */
const MAX_UPLOAD_MB = 20;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export default function AssignmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const router = useRouter();

  const { data: assignment, isLoading } = useAssignment(id);
  const submit = useSubmitAssignment(id);
  const upload = useAssignmentUpload(id);

  const submission = assignment?.submission;
  /** Answers are only editable before the first hand-in, or when it came back. */
  const editable = !submission || submission.can_resubmit;

  const [drafts, setDrafts] = useState<Record<number, AnswerDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ title: string; body: string } | null>(null);

  /** Previous answers are the starting point when resubmitting. */
  const seeded = useMemo(() => {
    if (Object.keys(drafts).length > 0 || !submission) return drafts;
    const next: Record<number, AnswerDraft> = {};
    for (const [questionId, answer] of Object.entries(submission.answers ?? {})) {
      next[Number(questionId)] = { text: answer.text, option_ids: answer.option_ids };
    }
    return next;
  }, [drafts, submission]);

  const set = (questionId: number, patch: Partial<AnswerDraft>) =>
    setDrafts((current) => ({ ...current, [questionId]: { ...seeded[questionId], ...patch } }));

  const pickFiles = async (question: AssignmentQuestion) => {
    const already = seeded[question.id]?.uploaded ?? [];

    // The API takes documents, spreadsheets, slides, images, audio and video
    // (config/training.php → uploads.mimes), so the picker isn't narrowed to
    // photos; the API rejects anything it doesn't want, with a message worth
    // showing.
    const picked = await File.pickFileAsync({ multipleFiles: true });
    if (picked.canceled) return;

    setError(null);
    const uploaded = [...already];
    const room = MAX_FILES - already.length;

    for (const file of picked.result.slice(0, Math.max(0, room))) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(`“${file.name}” is over ${MAX_UPLOAD_MB}MB.`);
        continue;
      }
      try {
        const stored = await upload.mutateAsync({
          uri: file.uri,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
        });
        uploaded.push(stored);
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : 'That file didn’t upload. Try again.');
        break;
      }
    }

    set(question.id, { uploaded });
  };

  const removeFile = (question: AssignmentQuestion, path: string) =>
    set(question.id, {
      uploaded: (seeded[question.id]?.uploaded ?? []).filter((file) => file.path !== path),
    });

  const handIn = async () => {
    setError(null);
    setFieldErrors({});
    try {
      const result = await submit.mutateAsync(seeded);
      const status = result.data.status;

      setDone(
        status === 'approved'
          ? {
              title: 'Great job! 🎉',
              body: result.tier_all_submitted
                ? 'That’s everything in this level handed in. Keep an eye out for your next level.'
                : 'Your answer was accepted. On to the next one.',
            }
          : status === 'rejected'
            ? {
                title: 'Not quite',
                body: `You got ${result.data.score ?? 0} of ${result.data.quiz_total ?? 0} right${
                  result.data.attempts_left ? `. ${result.data.attempts_left} attempt(s) left.` : '.'
                }`,
              }
            : {
                title: 'Handed in',
                body: 'Your work is with the D-LIORA team for review. You’ll be notified when it’s looked at.',
              },
      );
    } catch (cause) {
      if (cause instanceof ApiError) {
        setFieldErrors(
          Object.fromEntries(Object.entries(cause.errors).map(([key, messages]) => [key, messages[0]])),
        );
        setError(cause.message);
      } else {
        setError('Your work didn’t go through. Check your connection and try again.');
      }
    }
  };

  if (isLoading || !assignment) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Assignment" />
        <View style={styles.centred}>
          <ActivityIndicator color={Brand.gold} />
        </View>
      </View>
    );
  }

  if (assignment.locked) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Assignment" />
        <View style={styles.centred}>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Not open yet</Text>
            <Text style={styles.noticeText}>
              {assignment.locked_reason ?? 'Finish the lesson this assignment belongs to first.'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title={assignment.level_title ?? 'Assignment'} />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        bottomOffset={24}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            {assignment.number && assignment.of_total
              ? `ASSIGNMENT ${assignment.number} OF ${assignment.of_total}`
              : 'ASSIGNMENT'}
            {` · ${assignment.kind_label.toUpperCase()}`}
          </Text>
          <Text style={styles.title}>{assignment.title}</Text>
          {!!submission && (
            <View style={styles.statusRow}>
              <StatusPill
                tone={
                  submission.status === 'approved'
                    ? 'done'
                    : submission.status === 'pending' || submission.status === 'under_review'
                      ? 'pending'
                      : 'idle'
                }
                label={submission.status_label}
              />
              {submission.quiz_total ? (
                <Text style={styles.score}>
                  {submission.score ?? 0}/{submission.quiz_total} correct
                  {submission.required_correct ? ` · ${submission.required_correct} needed` : ''}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {!!assignment.description && <Text style={styles.body}>{htmlToText(assignment.description)}</Text>}

        {assignment.requirements.length > 0 && (
          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>What to include</Text>
            {assignment.requirements.map((requirement) => (
              <View key={requirement} style={styles.requirementRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={theme.link} />
                <Text style={styles.requirementText}>{requirement}</Text>
              </View>
            ))}
          </View>
        )}

        {!!assignment.lesson && (
          <Pressable
            style={styles.linkCard}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: assignment.lesson!.id } })}>
            <Ionicons name="play-circle-outline" size={20} color={theme.link} />
            <Text style={styles.linkText} numberOfLines={2}>
              Rewatch: {assignment.lesson.title}
            </Text>
            <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
          </Pressable>
        )}

        {!!submission?.review_notes && (
          <View style={styles.review}>
            <Text style={styles.reviewLabel}>The reviewer asked for changes</Text>
            <Text style={styles.reviewText}>{submission.review_notes}</Text>
          </View>
        )}

        {assignment.kind === 'quiz' && assignment.attempts_left !== null && (
          <Text style={styles.attempts}>
            {assignment.attempts_left > 0
              ? `${assignment.attempts_left} attempt${assignment.attempts_left === 1 ? '' : 's'} left${
                  assignment.required_correct
                    ? ` · ${assignment.required_correct} of ${assignment.quiz_questions} to pass`
                    : ''
                }`
              : 'No attempts left on this quiz.'}
          </Text>
        )}

        {assignment.questions.map((question) => (
          <Question
            key={question.id}
            question={question}
            draft={seeded[question.id] ?? {}}
            editable={editable}
            error={fieldErrors[`answers.${question.id}.text`] ?? fieldErrors[`uploaded.${question.id}`]}
            busy={upload.isPending}
            onChangeText={(text) => set(question.id, { text })}
            onToggleOption={(optionId) => {
              const picked = seeded[question.id]?.option_ids ?? [];
              const limit = question.max_choices ?? 1;
              const next =
                picked.includes(optionId)
                  ? picked.filter((value) => value !== optionId)
                  : limit === 1
                    ? [optionId]
                    : [...picked, optionId].slice(-limit);
              set(question.id, { option_ids: next });
            }}
            onPickFiles={() => pickFiles(question)}
            onRemoveFile={(path) => removeFile(question, path)}
            styles={styles}
            theme={theme}
          />
        ))}

        {!!error && <Text style={styles.error}>{error}</Text>}

        {editable ? (
          <PrimaryButton
            label={submission ? 'Resubmit' : 'Hand in'}
            loading={submit.isPending}
            disabled={upload.isPending}
            onPress={handIn}
          />
        ) : (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              {submission?.status === 'approved'
                ? 'This one is complete. Nice work.'
                : 'Your answers are with the D-LIORA team. You’ll hear back soon.'}
            </Text>
          </View>
        )}
      </KeyboardAwareScrollView>

      <ModalSheet
        visible={!!done}
        title={done?.title ?? ''}
        body={done?.body}
        actionLabel="Okay"
        onAction={() => {
          setDone(null);
          router.back();
        }}
      />
    </View>
  );
}

function Question({
  question,
  draft,
  editable,
  error,
  busy,
  onChangeText,
  onToggleOption,
  onPickFiles,
  onRemoveFile,
  styles,
  theme,
}: {
  question: AssignmentQuestion;
  draft: AnswerDraft;
  editable: boolean;
  error?: string;
  busy: boolean;
  onChangeText: (text: string) => void;
  onToggleOption: (optionId: number) => void;
  onPickFiles: () => void;
  onRemoveFile: (path: string) => void;
  styles: Styles;
  theme: ThemeColors;
}) {
  const picked = draft.option_ids ?? [];
  const files = draft.uploaded ?? [];
  const multiple = (question.max_choices ?? 1) > 1;

  return (
    <View style={styles.question}>
      <Text style={styles.questionNumber}>
        QUESTION {question.number} · {question.type_label.toUpperCase()}
      </Text>
      <Text style={styles.questionPrompt}>{question.prompt}</Text>
      {!!question.details && <Text style={styles.questionDetails}>{htmlToText(question.details)}</Text>}

      {question.type === 'text' && (
        <TextField
          label="Your answer"
          multiline
          value={draft.text ?? ''}
          onChangeText={onChangeText}
          editable={editable}
          error={error}
          placeholder="Type your answer…"
        />
      )}

      {question.options.length > 0 && (
        <View style={styles.options}>
          {multiple && (
            <Text style={styles.optionsHint}>Pick up to {question.max_choices} that apply.</Text>
          )}
          {question.options.map((option) => {
            const chosen = picked.includes(option.id);
            return (
              <Pressable
                key={option.id}
                disabled={!editable}
                accessibilityRole={multiple ? 'checkbox' : 'radio'}
                accessibilityState={{ checked: chosen, disabled: !editable }}
                onPress={() => onToggleOption(option.id)}
                style={[styles.option, chosen && styles.optionChosen]}>
                <Ionicons
                  name={
                    multiple
                      ? chosen
                        ? 'checkbox'
                        : 'square-outline'
                      : chosen
                        ? 'radio-button-on'
                        : 'radio-button-off'
                  }
                  size={19}
                  color={chosen ? Brand.goldDeep : theme.textMuted}
                />
                <Text style={[styles.optionLabel, chosen && styles.optionLabelChosen]}>{option.label}</Text>
              </Pressable>
            );
          })}
          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>
      )}

      {(question.type === 'file' || question.type === 'document') && (
        <View style={styles.files}>
          {!!question.template && (
            <Pressable
              onPress={() => Linking.openURL(question.template!.url)}
              accessibilityRole="button"
              style={styles.template}>
              <Ionicons name="download-outline" size={18} color={theme.link} />
              <View style={styles.templateCopy}>
                <Text style={styles.templateName} numberOfLines={1}>
                  {question.template.name}
                </Text>
                <Text style={styles.templateHint}>
                  Download it, fill it in, then upload it below
                  {question.template.size ? ` · ${Math.round(question.template.size / 1024)} KB` : ''}
                </Text>
              </View>
            </Pressable>
          )}
          {files.map((file) => (
            <View key={file.path} style={styles.fileRow}>
              <Ionicons name="document-outline" size={17} color={theme.link} />
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              {editable && (
                <Pressable onPress={() => onRemoveFile(file.path)} hitSlop={8} accessibilityRole="button">
                  <Ionicons name="close" size={17} color={theme.textMuted} />
                </Pressable>
              )}
            </View>
          ))}
          {editable && files.length < MAX_FILES && (
            <Pressable
              onPress={onPickFiles}
              disabled={busy}
              accessibilityRole="button"
              style={styles.uploadButton}>
              {busy ? (
                <ActivityIndicator color={theme.link} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color={theme.link} />
                  <Text style={styles.uploadLabel}>
                    {files.length > 0 ? 'Add another' : 'Upload a screenshot'}
                  </Text>
                  <Text style={styles.uploadHint}>
                    PDF, Word, images and more — up to {MAX_UPLOAD_MB}MB each
                  </Text>
                </>
              )}
            </Pressable>
          )}
          {!!error && <Text style={styles.error}>{error}</Text>}
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
    scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 18 },

    header: { gap: 6 },
    eyebrow: { fontFamily: Font.semibold, fontSize: 11.5, letterSpacing: 0.7, color: t.textMuted },
    title: { fontFamily: Font.bold, fontSize: 22, lineHeight: 29, color: t.text, letterSpacing: -0.4 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
    score: { fontFamily: Font.medium, fontSize: 13, color: t.textMuted },

    body: { fontFamily: Font.regular, fontSize: 15, lineHeight: 23, color: t.text },
    attempts: { fontFamily: Font.medium, fontSize: 13.5, color: t.textMuted },

    requirements: { padding: 16, gap: 8, borderRadius: Radius.field, backgroundColor: t.surface },
    requirementsTitle: { fontFamily: Font.semibold, fontSize: 15, color: t.text },
    requirementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    requirementText: { flex: 1, fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted },

    linkCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: Radius.field,
      backgroundColor: t.surface,
    },
    linkText: { flex: 1, fontFamily: Font.semibold, fontSize: 14.5, color: t.text },

    review: { padding: 14, gap: 4, borderRadius: Radius.field, backgroundColor: '#F7E7C4' },
    reviewLabel: { fontFamily: Font.semibold, fontSize: 13, color: '#8A6412' },
    reviewText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: '#8A6412' },

    question: { gap: 10, padding: 16, borderRadius: Radius.field, backgroundColor: t.surface },
    questionNumber: { fontFamily: Font.semibold, fontSize: 11, letterSpacing: 0.6, color: t.textMuted },
    questionPrompt: { fontFamily: Font.semibold, fontSize: 16, lineHeight: 23, color: t.text },
    questionDetails: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted },

    options: { gap: 8 },
    optionsHint: { fontFamily: Font.regular, fontSize: 12.5, color: t.textFaint },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 13,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surfaceRaised,
    },
    optionChosen: { borderColor: Brand.gold, backgroundColor: Brand.goldSoft },
    optionLabel: { flex: 1, fontFamily: Font.regular, fontSize: 14.5, lineHeight: 21, color: t.text },
    optionLabelChosen: { fontFamily: Font.semibold, color: Brand.goldDeep },

    files: { gap: 8 },
    template: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 13,
      borderRadius: 12,
      backgroundColor: t.surfaceRaised,
    },
    templateCopy: { flex: 1, gap: 2 },
    templateName: { fontFamily: Font.semibold, fontSize: 14, color: t.text },
    templateHint: { fontFamily: Font.regular, fontSize: 12.5, lineHeight: 18, color: t.textMuted },
    fileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: t.surfaceRaised,
    },
    fileName: { flex: 1, fontFamily: Font.medium, fontSize: 14, color: t.text },
    uploadButton: {
      alignItems: 'center',
      gap: 4,
      paddingVertical: 20,
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.border,
    },
    uploadLabel: { fontFamily: Font.semibold, fontSize: 14.5, color: t.link },
    uploadHint: { fontFamily: Font.regular, fontSize: 12, color: t.textFaint },

    notice: { padding: 18, gap: 6, borderRadius: Radius.field, backgroundColor: t.surface },
    noticeTitle: { fontFamily: Font.semibold, fontSize: 16, color: t.text, textAlign: 'center' },
    noticeText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: t.textMuted, textAlign: 'center' },
    error: { fontFamily: Font.medium, fontSize: 13.5, lineHeight: 20, color: t.danger },
  });
