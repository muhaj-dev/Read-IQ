// Resolves the Add-Deadline bottom-sheet: given which field is open, it returns
// the option list, the current selection, and how a pick patches the draft.
// Kept out of the screen so the screen stays a thin composition.

import type { SheetOption } from '@/components/form/option-sheet';
import { pickerOptions, type DeadlineDraft } from '@/data/deadlines';
import {
  dateChoices,
  formatDateLabel,
  formatTimeLabel,
  TIME_CHOICES,
} from '@/lib/deadline-view';

/** Which draft field the open sheet edits. */
export type DeadlineSheetKey = 'subject' | 'type' | 'reminder' | 'repeat' | 'date' | 'time';

export type SheetConfig = {
  options: SheetOption[];
  selected: string;
  /** The draft patch to apply when `label` is chosen. */
  patchFor: (label: string) => Partial<DeadlineDraft>;
};

const EMPTY: SheetConfig = { options: [], selected: '', patchFor: () => ({}) };

export function sheetFor(sheet: DeadlineSheetKey | null, draft: DeadlineDraft): SheetConfig {
  if (sheet === 'date') {
    const opts = dateChoices();
    return {
      options: opts.map((o) => ({ label: o.label })),
      selected: formatDateLabel(draft.dateValue),
      patchFor: (label) => {
        const choice = opts.find((o) => o.label === label);
        return choice ? { dateValue: choice.value } : {};
      },
    };
  }
  if (sheet === 'time') {
    return {
      options: TIME_CHOICES.map((o) => ({ label: o.label })),
      selected: formatTimeLabel(draft.timeValue),
      patchFor: (label) => {
        const choice = TIME_CHOICES.find((o) => o.label === label);
        return choice ? { timeValue: choice.value } : {};
      },
    };
  }
  if (sheet === 'subject' || sheet === 'type' || sheet === 'reminder' || sheet === 'repeat') {
    return {
      options: pickerOptions[sheet],
      selected: draft[sheet],
      patchFor: (label) => ({ [sheet]: label }) as Partial<DeadlineDraft>,
    };
  }
  return EMPTY;
}
