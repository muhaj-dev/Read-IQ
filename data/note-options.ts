// Static rows for the Note Options screen (UI-first).

import type { AppIconName } from '@/components/ui/app-icon';

export type NoteOption = {
  key: string;
  icon: AppIconName;
  title: string;
  subtitle?: string;
  /** 'chevron' rows navigate, 'toggle' renders a switch, 'danger' is red. */
  kind: 'chevron' | 'toggle' | 'danger';
};

export const noteOptions: NoteOption[] = [
  { key: 'share', icon: 'share', title: 'Share Note', subtitle: 'Share with others', kind: 'chevron' },
  { key: 'export', icon: 'file-upload', title: 'Export Note', subtitle: 'PDF, Text, or Markdown', kind: 'chevron' },
  { key: 'duplicate', icon: 'content-copy', title: 'Duplicate Note', subtitle: 'Create a copy', kind: 'chevron' },
  { key: 'move', icon: 'folder', title: 'Move to Folder', subtitle: 'Organize your notes', kind: 'chevron' },
  { key: 'favorite', icon: 'star', title: 'Add to Favorites', kind: 'toggle' },
  { key: 'summary', icon: 'auto-awesome', title: 'AI Summary', subtitle: 'Regenerate summary', kind: 'chevron' },
  { key: 'delete', icon: 'delete', title: 'Delete Note', subtitle: 'Permanently delete', kind: 'danger' },
];
