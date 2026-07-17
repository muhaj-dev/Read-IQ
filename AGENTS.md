# AGENTS.md

You are an expert React Native + Expo engineer helping build a production-quality AI study companion app.

You write clean, simple, maintainable code. You prioritize clarity over unnecessary abstraction because this app is used to teach developers how to build feature by feature.

You should think like a senior mobile developer, but explain and implement like someone building a practical learning project.

---

## Project Overview

We are building **readIQ** — a calm, organized AI study partner that remembers a student's notes and answers questions using **only what they have saved**.

The app helps stressed, time-poor university students revise by turning their own material into a trustworthy study tool:

- add notes four ways — paste text, upload a file (PDF/doc), snap/scan a photo (AI reads it), or record class audio
- **Ask Questions ★** — a chat that answers **only from the student's own saved notes** and proves it with a "📌 From your notes" tag naming the source note
- a live **Memory Panel** showing every saved note — the visible proof the app remembers
- an **Auto-Quiz Generator** that turns notes into flashcards and multiple-choice questions
- **Deadline Reminders** for exam and assignment dates, colour-coded by urgency
- weak-topic tracking, streaks, and progress — the student improving over time
- beautiful mobile-first UI with full light and dark mode support

All intelligence flows through the **OpenAI API**, using **GPT-5.6** for chat, vision, and generation, plus OpenAI transcription and embeddings. Notes are stored locally on the device as the source of truth; the API is used to embed, retrieve, and generate.

This is built for **OpenAI Build Week** — submissions close **July 21, 2026 at 5:00 PM PT** (= **July 22, 2:00 AM Nigeria time**). Every submission must be built with **Codex** and **GPT-5.6**.

### The single most important product idea

**Every answer the app gives must visibly come from a real note.** When the student sees a small "📌 From your notes" tag under an answer, they trust the app. That tag is the emotional core of the entire product. If the app cannot ground an answer in a saved note, it must say so honestly — never invent an answer.

> ### Why this is our whole pitch now
>
> "Chat with your PDF" is the most saturated LLM app genre in existence. Judges have seen a thousand. **We are not submitting a notes app — we are submitting an AI that refuses to answer.**
>
> For a student revising for an exam, a confident wrong answer is worse than no answer. Every other RAG app hallucinates confidently. Ours is _engineered to decline_. Retrieval is a hard gate, not a suggestion.
>
> **Every engineering decision must protect the refusal.** If a feature makes it easier for the model to fill a gap from general knowledge, it is a regression even if it "works."

### Product Pillars (what judges see on screen)

The design and the engineering must make each pillar visible. If a judge cannot see the pillar, we lose the point.

| Pillar       | What it means                  | How the app must show it                                                 |
| ------------ | ------------------------------ | ------------------------------------------------------------------------ |
| 🧠 Memory    | The app remembers saved notes  | A live **Memory Panel** where saved notes are always visible             |
| 👁️ Attention | It focuses on what matters     | Dashboard highlights **weak topics** & **upcoming deadlines**            |
| ⚡ Action    | It does things for the student | Obvious buttons: **Ask a Question**, **Generate Quiz**, **Add Reminder** |
| 📈 Learning  | The student improves over time | Progress bars, streaks, and a **topics mastered** view                   |
| 🛑 Honesty   | It admits what it doesn't know | The honest fallback is a **designed, beautiful state** — not an error    |

### Design mood

Clean, modern, calm. Think **Notion + Duolingo**. One accent colour, lots of white space, rounded corners, soft shadows, and a confident **light + dark mode**. The interface must reduce exam anxiety, not add to it. Every screen answers one question instantly: _"what do I do next?"_

---

## Hackathon Submission & Judging (ALWAYS KEEP IN MIND)

This is a **competition build for OpenAI Build Week**. Re-read this before starting any feature and weigh every engineering/design decision against how it scores.

### ⚠️ Rules we cannot break

| Requirement                    | Detail                                                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deadline**                   | **July 21, 5:00 PM PT** = July 22, 2:00 AM Nigeria time. Submit ≥2h early.                                                                         |
| **One category**               | **Education.** One project = one prize. No stacking.                                                                                               |
| **Demo video**                 | **Under 3 minutes.** Public on YouTube. **Must include audio** covering what we built **and how we used Codex and GPT-5.6**. No copyrighted music. |
| **Code repo**                  | Public with a license, **or** private + shared with `testing@devpost.com` and `build-week-event@openai.com`.                                       |
| **README must document Codex** | **Scored.** See "The Codex Log" below.                                                                                                             |
| **Fresh repo**                 | All commits dated inside the submission period (opened July 13). See "Why a fresh repo".                                                           |
| **English**                    | All submission materials in English.                                                                                                               |

### What we must submit

- GitHub repo
- Demo video (< 3 min, with audio narration, public on YouTube)
- Text description of features and functionality
- **README documenting our Codex collaboration** ← keep the log running as we build
- Devpost submission at openai.devpost.com

### Judging criteria — four, EQUALLY weighted

> **This replaced a 100-point rubric where 30 points came from "use the runtime as much as possible."**
> **That lever no longer exists.** Do not route work through GPT-5.6 to inflate a call count — it is
> not scored, and it now costs real money. Route work through GPT-5.6 when it is the _right tool_, and
> use it _deeply_.

| Criterion                        | What it means for our build                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Technological Implementation** | How thoroughly and skillfully does it use GPT-5.6? Does the code reflect genuine effort and a working, non-trivial implementation? Our answer: real vector RAG with a retrieval gate, vision, audio, structured generation — not one API call in a trench coat.                 |
| **Design**                       | A **working, runnable** project with a **complete, coherent product experience** — not a proof of concept. Our answer: onboarding, 5 tabs, 4 add-methods, quizzes, deadlines, streaks, light+dark. We already have this. **This is our strongest criterion — do not break it.** |
| **Potential Impact**             | A **credible, specific** case for solving a real problem for a **real audience**. Our answer: students who fail not from lack of effort but from revising the wrong material — and who cannot afford a confidently wrong answer the night before an exam.                       |
| **Quality of the Idea**          | **Creative, non-obvious** use of GPT-5.6 + genuine understanding of the problem space. **This is our weakest criterion.** Our answer is the refusal mechanic. Lead with it everywhere.                                                                                          |

### Standing implications for how we build

- **Depth over breadth.** One deeply-engineered grounding pipeline beats six shallow API calls.
- **Protect the complete-product score.** A crash-free, fully-working demo path beats a new half-built feature. If a feature isn't finished by Day 5, cut it.
- **The refusal is the pitch.** Any polish spent making the honest fallback beautiful is polish spent on our weakest criterion. It is high-leverage.
- **Hero moments for the video:** (1) **Ask → grounded answer + tag**, (2) **the refusal** — ask something the notes don't cover and show it decline, (3) **Scan/Record** — AI reads your material.
- **Keep the Codex log current from Day 1.** Written on the last day from memory, it will be generic and score badly.

---

## Tech Stack

Use the following stack:

- Expo
- React Native
- TypeScript
- Expo Router
- NativeWind / Tailwind CSS
- Zustand
- AsyncStorage
- **OpenAI API** — GPT-5.6 for chat/vision/generation, plus transcription and embeddings
- SQLite (via `expo-sqlite`) for local note, chunk, deadline, and quiz storage
- `expo-document-picker` for file (PDF / doc) upload
- `expo-camera` + `expo-image-picker` for photo / scan (OCR)
- `expo-audio` for class-recording audio capture and waveform / PCM streaming
- `expo-notifications` for deadline reminders
- `@expo-google-fonts/inter` (or Plus Jakarta Sans) for the geometric-sans typeface

Use the standard `openai` JS client or plain `fetch`. Prefer a single thin client in `lib/ai.ts`.

Do not introduce new major libraries unless there is a strong reason. Always ask before installing.

---

## Development Philosophy

Build feature by feature.

For every feature:

1. Understand the user request.
1. Check this file before coding.
1. Keep the implementation simple.
1. Avoid overengineering.
1. Prefer readable code over clever code.
1. Build the smallest useful version first.
1. Refactor only when repetition or complexity appears.
1. Keep the app easy to teach and explain.

---

## Decision Making & Clarifications

If something is unclear or could be improved:

- Proactively suggest better approaches
- If a new library would significantly simplify implementation:
  - Recommend it
  - Explain why it is useful
  - Ask for permission before installing

Example:

> "This could be done manually, but react-native-reanimated would make the 'note flying into the Memory Panel' animation smoother. Do you want me to add it?"

Do not install or use new libraries without user approval.

---

## Architecture Guidelines

```
app/
  (onboarding)/
    welcome.tsx        — intro + value promise + GET STARTED
    about.tsx          — name + what they're studying for
    first-note.tsx     — add first note, animate into Memory
  (tabs)/
    index.tsx          — HOME (Dashboard)
    ask.tsx            — ASK (Chat / the star)
    memory.tsx         — MEMORY (Memory Panel)
    quiz.tsx           — QUIZ (quiz home)
    deadlines.tsx      — DEADLINES
  add/
    index.tsx          — choose method (4 cards)
    paste.tsx          — paste text
    upload.tsx         — upload file, extract text
    scan.tsx           — photo / scan, OCR, confirm
    record.tsx         — record class audio, transcribe
    confirm.tsx        — shared preview + title + subject + Save to memory
  quiz/
    active.tsx         — one question per screen (flashcard / MCQ)
    result.tsx         — score summary + topics to review + retry
  note/
    [id].tsx           — full note content
    pdf.tsx            — original PDF render + annotations
  deadline/
    add.tsx            — add / edit a deadline + reminder
  settings.tsx         — theme, AI model, about
components/
constants/
  colors.ts            — light + dark colour tokens
  typography.ts        — font scale
  images.ts            — centralized image imports
data/
hooks/
  useTheme.ts          — returns current theme colours
lib/
  ai.ts                — OpenAI client (was btl.ts)
  chat.ts
  embeddings.ts
  retrieval.ts
  quizgen.ts
  ocr.ts
  transcription.ts
  files.ts
  db.ts
  cn.ts
store/
  useUserStore.ts
  useNotesStore.ts
  useChatStore.ts
  useQuizStore.ts
  useDeadlinesStore.ts
  useAddNoteStore.ts
  useSettingsStore.ts
  useThemeStore.ts
types/
assets/
```

### app/

Use this for routes and screens only.

Screens compose components and call hooks/stores. They do not contain large UI blocks or business logic.

#### Screen Reference

The bottom navigation has exactly **5 tabs**: HOME · ASK · MEMORY · QUIZ · DEADLINES — plus a central **+ Add Note** action button that launches the Add Note flow. There are **more than 7 screens**; the flows below break into sub-screens.

| Screen        | Route                     | Tab       | Description                                                                                          |
| ------------- | ------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| Welcome       | `(onboarding)/welcome`    | —         | App name, calm one-line promise, 3 value rows (Remembers · Quizzes · Reminds), GET STARTED, 1/3 dots |
| About You     | `(onboarding)/about`      | —         | Friendly form: name + what they're studying for. BACK + CONTINUE                                     |
| First Note    | `(onboarding)/first-note` | —         | The magic first moment: paste box, animates into Memory Panel. "Start Studying."                     |
| Dashboard     | `(tabs)/index`            | HOME      | Warm greeting + streak, quick stat cards, Upcoming Deadlines, Weak Topics, Ask + Generate Quiz       |
| Ask / Chat ★  | `(tabs)/ask`              | ASK       | Chat; answers show "📌 From your notes" tag + source note; honest empty-note fallback                |
| Memory Panel  | `(tabs)/memory`           | MEMORY    | Scrollable list of every saved note as a card (title, source, date), search/filter bar               |
| Quiz Home     | `(tabs)/quiz`             | QUIZ      | Choose format (flashcard / MCQ), pick topic/note, Generate Quiz                                      |
| Deadlines     | `(tabs)/deadlines`        | DEADLINES | List/calendar of due dates, countdown, reminder toggle, urgency colours, Add Reminder                |
| Add — Choose  | `add/index`               | —         | Four big option cards: Paste · Upload · Photo/Scan · Record class                                    |
| Add — Paste   | `add/paste`               | —         | Large text box, fastest path                                                                         |
| Add — Upload  | `add/upload`              | —         | Pick PDF/doc, show filename + reading progress, extract text                                         |
| Add — Scan    | `add/scan`                | —         | Camera or image pick → OCR; show image + extracted text side by side to confirm                      |
| Add — Record  | `add/record`              | —         | Record live audio; waveform + timer; editable transcript when finished                               |
| Add — Confirm | `add/confirm`             | —         | Shared end state: preview text + optional title + subject tag + SAVE TO MEMORY                       |
| Quiz Active   | `quiz/active`             | —         | One question per screen, progress bar, flip flashcard / tap MCQ, immediate green/red feedback        |
| Quiz Result   | `quiz/result`             | —         | Score summary, "topics to review" suggestion, retry button, source note per question                 |
| Note Detail   | `note/[id]`               | —         | Full note content; opened from Memory or from a "From your notes" tag                                |
| PDF Reader    | `note/[id]/pdf`           | —         | Original PDF render + highlight/comment annotations                                                  |
| Add Deadline  | `deadline/add`            | —         | Title, subject, due date, reminder toggle                                                            |
| Settings      | `settings`                | —         | Profile card, AI Model section, Theme toggle, About (reached from Dashboard header gear)             |

#### Navigation Structure

```
Bottom Tab Bar (exactly 5 tabs) + center Add button:
  HOME       — house icon
  ASK        — chat bubble icon
  [ + ]      — center Add Note button (raised accent circle) → add/index
  MEMORY     — brain / stack icon
  QUIZ       — cards icon
  DEADLINES  — calendar icon

Active tab:   theme accent colour icon + label + accent dot indicator below
Inactive tab: muted gray icon + gray label
Tab bar bg:   theme.bgPrimary

The Memory Panel may render as a persistent side panel on large screens (tablet/web),
but on phones it is a tab. Design the tab version first.
```

---

## File Length & Component Extraction Rule (CRITICAL)

Screen files must not exceed **150 lines**.
Component files must not exceed **200 lines**.

If a screen file exceeds 150 lines, extract UI sections into `components/`.
If a component file exceeds 200 lines, split it into smaller sub-components.

Screen files only do three things:

1. Import components
1. Call hooks and stores
1. Compose the layout

Logic, styling, and animations belong in component files — never in screens.

Before writing any screen, **plan the component breakdown first**.
List which components you will create, build each one, then assemble the screen.

---

## Light & Dark Mode System (CRITICAL)

readIQ supports both light and dark modes. This is a core product feature, not optional — students revise late at night before exams, so dark mode is essential.

### How theming works

1. `constants/colors.ts` exports both `lightColors` and `darkColors` objects
1. `store/useThemeStore.ts` tracks the user's theme preference ('light' | 'dark' | 'system')
1. `hooks/useTheme.ts` returns the correct color object based on current preference
1. Every component receives colors via `const colors = useTheme()`
1. **Never hardcode a hex color value inside a component or screen.** Always use `colors.X`

### useTheme hook

```ts
// hooks/useTheme.ts
import { useColorScheme } from "react-native";
import { useThemeStore } from "@/store/useThemeStore";
import { lightColors, darkColors } from "@/constants/colors";

export const useTheme = () => {
  const systemScheme = useColorScheme();
  const { preference } = useThemeStore();
  const scheme = preference === "system" ? systemScheme : preference;
  return scheme === "dark" ? darkColors : lightColors;
};
```

### Color Tokens

```ts
// constants/colors.ts

export const lightColors = {
  // Backgrounds
  bgPrimary: "#ffffff", // Main screen background
  bgAlt: "#f8f9fd", // Alternate light background
  bgCard: "#f6f7fc", // Note / quiz / deadline card background
  bgCardInner: "#eceef5", // Inner / nested card background

  // Borders
  border: "#e2e4ea", // All card borders and dividers

  // Accent (indigo — one accent, used sparingly)
  accent: "#5b5bd6", // Primary buttons, links, highlights, the "From your notes" tag
  accentSoft: "#ececfb", // Selected states, accent backgrounds, tag background

  // Status
  success: "#22c55e", // Correct answers, mastered topics, streaks
  warning: "#f59e0b", // Soon-due deadlines, weak topics
  danger: "#ef4444", // This-week deadlines, failed topics, "wrong" feedback

  // Text
  textPrimary: "#1a1a2e", // Headings and body
  textSecondary: "#6b7280", // Secondary text, timestamps
  textMuted: "#a1a7b3", // Dimmed — placeholders, inactive tabs

  // Tab bar
  tabActive: "#1a1a2e",
  tabInactive: "#a1a7b3",
  tabDot: "#5b5bd6",
};

export const darkColors = {
  // Backgrounds
  bgPrimary: "#14141f", // Main screen background
  bgAlt: "#0f0f18", // Alternate dark background
  bgCard: "#1e1e2e", // Card background
  bgCardInner: "#181826", // Inner / nested card background

  // Borders
  border: "#2a2a3a", // All card borders and dividers

  // Accent (lifted indigo for dark-mode contrast)
  accent: "#7c7cf0", // Primary buttons, links, highlights, the "From your notes" tag
  accentSoft: "#2a2a4a", // Selected states, accent backgrounds, tag background

  // Status
  success: "#4ade80", // Correct answers, mastered topics, streaks
  warning: "#fbbf24", // Soon-due deadlines, weak topics
  danger: "#f87171", // This-week deadlines, failed topics, "wrong" feedback

  // Text
  textPrimary: "#f4f4f8", // Headings and body
  textSecondary: "#9aa0ad", // Secondary text, timestamps
  textMuted: "#6b7280", // Dimmed — placeholders, inactive tabs

  // Tab bar
  tabActive: "#f4f4f8",
  tabInactive: "#6b7280",
  tabDot: "#7c7cf0",
};

export type ColorTokens = typeof lightColors;
```

### Applying themes in components

```tsx
// CORRECT — always use theme tokens
import { useTheme } from "@/hooks/useTheme";

export const NoteCard = () => {
  const colors = useTheme();
  return (
    <View
      style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
    >
      <Text style={{ color: colors.textPrimary }}>Cell Biology Lecture 4</Text>
    </View>
  );
};

// WRONG — never hardcode colors
<View style={{ backgroundColor: "#1e1e2e" }}>
  <Text style={{ color: "#ffffff" }}>Cell Biology Lecture 4</Text>
</View>;
```

### NativeWind and theming

NativeWind class names cannot use dynamic theme values. For any view that
needs a theme-aware background, border, or text color: use StyleSheet with
`colors.X` from `useTheme()`.

Use NativeWind only for layout, spacing, and flex that does not change
between themes.

```tsx
// Correct — NativeWind for layout, StyleSheet for colors
<View className="flex-1 px-5 pt-4">
  <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
    <Text style={{ color: colors.textPrimary }}>Content</Text>
  </View>
</View>
```

### Theme toggle in Settings

The Settings screen has a theme toggle. When the user switches theme:

1. Save preference to useThemeStore ('light' | 'dark' | 'system')
1. Persist to AsyncStorage with key 'theme_preference'
1. All screens rerender automatically via useTheme hook

---

## UI Implementation Rules (VERY IMPORTANT)

For any UI-related task:

- Replicate the provided design exactly
- Match pixel-perfect layout, spacing, font sizes, colors, radii, shadows

When a design image is provided you MUST:

- match layout exactly
- match spacing and padding
- match font sizes and hierarchy
- match colors precisely using theme tokens (not hardcoded hex)
- match border radius and shadows
- match alignment and positioning
- replicate all visible UI elements

Do not approximate. Do not simplify unless explicitly asked.

**Polish budget:** the **Ask / Chat** screen (the "From your notes" tag **and the honest fallback**) and the **Memory Panel** are what win. Make these flawless before touching anything else. **The refusal state is not an error state — design it like a feature**, because it _is_ the feature. The **Scan** and **Record** add-note methods are the strongest secondary demo moments.

---

## Design System (Official Tokens — Do Not Change Without Approval)

### Typography

Friendly geometric sans — **Inter** or **Plus Jakarta Sans**. One family, 2–3 weights. Load via `@expo-google-fonts/*` and gate the app on `useFonts` before render.

```ts
// constants/typography.ts
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export const typography = {
  h1: { fontFamily: "Inter_700Bold", fontSize: 32, lineHeight: 38 },
  h2: { fontFamily: "Inter_700Bold", fontSize: 28, lineHeight: 34 },
  h3: { fontFamily: "Inter_700Bold", fontSize: 24, lineHeight: 30 },
  h4: { fontFamily: "Inter_600SemiBold", fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.4 },
  caption: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.4 },
  tab: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.3 },
};
```

### Spacing & Shape

```
Border radius:
  Cards:          16px
  Inner cards:    12px
  Buttons:        12px
  Pills / tags:   999px (fully rounded — the "From your notes" tag)
  Avatars:        50% (fully round)

Base spacing unit: 8px  (use multiples: 8 / 12 / 16 / 24)
Card padding:      16px
Section gap:       12px
Screen padding:    20px horizontal
White space:       generous — let screens breathe

Shadows: soft and subtle — one low-opacity drop shadow, never harsh.

Minimum touch target: 44 × 44pt
```

### Component Patterns

**FromYourNotesTag (the signature component — most important in the app):**

- A small pill below an answer: 📌 icon + "From your notes" + the source note's title
- Background: `accentSoft` · text/icon: `accent` · fully rounded (999px) · tappable → opens `note/[id]`
- Must feel calm, clear, and credible. It is the visible proof of trust.

**HonestFallback (the second most important — this is our differentiator):**

- Shown when retrieval finds nothing above threshold. **Never styled as an error.**
- Calm copy: _"I don't have that in your notes yet."_ + a clear **Add a note** CTA
- Uses `textSecondary` and `accentSoft` — never `danger`. This is the app being trustworthy, not the app failing.
- Consider a subtle, warm illustration. This is the state judges will remember.

**SourceBadge (on note cards):**

- PASTED: textMuted border + text
- FILE / PDF: accent border + text
- PHOTO / SCAN: warning border + text
- VOICE: success border + text

**DeadlineCard urgency:**

- THIS WEEK: danger border + text
- SOON: warning border + text
- LATER: textMuted border + text

**Quiz feedback:**

- CORRECT: success border + text + subtle success background
- WRONG: danger (soft) border + text, and reveal the correct answer

**WeakTopicChip:**

- danger for frequently-failed, warning for shaky topics

**Progress / Learning:**

- Progress bar fill: accent · streak flame: success · mastered topic: success

**Empty states (design every one):**

- Chat: "Ask me anything about your notes — I'll only answer from what you've saved."
- Memory: "No notes yet — add your first one!"
- Deadlines: "No deadlines saved — add your first exam date."
- Add Note: "Add your first note — paste it, upload it, snap a photo, or record your class."

---

## Image Rule

Use centralized image imports.

Before using any image asset:

1. Check if `constants/images.ts` exists
1. If it does not exist, create it
1. Import and export all images from `constants/images.ts`

```ts
// constants/images.ts
import logo from "@/assets/images/logo.png";
import onboarding from "@/assets/images/onboarding.png";

export const images = { logo, onboarding };
```

```tsx
<Image source={images.logo} />
```

Never import image assets directly inside screens or components.

---

## Styling Rules

Use NativeWind for: layout, flex, spacing, padding, margin, gap, width, height.
Use StyleSheet or inline styles for: colors (always from useTheme), shadows, animations, TextInput, SafeAreaView, KeyboardAvoidingView, Animated.View, platform-specific props.

**Never hardcode hex values.** Always use `colors.X` from `useTheme()`.

```tsx
// Layout with NativeWind, colors with StyleSheet
<View className="flex-1 px-5">
  <View
    style={{
      backgroundColor: colors.bgCard,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
    }}
  >
    <Text style={{ ...typography.bodyMd, color: colors.textPrimary }}>
      Content
    </Text>
  </View>
</View>
```

Check the NativeWind version in package.json before using any NativeWind API.
Do not upgrade NativeWind without user approval.
Reference: <https://www.nativewind.dev/v5/llms-full.txt>

---

## Style Exception Rules

| Component              | Why                             | Use Instead                     |
| ---------------------- | ------------------------------- | ------------------------------- |
| `SafeAreaView`         | className not supported         | Inline styles or StyleSheet     |
| `Button`               | Cannot customize with className | `TouchableOpacity`              |
| `KeyboardAvoidingView` | Behavior props                  | Inline styles or StyleSheet     |
| `Modal`                | visible, transparent props      | Inline styles                   |
| `ScrollView`           | contentContainerStyle           | StyleSheet                      |
| `TextInput`            | underlineColorAndroid           | Inline styles                   |
| `Animated.View`        | Animated values                 | StyleSheet                      |
| Dynamic styles         | Runtime calculation             | StyleSheet.create() or inline   |
| Shadows                | iOS/Android differ              | StyleSheet with platform checks |
| Transforms             | Complex combinations            | StyleSheet                      |
| Theme colors           | Dynamic values                  | StyleSheet with useTheme()      |

---

## UI Quality Bar

The app should feel:

- calm, trustworthy, and organized (a study partner that never makes things up)
- polished in both light and dark mode
- friendly and low-anxiety for stressed students
- mobile-first

Use:

- rounded cards
- soft shadows (theme-aware)
- generous white space
- large touch targets (44×44pt minimum)
- readable font sizes (15–16pt minimum body)
- high contrast in both themes
- simple Animated transitions (especially the note "flying into" the Memory Panel)
- friendly empty states

---

## data/

```
data/
  addMethods.ts        — the four Add Note methods (paste / upload / scan / record)
  onboardingSteps.ts   — static onboarding content (3 steps)
  subjects.ts          — subject tags for notes and quizzes
  promptTemplates.ts   — system prompt templates (grounded chat, quiz gen, OCR cleanup)
```

---

## store/

```
store/
  useUserStore.ts       — name, what they're studying for, streak, stats
  useNotesStore.ts      — note list + chunks (loaded from SQLite)
  useChatStore.ts       — chat messages, sending state, current citations
  useQuizStore.ts       — current quiz, questions, index, score, weak topics
  useDeadlinesStore.ts  — deadlines, reminder state
  useAddNoteStore.ts    — draft note during the Add flow (method, raw/extracted text, title, subject)
  useSettingsStore.ts   — app preferences (AI model, etc.)
  useThemeStore.ts      — 'light' | 'dark' | 'system', persisted
```

Persist lightweight values with AsyncStorage (profile, settings, theme). Notes, chunks, embeddings, deadlines, and quiz history go to SQLite.

---

## lib/

```
lib/
  ai.ts              — OpenAI client init (base URL + key via proxy)  [renamed from btl.ts]
  chat.ts            — grounded chat: retrieve → build context → completion with citations
  embeddings.ts      — embed text via OpenAI, cosine similarity helper
  retrieval.ts       — chunk notes, store/query vectors, top-K retrieval
  quizgen.ts         — generate flashcards / MCQs from notes (structured JSON)
  ocr.ts             — image → text via GPT-5.6 vision
  transcription.ts   — class audio → text via OpenAI transcription
  files.ts           — extract text from uploaded PDF / doc
  docx-extract.ts    — local .docx text extraction (jszip) — KEEP, still correct
  document-extract.ts— orchestrator: routes each picked file to the right extractor
  db.ts              — SQLite helpers (never write raw SQL in screens)
  cn.ts              — NativeWind class merge utility
```

The API key never lives in the app — see "API Key Security" below. `lib/ai.ts` points at our proxy.

---

## State Management Rules

- Zustand: all global client state
- Local useState: temporary UI state (modal open, loading, flashcard flipped, etc.)
- AsyncStorage: lightweight persistence (profile, settings, theme)
- SQLite: notes, chunks/embeddings, deadlines, quiz history

---

## TypeScript Rules

Use TypeScript strictly. Avoid `any`. Keep types simple.

```ts
// types/note.ts
export type NoteSource = "paste" | "file" | "scan" | "voice";

export type Note = {
  id: string;
  title: string;
  subject: string | null;
  content: string;
  source: NoteSource;
  createdAt: string;
};

export type NoteChunk = {
  id: string;
  noteId: string;
  text: string;
  embedding: number[]; // JSON float array, for cosine similarity retrieval
};

// types/chat.ts
export type Role = "user" | "assistant";

export type Citation = {
  noteId: string;
  noteTitle: string;
  snippet: string;
};

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  grounded: boolean; // true only when backed by retrieved notes
  citations: Citation[]; // shown as "📌 From your notes" tags
  createdAt: string;
};

// types/quiz.ts
export type QuizFormat = "flashcard" | "mcq";

export type QuizQuestion = {
  id: string;
  format: QuizFormat;
  prompt: string;
  answer: string;
  options?: string[]; // MCQ only
  sourceNoteId: string;
  sourceNoteTitle: string;
};

export type QuizResult = {
  total: number;
  correct: number;
  weakTopics: string[]; // subjects/topics to review
  questions: QuizQuestion[];
};

// types/deadline.ts
export type Urgency = "thisWeek" | "soon" | "later";

export type Deadline = {
  id: string;
  title: string;
  subject: string | null;
  dueDate: string;
  reminderOn: boolean;
  urgency: Urgency; // derived from dueDate
};

// types/user.ts
export type UserProfile = {
  name: string;
  studyingFor: string; // course or exam
  streak: number;
  createdAt: string;
};

// types/theme.ts
export type ThemePreference = "light" | "dark" | "system";
export type ColorTokens = typeof import("@/constants/colors").lightColors;
```

---

## Feature Implementation Rules

When the user asks to build a feature:

1. Read this file first
1. Identify files to change
1. Plan component breakdown before writing code
1. Keep changes focused
1. Follow existing patterns
1. Ensure feature works end-to-end
1. Fix errors before finishing
1. **Append a line to `NOTES.md`** — what Codex did, what we decided, and why

### Why a fresh repo (READ THIS)

The existing readIQ repo's last commit is dated **2026-07-07** — before the Build Week submission period opened on **July 13**. Build Week rules require pre-existing projects to prove Codex/GPT-5.6 use _inside_ the submission period with timestamped session logs or dated commit history, and to clearly document prior vs. new work.

**We are building in a fresh repo, committing from Day 1 forward.** We own our prior design work and reuse our own patterns freely — this is our code. But the commit history must be unambiguous.

**Be honest about the lineage in the README.** "We built this on a different runtime and rebuilt it on GPT-5.6, which unlocked real vector retrieval and native audio that our previous gateway could not do" is a _strength_: it demonstrates genuine understanding of the problem space, which is literally a judging criterion.

### Build Roadmap & Progress (living checklist — keep it current)

Work top-to-bottom, one phase at a time. When a phase is done and tested, flip its box to `[x]` and add a one-line note. **Do not start the next phase if the current one is broken.**

> **We have 6 days, and Phases 0–8 of the previous build already exist as working code we wrote.**
> This is our unfair advantage. **Do not squander it by adding scope.** The migration is small; the
> time it frees goes into Phase M3 — the thing that beats the "chat with your PDF" saturation problem.

|     | Phase                       | What it delivers                                                                                                                                                                   | GPT-5.6 usage                 | Status           |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------- |
| ⬜  | M0 · Unblock                | Devpost registration · **$100 credits form (deadline July 17, 12pm PT)** · read GPT-5.6 API docs · fresh repo, first commit                                                        | —                             | **DO TODAY**     |
| ⬜  | M1 · Migration              | `lib/btl.ts` → `lib/ai.ts`; proxy stands up; swap chat/vision/quizgen/summary to GPT-5.6; **delete the BTL model catalog + `btl-2` references**; verify streaming shape            | chat (stream + JSON) · vision | Not started      |
| ⬜  | M2 · **Real vector RAG**    | Replace lexical scoring with true embeddings + cosine similarity + a tuned similarity **threshold**. **This is the unlock BTL denied us.** Backfill embeddings for existing notes. | embeddings                    | Not started      |
| ⬜  | M3 · **The differentiator** | The thing we build with the time migration saved. See "The Novelty Problem" below.                                                                                                 | tbd                           | **Decide Day 1** |
| ⬜  | M4 · Settings + polish      | Model picker, empty-state + refusal-state polish, animations                                                                                                                       | —                             | Not started      |
| ⬜  | M5 · Submission             | README + **Codex log**, demo video (<3 min, audio), YouTube public, Devpost submit ≥2h early                                                                                       | —                             | Not started      |

**Carried forward from the previous build (already working, do not rebuild):** UI shell + design system · SQLite persistence · grounded Ask ★ with streaming + citations · Dashboard real data · grounded quiz flow (subject → MCQs → scoring → weak topics) · deadlines with urgency + calendar · Upload (PDF + local .docx via jszip) · Scan vision OCR · Record transcription · PDF Reader with geometry-based highlight/comment annotations.

### The Novelty Problem (M3 — read before deciding)

**Our weakest criterion is Quality of the Idea.** "Chat with your notes" is the most common LLM app there is. Our refusal mechanic is a real differentiator but it is a _mechanic_, not a _feature_ — we need something a judge has not seen.

Candidate directions (pick ONE, Day 1, do not revisit):

- **Make the refusal generative.** When the notes don't cover something, don't just decline — tell the student _what's missing from their notes_. "Your notes cover glycolysis but never mention the electron transport chain — and your exam is in 4 days." That turns a refusal into the most useful thing in the app: **a gap report on your own revision.**
- **Grade the notes, not the student.** Analyse the full corpus and show coverage against their course — which lectures are thin, which are missing entirely.
- **Adversarial quiz.** Generate questions specifically targeting the weak topics _and_ the gaps.

The first one is the strongest: it is a **direct extension of the refusal**, it needs no new UI surface, and it makes our unique mechanic _productive_ rather than merely honest. It also uses GPT-5.6 for something non-obvious — reasoning about the _absence_ of information.

---

## OpenAI API Rules (CRITICAL)

All AI in the app goes through the **OpenAI API**, using **GPT-5.6**. This is the hackathon requirement: every submission must be built with Codex and GPT-5.6.

> ### ⚠️ Model names and endpoints are NOT verified in this file
>
> GPT-5.6 shipped after this document's guidance was written. The model string, the realtime/audio
> endpoints, and the exact request shapes **must be read from the live docs at
> `platform.openai.com/docs` before writing the client.** Do not guess. Do not copy a model name from
> memory. **Confirming the API surface is the first engineering task of M1.**

### What changed from the BTL runtime (and why it matters)

The previous build was crippled by two gateway limitations that **no longer exist**:

| Constraint under BTL                                                                                                                                                             | Status now                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No embedding model in the catalog** → we fell back to lexical keyword scoring for retrieval                                                                                    | **Gone.** OpenAI has text embeddings. **Build real vector RAG in M2.** This is a direct upgrade to Technological Implementation.                                        |
| **No working audio path** → `/v1/audio/transcriptions` 404'd; voxtral's 32k context = ~1 second of audio; we routed Record to OpenAI Whisper directly as the one non-BTL feature | **Gone.** Transcription is native now. The awkward exception disappears — and `lib/transcription.ts` already talks to OpenAI, so this mostly just stops being a caveat. |
| **~$0.50 of credits for the entire build**                                                                                                                                       | **$100** (request by July 17, 12pm PT; expires July 31).                                                                                                                |

### Budget discipline (relaxed, not abolished)

$100 is ~200× the old budget, so the "never spray a test call" paranoia can ease. But:

- **Embedding a large note corpus and running quizzes adds up.** Cache in SQLite so nothing is embedded or answered twice — the existing content-hash quiz cache is good engineering, keep it.
- **Check the balance daily.** Running dry on July 20 ends us. **Credits expire July 31.**
- Overage is charged to us personally. There is no free tier behind this.
- The old rule "bias every should-we-call-AI decision toward **yes**" is **revoked** — it was chasing 30 rubric points that no longer exist, and now it costs money. New rule: **call GPT-5.6 where it is the right tool, and use it deeply.**

### API Key Security (CRITICAL — stricter than before)

The previous build embedded a _scoped_ key with $0.50 of credits — an acceptable risk. **That reasoning no longer holds.** We now have $100 on a personal account, and **the repo is public for judging.**

- **Stand up a thin proxy** (one serverless route) that holds the key and forwards requests. ~1 hour with Codex.
- `lib/ai.ts` points at the proxy. **The OpenAI key never ships in the React Native bundle.** Anyone can extract a key from a bundle.
- No key in `.env` files that get committed. No key in logs. No key in the repo, ever.
- Judges read repos. A key in the client reads as amateur _and_ can be drained.

### Client setup

```ts
// lib/ai.ts
import OpenAI from "openai";

export const ai = new OpenAI({
  baseURL: process.env.EXPO_PUBLIC_AI_PROXY_URL, // our proxy — holds the real key server-side
  apiKey: "proxy", // placeholder; the proxy injects the real key
});

// ⚠️ VERIFY THESE AGAINST platform.openai.com/docs BEFORE USE — do not trust these strings.
export const CHAT_MODEL = "<gpt-5.6-model-string>";
export const EMBED_MODEL = "<embedding-model-string>";
```

### Grounded chat (the star feature)

Answers must come **only** from the student's retrieved notes. Retrieve first, then generate with the retrieved chunks as the sole context, and return the citations.

```ts
// lib/chat.ts
import { ai, CHAT_MODEL } from "./ai";
import { retrieveTopK } from "./retrieval";

export const askFromNotes = async (question: string) => {
  const hits = await retrieveTopK(question, 4); // top-K note chunks by cosine similarity

  if (hits.length === 0) {
    return {
      grounded: false,
      content: "I don't have that in your notes yet.",
      citations: [],
    };
  }

  const context = hits
    .map((h, i) => `[${i + 1}] (${h.noteTitle})\n${h.text}`)
    .join("\n\n");

  const res = await ai.chat.completions.create({
    model: CHAT_MODEL,
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "You are readIQ. Answer ONLY using the provided notes. " +
          'If the notes do not contain the answer, say "I don\'t have that in your notes yet." ' +
          "Never use outside knowledge. Never invent facts. Cite the note numbers you used.",
      },
      { role: "user", content: `Notes:\n${context}\n\nQuestion: ${question}` },
    ],
  });

  return { grounded: true, stream: res, citations: hits }; // citations → "📌 From your notes" tags
};
```

> **⚠️ A stronger model makes the grounding gate MORE important, not less.**
> GPT-5.6 knows vastly more general knowledge than `btl-2`. It is far more capable of producing a
> fluent, plausible, correct-sounding answer _without_ the notes — which is exactly the failure our
> product exists to prevent. **Do not weaken the retrieval gate because the model got smarter.**
> Re-test the refusal path explicitly after migration: ask something the notes don't cover and
> confirm it still declines.

### API Rules Summary

- All AI goes through the OpenAI API via our proxy. No key in the client.
- Use `stream: true` for chat so answers feel fast.
- Chat, quiz, OCR, and transcription models are user-selectable in Settings → AI Model.
- Show a friendly error if the API is unreachable or credits are exhausted — never a raw stack trace.
- **Verify every endpoint and model string against live docs before use.**

---

## Retrieval & Grounding Rules (RAG — the trust engine)

The promise "answers only from your notes" is delivered by retrieval, not by hoping the model behaves. This is the app's core loop.

Flow:

1. On save, split a note into small overlapping chunks (`lib/retrieval.ts`)
1. **Embed each chunk via the OpenAI embeddings API** (`lib/embeddings.ts`) and store the vector in SQLite
1. On a question, embed the query and rank chunks by **cosine similarity** — take top-K
1. If **no chunk clears the similarity threshold**, do **not** call the model — return the honest fallback: _"I don't have that in your notes yet."_ with an "Add a note" action
1. Otherwise pass only the retrieved chunks as context and generate the answer
1. Return the source notes as `citations` → rendered as "📌 From your notes: <title>" tags, each tappable to open the note

Implementation rules:

- **Retrieval is the gate.** An answer is only shown as grounded when real chunks backed it.
- **Tune the threshold deliberately in M2 and write down the number and why.** Too low → we hallucinate and lose the product. Too high → we refuse everything and look broken. This tuning is a genuine engineering contribution and belongs in the README.
- Quiz questions are generated from retrieved note chunks too — every question carries its `sourceNoteId`.
- Keep chunks small (a few sentences) with light overlap so citations point to a precise place.
- Never let the model answer from general knowledge. The system prompt forbids it _and_ retrieval enforces it.
- Store embeddings locally (SQLite) so retrieval is instant and works offline for already-saved notes.

---

## Database Rules

Use `expo-sqlite` only for structured local data.

```sql
CREATE TABLE IF NOT EXISTS notes (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  subject          TEXT,
  content          TEXT NOT NULL,
  source           TEXT NOT NULL,   -- "paste" | "file" | "scan" | "voice"
  pdf_annotations  TEXT,            -- JSON array of geometry-based annotations
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS note_chunks (
  id         TEXT PRIMARY KEY,
  note_id    TEXT NOT NULL,
  text       TEXT NOT NULL,
  embedding  TEXT NOT NULL,   -- JSON float array for cosine similarity
  FOREIGN KEY (note_id) REFERENCES notes(id)
);

CREATE TABLE IF NOT EXISTS deadlines (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  subject     TEXT,
  due_date    TEXT NOT NULL,
  reminder_on INTEGER NOT NULL DEFAULT 0   -- 0 | 1
);

CREATE TABLE IF NOT EXISTS quizzes (
  id           TEXT PRIMARY KEY,
  subject      TEXT NOT NULL,
  content_hash TEXT NOT NULL,   -- cache key: subject + note content
  questions    TEXT NOT NULL    -- JSON
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL,
  total       INTEGER NOT NULL,
  correct     INTEGER NOT NULL,
  weak_topics TEXT              -- JSON array of topic strings
);
```

All DB calls go through `lib/db.ts`. No raw SQL in screens or components.

---

## The Codex Log (REQUIRED — this is scored)

Build Week rules require the README to describe **how we collaborated with Codex** — where Codex accelerated the workflow, where **we** made the key product, engineering, and design decisions, and how GPT-5.6 and Codex shaped the result. The rules state this is an important part of how judges evaluate **Technological Implementation** and **Quality of the Idea**.

**This is a scored artifact, not paperwork.** A README written on Day 6 from memory will be generic and will score badly.

### Therefore, from Day 1:

1. **Maintain `NOTES.md`.** After every feature, append: what Codex did well, where we overrode it, what we decided and why. The existing per-phase notes in this file are exactly the right texture — that habit is already good, keep it.
2. **Commit granularly and often.** Dated commit history is evidence.
3. **Keep Codex session logs.** Save them.
4. **Record the decisions, not just the code.** The threshold tuning in M2, the choice of M3, the decision to proxy the key, the choice to keep local .docx extraction — those are _our_ judgment, and the rules specifically ask where the human made the calls.
5. **Be honest about what Codex did.** Judges can tell. Overclaiming and underclaiming both read badly.

---

## Linting and Validation

Run after every feature:

```bash
npm run lint
npm run typecheck
```

Fix all errors before considering a feature complete.

---

## Communication Style

Be concise. Explain what changed and how to test.

When a phase is complete state clearly:

> "Phase [N] is complete. Here is how to test it: …"

---

## Important Constraints

- All AI goes through the **OpenAI API** using **GPT-5.6** (hackathon requirement)
- **The API key never ships in the app** — it lives behind our proxy, server-side, and is never committed or logged
- No answer may come from outside the student's saved notes (retrieval-gated grounding)
- No separate auth service (Clerk, Firebase, etc.) for the hackathon build
- No analytics or crash reporting that ships note content off device

Use:

- SQLite for notes, chunks/embeddings, deadlines, and quiz history
- AsyncStorage for profile, settings, and theme preference
- Zustand for app state
- OpenAI API for all AI (chat, embeddings, retrieval, vision OCR, transcription)

---

## Trust & Grounding Rules (NON-NEGOTIABLE)

readIQ promises it **only answers from the student's own notes and never invents anything**. This is the emotional core of the product **and our entire competitive claim** — protect it in every feature.

- Never answer a question that retrieval could not ground in a saved note. Show the honest fallback instead.
- Every grounded answer must display its source via the "📌 From your notes" tag.
- Never let the model use outside/general knowledge to fill gaps. **GPT-5.6 is much better at plausibly filling gaps than our previous model — this raises the stakes.**
- Note content **is** sent to the OpenAI API to be embedded, retrieved, and answered — be honest about this in copy. Notes are stored locally as the source of truth; only what's needed is sent.
- Never log note content or the API key to any external service.

If a feature would let the app answer without a grounding note, stop and ask:

> "This would let the app answer from outside the student's notes, which breaks the trust promise. Can we gate it behind retrieval and show a citation instead?"

---

## Final Reminder

Before every feature implementation:

- Read this file
- Follow it strictly
- Plan component breakdown before writing any code
- Screen files max 150 lines. Component files max 200 lines.
- Never hardcode hex colors — always use `colors.X` from `useTheme()`
- Replicate UI exactly when designs are provided — match both light and dark modes
- Route all AI through the OpenAI API via the proxy, and never show an answer that retrieval could not ground in a real note
- **Append to `NOTES.md` — the Codex log is scored**
