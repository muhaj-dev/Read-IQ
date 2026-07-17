import type { AppIconName } from '@/components/ui/app-icon';

// Static account menu for Profile (identity + stats come from hooks/use-profile.ts).

export type ProfileMenuTone = 'green' | 'blue' | 'orange' | 'slate' | 'purple';

export type ProfileStat = {
  value: string;
  label: string;
};

/** Where a menu row navigates. Subtitles are filled live in hooks/use-profile-menu.ts. */
export type ProfileMenuHref =
  | '/settings'
  | '/settings/achievements'
  | '/profile/quiz-performance'
  | '/profile/study-sessions';

export type ProfileMenuItem = {
  id: string;
  icon: AppIconName;
  tone: ProfileMenuTone;
  title: string;
  subtitle?: string;
  /** Destination when tapped. Rows without one land in later phases. */
  href?: ProfileMenuHref;
};

export const profile = {
  // Static template — the live subtitles come from hooks/use-profile-menu.ts.
  menu: [
    {
      id: 'study-sessions',
      icon: 'history-edu',
      tone: 'green',
      title: 'Study Sessions',
      href: '/profile/study-sessions',
    },
    {
      id: 'quiz-performance',
      icon: 'analytics',
      tone: 'blue',
      title: 'Quiz Performance',
      href: '/profile/quiz-performance',
    },
    {
      id: 'achievements',
      icon: 'trophy',
      tone: 'orange',
      title: 'Achievements',
      href: '/settings/achievements',
    },
    { id: 'settings', icon: 'settings', tone: 'slate', title: 'Settings', href: '/settings' },
    { id: 'help', icon: 'help', tone: 'purple', title: 'Help & Support' },
  ] satisfies ProfileMenuItem[],
};
