// Student profile + study metrics shown on Dashboard/Profile. Persisted to AsyncStorage.

export type UserProfile = {
  /** From onboarding. Empty until they tell us. */
  name: string;
  /** Contact email — collected in onboarding, editable on the profile. */
  email: string;
  /** Course / exam they're revising for, e.g. "Computer Science". */
  studyingFor: string;
  /** Personal goal, e.g. "Pass my finals". Shown on the profile. */
  goal: string;
  /** Consecutive days the student has opened the app (drives the streak flame). */
  streak: number;
  /** Grounded answers the Ask ★ chat has given — a real, persisted count. */
  aiAnswers: number;
  /** Local YYYY-MM-DD of the last active day; null until the first activity. */
  lastActiveDate: string | null;
  /** ISO timestamp of first launch — the anchor for semester progress. */
  createdAt: string;
};

/** What the onboarding About screen writes — the rest is filled in by the store. */
export type ProfileInput = {
  name?: string;
  email?: string;
  studyingFor?: string;
  goal?: string;
};
