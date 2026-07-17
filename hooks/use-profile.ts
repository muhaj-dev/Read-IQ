// Profile view-model — identity block + the same study stats the dashboard shows.

import type { ProfileStat } from '@/data/profile';
import { useNotesStore } from '@/store/use-notes-store';
import { useUserStore } from '@/store/use-user-store';
import type { ProfileInput } from '@/types/user';

/** Raw editable fields, seeded into the inline edit form. */
export type ProfileForm = { name: string; email: string; studyingFor: string; goal: string };

export type ProfileModel = {
  user: { name: string; email: string; goal: string; role: string };
  stats: ProfileStat[];
  /** Current values to seed the edit form. */
  form: ProfileForm;
  /** Persist edited profile fields (name / course / goal). */
  save: (fields: ProfileInput) => Promise<void>;
};

/** "Computer Science" → "Computer Science Student"; already-a-role stays as typed. */
function roleFrom(studyingFor: string): string {
  const s = studyingFor.trim();
  if (!s) return 'Student';
  return /student/i.test(s) ? s : `${s} Student`;
}

export function useProfile(): ProfileModel {
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const noteCount = useNotesStore((s) => s.notes.length);

  return {
    user: {
      name: profile.name.trim() || 'Student',
      email: profile.email.trim(),
      goal: profile.goal.trim(),
      role: roleFrom(profile.studyingFor),
    },
    stats: [
      { value: String(noteCount), label: 'Notes' },
      { value: String(profile.aiAnswers), label: 'AI Answers' },
      { value: String(profile.streak), label: 'Day Streak' },
    ],
    form: {
      name: profile.name,
      email: profile.email,
      studyingFor: profile.studyingFor,
      goal: profile.goal,
    },
    save: setProfile,
  };
}
