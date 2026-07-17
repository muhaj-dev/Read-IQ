// App colours, defined for light and dark mode.

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    textMuted: '#A1A7B3',
    accent: '#5b5bd6',
    // Splash background gradient stops (top → bottom)
    splashTop: '#FFFFFF',
    splashMid: '#F5F7FF',
    splashBottom: '#E8EDFF',
    // "note" wordmark ink
    brandInk: '#0E1130',
    // Loading bar
    loadingTrack: '#D5DCFB',
    loadingFill: '#3E5BF6',

    // ── Main-app tokens (Material-3 indigo, from the dashboard mock) ──
    surface: '#f9f9ff', // screen background
    surfaceLowest: '#ffffff', // cards (stats, deadlines list)
    surfaceLow: '#f0f3ff', // card borders / subtle wells
    surfaceContainer: '#e7eeff', // streak pill, icon wells, neutral chips
    surfaceVariant: '#d8e3fb', // "later" deadline badge, avatar well
    onSurface: '#111c2d', // headings + primary text
    onSurfaceVariant: '#464652', // secondary text, inactive tabs
    outline: '#777683', // muted — timestamps, input placeholders (Ask screen)
    outlineVariant: '#c7c5d4', // hairlines and borders (use withAlpha)
    primary: '#15157d', // deep indigo — name, stat values, badges
    primaryDeep: '#2e3192', // quiz-score stat value (lifted in dark mode)
    primaryContainer: '#2e3192', // progress card bg, active tab pill
    onPrimary: '#ffffff', // text/icons on indigo fills
    secondary: '#4648d4', // "AI Answers" stat, "View all" links
    secondaryContainer: '#6063ee', // practice CTA card bg, user chat bubble
    secondaryFixed: '#e1e0ff', // "From your notes" source-card tint (use withAlpha)
    fab: '#4648d4', // raised center Add button
    error: '#ba1a1a', // due-today deadline, weak topic chips
    errorContainer: '#ffdad6', // soft red fills (use withAlpha)
    onErrorContainer: '#93000a', // ink on errorContainer (Delete Account subtitle)
    flame: '#f97316', // streak flame
    shadow: '#2e3192', // soft indigo card shadows

    // ── Add Note flow (from the add-note mocks) ──
    onPrimaryContainer: '#9da1ff', // icons/text on primaryContainer fills
    methodPaste: '#2563eb', // Paste Notes card icon
    methodPasteWell: '#eff6ff', // …and its circle
    methodUpload: '#16a34a', // Upload PDF card icon
    methodUploadWell: '#f0fdf4',
    methodScan: '#d97706', // Scan Page card icon
    methodScanWell: '#fffbeb',
    methodRecord: '#9333ea', // Record Lecture card icon
    methodRecordWell: '#faf5ff',

    // ── Memory panel (from the memory mock) ──
    surfaceContainerHigh: '#dee8ff', // neutral note-tile well (text notes)
    noteGreen: '#1e8e3e', // Drive-style file tints on note tiles
    noteGreenWell: '#e6f4ea',
    noteAmber: '#f9ab00',
    noteAmberWell: '#fef7e0',
    noteRed: '#d93025',
    noteRedWell: '#fce8e6',

    // ── Quiz flow (from the quiz mock — green success states) ──
    quizCorrect: '#22c55e', // correct-option border + Next Question button
    quizCorrectBg: '#f0fdf4', // correct-option card fill
    quizCorrectWell: '#bbf7d0', // correct letter circle + button shadow
    quizCorrectInk: '#166534', // correct letter
    quizCorrectText: '#14532d', // correct option label
    quizCheck: '#16a34a', // correct check icon + "Great job!" text
    quizSparkle: '#eab308', // feedback sparkle icon

    // ── Deadlines (from the deadlines mock) ──
    dueSoon: '#ea580c', // "1 day left" status label (between due-today red and later indigo)

    // ── Note Details (Key Topics chips — soft bg / dark ink / pale border) ──
    topicGreenBg: '#f0fdf4',
    topicGreenInk: '#166534',
    topicGreenBorder: '#dcfce7',
    topicRedBg: '#fef2f2',
    topicRedInk: '#991b1b',
    topicRedBorder: '#fee2e2',
    topicAmberBg: '#fffbeb',
    topicAmberInk: '#92400e',
    topicAmberBorder: '#fef3c7',
    topicBlueBg: '#eff6ff',
    topicBlueInk: '#1e40af',
    topicBlueBorder: '#dbeafe',

    // ── Profile (from the profile mock — an indigo "glass" panel) ──
    // The panel gradient is brand-fixed indigo (same hues as primary/primaryDeep).
    profileTop: '#15157d', // gradient start (screen top)
    profileBottom: '#2e3192', // gradient end (screen bottom)
    onPrimarySoft: '#c0c1ff', // lavender secondary text/icons on the indigo panel
    menuGreen: '#16a34a', // Study Sessions row icon
    menuGreenWell: '#dcfce7', // …and its rounded well
    menuBlue: '#2563eb', // Quiz Performance row icon
    menuBlueWell: '#dbeafe',
    menuOrange: '#ea580c', // Achievements row icon
    menuOrangeWell: '#ffedd5',
    menuSlate: '#475569', // Settings row icon
    menuSlateWell: '#f1f5f9',
    menuPurple: '#9333ea', // Help & Support row icon
    menuPurpleWell: '#f3e8ff',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    textMuted: '#6B7280',
    accent: '#7c7cf0',
    // Splash background gradient stops (top → bottom)
    splashTop: '#161624',
    splashMid: '#111119',
    splashBottom: '#0C0C14',
    // "note" wordmark ink
    brandInk: '#F4F4F8',
    // Loading bar
    loadingTrack: '#2A2A4A',
    loadingFill: '#7C7CF0',

    // ── Main-app tokens (Material-3 dark counterparts of the mock) ──
    surface: '#12121f',
    surfaceLowest: '#0d0d17',
    surfaceLow: '#1a1a28',
    surfaceContainer: '#1e1e2e',
    surfaceVariant: '#2b2b3d',
    onSurface: '#e4e1f0',
    onSurfaceVariant: '#c6c4d6',
    outline: '#91909f',
    outlineVariant: '#45455a',
    primary: '#c0c1ff',
    primaryDeep: '#9da1ff',
    primaryContainer: '#373a9b',
    onPrimary: '#ffffff',
    secondary: '#bfc0ff',
    secondaryContainer: '#4648d4',
    secondaryFixed: '#e1e0ff', // M3 "fixed" colours keep the same value in dark mode
    fab: '#5a5cf0',
    error: '#ffb4ab',
    errorContainer: '#93000a',
    onErrorContainer: '#ffdad6',
    flame: '#fb923c',
    shadow: '#000000',

    // ── Add Note flow (dark counterparts) ──
    onPrimaryContainer: '#e1e0ff',
    methodPaste: '#60a5fa',
    methodPasteWell: '#172554',
    methodUpload: '#4ade80',
    methodUploadWell: '#052e16',
    methodScan: '#fbbf24',
    methodScanWell: '#451a03',
    methodRecord: '#c084fc',
    methodRecordWell: '#3b0764',

    // ── Memory panel (dark counterparts) ──
    surfaceContainerHigh: '#252534',
    noteGreen: '#4ade80',
    noteGreenWell: '#052e16',
    noteAmber: '#fbbf24',
    noteAmberWell: '#451a03',
    noteRed: '#f87171',
    noteRedWell: '#450a0a',

    // ── Quiz flow (dark counterparts) ──
    quizCorrect: '#4ade80',
    quizCorrectBg: '#052e16',
    quizCorrectWell: '#14532d',
    quizCorrectInk: '#bbf7d0',
    quizCorrectText: '#dcfce7',
    quizCheck: '#4ade80',
    quizSparkle: '#facc15',

    // ── Deadlines (dark counterpart) ──
    dueSoon: '#fb923c',

    // ── Note Details (dark counterparts — dark wells / light ink) ──
    topicGreenBg: '#052e16',
    topicGreenInk: '#86efac',
    topicGreenBorder: '#14532d',
    topicRedBg: '#450a0a',
    topicRedInk: '#fca5a5',
    topicRedBorder: '#7f1d1d',
    topicAmberBg: '#451a03',
    topicAmberInk: '#fcd34d',
    topicAmberBorder: '#78350f',
    topicBlueBg: '#172554',
    topicBlueInk: '#93c5fd',
    topicBlueBorder: '#1e3a8a',

    // ── Profile (dark counterparts — the indigo panel keeps its brand hues) ──
    profileTop: '#15157d',
    profileBottom: '#2e3192',
    onPrimarySoft: '#c0c1ff',
    menuGreen: '#4ade80',
    menuGreenWell: '#052e16',
    menuBlue: '#60a5fa',
    menuBlueWell: '#172554',
    menuOrange: '#fb923c',
    menuOrangeWell: '#431407',
    menuSlate: '#94a3b8',
    menuSlateWell: '#1e293b',
    menuPurple: '#c084fc',
    menuPurpleWell: '#3b0764',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** The colour object returned by useTheme() — light or dark token set. */
export type ColorTokens = (typeof Colors)[keyof typeof Colors];

/** Brand gradient (blue → purple), theme-independent. */
export const Brand = {
  gradientStart: '#3B4DF5', // royal blue
  gradientEnd: '#8B33E8', // violet
} as const;

/** Onboarding design tokens (always light, single set). */
export const Onboard = {
  surface: '#f9f9ff', // screen background (welcome / first-note)
  surfaceLowest: '#ffffff', // about screen background, cards, inactive chips
  surfaceLow: '#f0f3ff', // text inputs, check-circle well
  surfaceContainer: '#e7eeff', // value-prop icon circles
  surfaceVariant: '#d8e3fb', // progress track, active chip, note icon well
  onSurface: '#111c2d', // headings + primary text
  onSurfaceVariant: '#464652', // body / secondary text
  outline: '#777683', // muted labels ("3 / 3", timestamps)
  outlineVariant: '#c7c5d4', // input placeholders
  border: '#c7c5d466', // outlineVariant @40% — chip & card borders
  borderFaint: '#c7c5d433', // outlineVariant @20% — footer hairline
  primary: '#15157d', // progress fill, active chip text, Save button
  primaryContainer: '#2e3192', // Get Started / Continue buttons + shadows
  secondary: '#4648d4', // value-prop icons
  secondaryContainer: '#6063ee', // input focus border
  onPrimary: '#ffffff',
  success: '#059669', // saved-note check
} as const;

/** Highlighter colour in the rich note editor — fixed, theme-independent. */
export const EditorHighlight = '#FEF08A' as const;

/** Ink for text on the marker-yellow highlight — fixed dark in both themes. */
export const EditorHighlightInk = '#1f2430' as const;

/** Font-colour swatches for the note editor's text-colour picker. Fixed in both themes. */
export const EditorTextColors = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
] as const;

/** Reader highlighter swatches; first entry is the default. Fixed in both themes. */
export const ReaderHighlights = [
  '#FEF08A', // yellow
  '#BBF7D0', // green
  '#BFDBFE', // blue
  '#FBCFE8', // pink
  '#FED7AA', // orange
] as const;

/** Deadline marker colours the student picks per deadline — fixed in both themes. */
export const DeadlineMarkers = [
  '#FF5252', // red
  '#FF9100', // orange
  '#FFD600', // yellow
  '#00E676', // green
  '#00B0FF', // light blue
  '#651FFF', // purple
] as const;

/** Scan Page viewfinder chrome — dark in both themes, single set. */
export const CameraChrome = {
  background: '#000000',
  topBar: '#00000066', // header scrim (black @40%)
  bottomBar: '#00000099', // controls scrim (black @60%)
  frame: '#ffffff4d', // frosted viewfinder border (white @30%, per the scan mock)
  bracket: '#ffffff99', // corner brackets (white @60%)
  controlWell: '#ffffff1a', // gallery / flash buttons (white @10%)
  controlBorder: '#ffffff33', // gallery button border (white @20%)
  shutter: '#ffffff',
  shutterRing: '#ffffff4d', // outer ring (white @30%)
  shutterInner: '#0000000d', // inner hairline (black @5%)
  icon: '#ffffff',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
