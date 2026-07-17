import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form/form-field';
import { FormHeader } from '@/components/form/form-header';
import { FormInput } from '@/components/form/form-input';
import { OptionSheet } from '@/components/form/option-sheet';
import { SelectRow } from '@/components/form/select-row';
import { AttachmentsField } from '@/components/note/attachments-field';
import { RichContentEditor } from '@/components/note/rich-content-editor';
import { TagChipRow } from '@/components/note/tag-chip-row';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { htmlToPlainText, plainTextToHtml, splitHardBreaks } from '@/lib/rich-text';
import { useSubjectsStore } from '@/store/use-subjects-store';
import type { NoteAttachment } from '@/types/note';

/** The editable note draft shared by Add Note, Add Document, and Edit Note. */
export type NoteFormValues = {
  title: string;
  subject: string;
  tags: string[];
  /** Plain-text projection of the content — the grounding source of truth. */
  content: string;
  /** Rich HTML from the editor (bold, inline images). */
  contentHtml: string;
  attachments: NoteAttachment[];
};

type Props = {
  /** Header title — "Add Note", "Add Document", or "Edit Note". */
  headerTitle: string;
  initial: NoteFormValues;
  onBack: () => void;
  /** Receives the edited draft so the caller can persist it. */
  onSave: (values: NoteFormValues) => void;
  /** Optional footer slot (Edit Note uses it for Delete Note). */
  footer?: ReactNode;
  /** Show Attachments at the top (Add Document) instead of after the content. */
  attachmentsFirst?: boolean;
  /** Hide the Content editor (Add Document); extracted text still flows to onSave. */
  hideContent?: boolean;
};

/** The note editor: title, subject, tags, WYSIWYG content, and attachments. */
export function NoteForm({ headerTitle, initial, onBack, onSave, footer, attachmentsFirst, hideContent }: Props) {
  const colors = useTheme();
  const subjects = useSubjectsStore((s) => s.subjects);
  const addSubject = useSubjectsStore((s) => s.addSubject);

  const [title, setTitle] = useState(initial.title);
  const [subject, setSubject] = useState(initial.subject);
  const [tags, setTags] = useState(initial.tags);
  const [attachments, setAttachments] = useState(initial.attachments);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [titleError, setTitleError] = useState(false);

  // Capture opening HTML once (wrap legacy text, split hard breaks); never fed back or the editor resets.
  const initialHtml = useRef(
    initial.contentHtml ? splitHardBreaks(initial.contentHtml) : plainTextToHtml(initial.content)
  ).current;
  const [contentHtml, setContentHtml] = useState(initialHtml);

  const subjectOptions = useMemo(() => subjects.map((label) => ({ label })), [subjects]);

  const addTag = (tag: string) => setTags((now) => (now.includes(tag) ? now : [...now, tag]));

  // Title is required — clear the error as soon as the student starts a name.
  const changeTitle = (text: string) => {
    setTitle(text);
    if (titleError && text.trim()) setTitleError(false);
  };

  const pickSubject = (label: string) => {
    setSubject(label);
    setSheetOpen(false);
  };

  const createSubject = async (name: string) => {
    const finalName = await addSubject(name);
    if (finalName) pickSubject(finalName);
  };

  const submit = () => {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    onSave({ title, subject, tags, content: htmlToPlainText(contentHtml), contentHtml, attachments });
  };

  const attachmentsSection = (
    <FormField label="Attachments">
      <AttachmentsField
        attachments={attachments}
        onAdd={(added) => setAttachments((now) => [...now, ...added])}
        onRemove={(id) => setAttachments((now) => now.filter((a) => a.id !== id))}
      />
    </FormField>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView takes no className; the editor handles its own keyboard avoidance. */}
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <FormHeader title={headerTitle} onBack={onBack} onSave={submit} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}>
          {attachmentsFirst ? attachmentsSection : null}

          <FormField label="Title">
            <FormInput value={title} onChangeText={changeTitle} placeholder="Note title" error={titleError} />
            {titleError ? (
              <Text style={[styles.error, { color: colors.error }]}>
                Give your note a title before saving.
              </Text>
            ) : null}
          </FormField>

          <FormField label="Subject">
            <SelectRow value={subject} dotColor={colors.noteGreen} onPress={() => setSheetOpen(true)} />
          </FormField>

          <FormField label="Tags">
            <TagChipRow tags={tags} onAdd={addTag} />
          </FormField>

          {hideContent ? null : (
            <FormField label="Content">
              <RichContentEditor initialHtml={initialHtml} onChangeHtml={setContentHtml} />
            </FormField>
          )}

          {attachmentsFirst ? null : attachmentsSection}

          {footer ? <View className="pb-2 pt-6">{footer}</View> : null}
        </ScrollView>
      </SafeAreaView>

      <OptionSheet
        visible={sheetOpen}
        options={subjectOptions}
        selected={subject}
        onSelect={pickSubject}
        onCancel={() => setSheetOpen(false)}
        onAddOption={createSubject}
        addLabel="Add subject or course"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  error: {
    marginLeft: 4,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodyRegular,
  },
});
