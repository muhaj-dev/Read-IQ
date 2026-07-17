import { OptionSheet, type SheetOption } from '@/components/form/option-sheet';
import { QUIZ_COUNT_OPTIONS } from '@/lib/quiz-sources';
import type { QuizCount } from '@/types/quiz';

type Props = {
  visible: boolean;
  /** Currently-highlighted count (shows the check). */
  selected: QuizCount;
  onSelect: (count: QuizCount) => void;
  onCancel: () => void;
};

/** Map "10" ⇄ "10 questions" so the shared OptionSheet can drive the picker. */
function labelFor(count: QuizCount): string {
  return `${count} questions`;
}

const OPTIONS: SheetOption[] = QUIZ_COUNT_OPTIONS.map((c) => ({ label: labelFor(c) }));

/** "How many questions?" sheet shown before a subject quiz starts (10 or 20). */
export function QuizCountSheet({ visible, selected, onSelect, onCancel }: Props) {
  const onPick = (label: string) => {
    const count = QUIZ_COUNT_OPTIONS.find((c) => labelFor(c) === label);
    if (count) onSelect(count);
  };

  return (
    <OptionSheet
      visible={visible}
      options={OPTIONS}
      selected={labelFor(selected)}
      onSelect={onPick}
      onCancel={onCancel}
    />
  );
}
