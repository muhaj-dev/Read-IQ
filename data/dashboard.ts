import type { AppIconName } from '@/components/ui/app-icon';

// View types for the dashboard cards (values derived in hooks/use-dashboard.ts).

export type StatTone = 'primary' | 'secondary' | 'deep';

export type DashboardStat = {
  value: string;
  label: string;
  tone: StatTone;
};

export type DeadlineUrgency = 'today' | 'soon' | 'later';

export type DashboardDeadline = {
  id: string;
  title: string;
  when: string;
  badge: string;
  icon: AppIconName;
  urgency: DeadlineUrgency;
};

export type WeakTopic = {
  label: string;
  /** Frequently failed → red warning chip; otherwise a neutral chip. */
  weak: boolean;
};
