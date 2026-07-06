// Static content for the Settings + Data & Privacy screens (UI-first).

import type { AppIconName } from '@/components/ui/app-icon';

export type SettingsRowItem = {
  key: string;
  icon: AppIconName;
  title: string;
  /** Current value shown before the chevron ('Light', 'English', …). */
  value?: string;
  subtitle?: string;
  /** 'chevron' rows navigate or pick, 'toggle' renders a switch. */
  kind: 'chevron' | 'toggle';
};

export type SettingsSectionData = {
  key: string;
  label: string;
  rows: SettingsRowItem[];
};

export const settingsSections: SettingsSectionData[] = [
  {
    key: 'general',
    label: 'General',
    rows: [
      { key: 'appearance', icon: 'settings-brightness', title: 'Appearance', value: 'Light', kind: 'chevron' },
      { key: 'language', icon: 'language', title: 'Language', value: 'English', kind: 'chevron' },
      { key: 'subject', icon: 'school', title: 'Default Subject', value: 'Computer Science', kind: 'chevron' },
    ],
  },
  {
    key: 'study',
    label: 'Study',
    rows: [
      { key: 'goal', icon: 'timer', title: 'Daily Study Goal', value: '2 hours', kind: 'chevron' },
      { key: 'focus', icon: 'center-focus', title: 'Focus Mode', subtitle: 'Block distractions', kind: 'toggle' },
    ],
  },
  {
    key: 'ai',
    label: 'AI Settings',
    rows: [
      // `value` is filled at render from the selected model (see settings/index).
      { key: 'model', icon: 'smart-toy', title: 'AI Model', kind: 'chevron' },
      { key: 'style', icon: 'edit-note', title: 'Answer Style', value: 'Detailed', kind: 'chevron' },
    ],
  },
  {
    key: 'privacy',
    label: 'Privacy',
    rows: [{ key: 'data-privacy', icon: 'shield', title: 'Data & Privacy', kind: 'chevron' }],
  },
];

export type PrivacyAction = {
  key: string;
  icon: AppIconName;
  title: string;
  subtitle?: string;
  /** Trailing detail before the chevron (Clear Cache's '245 MB'). */
  value?: string;
  /** 'danger' renders the red Delete Account treatment. */
  tone: 'default' | 'danger';
};

export type PrivacyActionGroup = {
  key: string;
  actions: PrivacyAction[];
};

export const privacyActionGroups: PrivacyActionGroup[] = [
  {
    key: 'data',
    actions: [
      { key: 'export', icon: 'download', title: 'Export My Data', subtitle: 'Download all your data', tone: 'default' },
      { key: 'import', icon: 'upload', title: 'Import Notes', subtitle: 'Import from other apps', tone: 'default' },
      { key: 'cache', icon: 'delete', title: 'Clear Cache', subtitle: 'Free up storage space', value: '245 MB', tone: 'default' },
    ],
  },
  {
    key: 'legal',
    actions: [
      { key: 'policy', icon: 'policy', title: 'Privacy Policy', tone: 'default' },
      { key: 'terms', icon: 'description', title: 'Terms of Service', tone: 'default' },
    ],
  },
  {
    key: 'danger',
    actions: [
      {
        key: 'delete-account',
        icon: 'delete-forever',
        title: 'Delete Account',
        subtitle: 'Permanently delete your account',
        tone: 'danger',
      },
    ],
  },
];
