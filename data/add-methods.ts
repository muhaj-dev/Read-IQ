import type { AppIconName } from '@/components/ui/app-icon';
import type { ThemeColor } from '@/constants/theme';

/** One of the four Add Note method cards (see the add-note mock). */
export type AddMethod = {
  key: 'paste' | 'upload' | 'scan' | 'record';
  title: string;
  description: string;
  icon: AppIconName;
  /** Icon colour token + the tinted circle behind it. */
  tint: ThemeColor;
  well: ThemeColor;
  href: '/add/paste' | '/add/upload' | '/add/scan' | '/add/record';
};

export const addMethods: AddMethod[] = [
  {
    key: 'paste',
    title: 'Paste Notes',
    description: 'Paste your text notes quickly',
    icon: 'content-paste',
    tint: 'methodPaste',
    well: 'methodPasteWell',
    href: '/add/paste',
  },
  {
    key: 'upload',
    title: 'Upload PDF',
    description: 'PDF files only for now',
    icon: 'picture-as-pdf',
    tint: 'methodUpload',
    well: 'methodUploadWell',
    href: '/add/upload',
  },
  {
    key: 'scan',
    title: 'Scan Page',
    description: 'Take a photo or upload an image',
    icon: 'document-scanner',
    tint: 'methodScan',
    well: 'methodScanWell',
    href: '/add/scan',
  },
  {
    key: 'record',
    title: 'Record Lecture',
    description: 'Record audio and get AI transcript',
    icon: 'mic',
    tint: 'methodRecord',
    well: 'methodRecordWell',
    href: '/add/record',
  },
];

export const addNoteTip = {
  title: 'Tip',
  body:
    'Uploading a note allows NoteIQ to generate structured study guides, ' +
    'flashcards, and concept maps in seconds.',
};
