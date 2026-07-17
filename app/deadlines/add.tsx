import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ColorRow } from '@/components/deadlines/color-row';
import { DateTimeRow } from '@/components/deadlines/date-time-row';
import { FormField } from '@/components/form/form-field';
import { FormHeader } from '@/components/form/form-header';
import { FormInput } from '@/components/form/form-input';
import { OptionSheet } from '@/components/form/option-sheet';
import { SelectRow } from '@/components/form/select-row';
import { createEmptyDraft } from '@/data/deadlines';
import { type DeadlineSheetKey, sheetFor } from '@/lib/deadline-form';
import { combineDue, formatDateLabel, formatTimeLabel, toDateValue } from '@/lib/deadline-view';
import { useTheme } from '@/hooks/use-theme';
import { useDeadlinesStore } from '@/store/use-deadlines-store';

/** ADD DEADLINE — form per the mock. Saving persists a real deadline to SQLite. */
export default function AddDeadlineScreen() {
  const colors = useTheme();
  const router = useRouter();
  const addDeadline = useDeadlinesStore((s) => s.addDeadline);

  // Default the due date to tomorrow, derived from the real clock.
  const tomorrow = useMemo(() => {
    const now = new Date();
    return toDateValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  }, []);
  const [draft, setDraft] = useState(() => createEmptyDraft(tomorrow));
  const [sheet, setSheet] = useState<DeadlineSheetKey | null>(null);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const close = () => (router.canGoBack() ? router.back() : router.navigate('/deadlines'));

  const save = async () => {
    if (!draft.title.trim()) {
      Alert.alert('Add a title', 'Give your deadline a name so you can recognise it.');
      return;
    }
    await addDeadline({
      title: draft.title,
      subject: draft.subject,
      type: draft.type,
      dueDate: combineDue(draft.dateValue, draft.timeValue),
      reminderOn: draft.reminder !== 'No reminder',
      reminderLabel: draft.reminder,
      repeat: draft.repeat,
      notes: draft.notes,
      colorIndex: draft.colorIndex,
    });
    close();
  };

  const config = sheetFor(sheet, draft);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <FormHeader title="Add Deadline" onBack={close} onSave={save} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}>
          <FormField label="Title">
            <FormInput value={draft.title} onChangeText={(v) => set('title', v)} placeholder="e.g. Biochemistry Exam" />
          </FormField>

          <FormField label="Subject">
            <SelectRow value={draft.subject} dotColor={colors.secondaryContainer} onPress={() => setSheet('subject')} />
          </FormField>

          <FormField label="Type">
            <SelectRow value={draft.type} onPress={() => setSheet('type')} />
          </FormField>

          <FormField label="Due Date">
            <DateTimeRow
              date={formatDateLabel(draft.dateValue)}
              time={formatTimeLabel(draft.timeValue)}
              onDatePress={() => setSheet('date')}
              onTimePress={() => setSheet('time')}
            />
          </FormField>

          <FormField label="Reminder">
            <SelectRow value={draft.reminder} onPress={() => setSheet('reminder')} />
          </FormField>

          <FormField label="Repeat">
            <SelectRow value={draft.repeat} onPress={() => setSheet('repeat')} />
          </FormField>

          <FormField label="Notes">
            <FormInput multiline value={draft.notes} onChangeText={(v) => set('notes', v)} placeholder="Anything to remember?" />
          </FormField>

          <View className="pt-2">
            <FormField label="Color">
              <ColorRow selectedIndex={draft.colorIndex} onSelect={(i) => set('colorIndex', i)} />
            </FormField>
          </View>
        </ScrollView>
      </SafeAreaView>

      <OptionSheet
        visible={sheet !== null}
        options={config.options}
        selected={config.selected}
        onSelect={(label) => {
          setDraft((d) => ({ ...d, ...sheetFor(sheet, d).patchFor(label) }));
          setSheet(null);
        }}
        onCancel={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },
});
